'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function joinRoom(roomId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Chưa đăng nhập");

  // 1. Get room details
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) throw new Error("Không tìm thấy phòng");

  // 2. Checks
  if (room.player_registry.includes(user.id)) throw new Error("Bạn đã tham gia phòng này rồi");
  if (room.player_registry.length >= room.max_players) throw new Error("Phòng đã đầy");

  // 3. Get user balance
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) throw new Error("Không tìm thấy hồ sơ");
  if (profile.balance < room.price) throw new Error("Số dư không đủ. Vui lòng nạp thêm!");

  // 4. Atomic-ish update: Deduct balance and add to registry
  // In a real app, use a RPC/Stored procedure for atomicity
  const { error: deductError } = await supabase
    .from("profiles")
    .update({ balance: profile.balance - room.price })
    .eq("id", user.id);

  if (deductError) throw new Error("Lỗi khi trừ tiền");

  const { error: joinError } = await supabase
    .from("rooms")
    .update({ 
      player_registry: [...room.player_registry, user.id] 
    })
    .eq("id", roomId);

  if (joinError) {
    // Rollback balance if join fails (crude)
    await supabase.from("profiles").update({ balance: profile.balance }).eq("id", user.id);
    throw new Error("Lỗi khi tham gia phòng");
  }

  revalidatePath("/dashboard");
}

export async function leaveRoom(roomId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Chưa đăng nhập");

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) throw new Error("Không tìm thấy phòng");
  if (!room.player_registry.includes(user.id)) throw new Error("Bạn chưa tham gia phòng này");

  // 1. Remove from registry (or delete the room if empty)
  const newRegistry = room.player_registry.filter((id: string) => id !== user.id);
  
  if (newRegistry.length === 0) {
    const { error: deleteError } = await supabase
      .from("rooms")
      .delete()
      .eq("id", roomId);
    if (deleteError) throw new Error("Lỗi khi rời và hủy phòng");
  } else {
    const { error: leaveError } = await supabase
      .from("rooms")
      .update({ player_registry: newRegistry })
      .eq("id", roomId);
    if (leaveError) throw new Error("Lỗi khi rời phòng");
  }

  // 2. Refund balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({ balance: profile.balance + room.price })
      .eq("id", user.id);
  }

  revalidatePath("/dashboard");
}

export async function createRoom(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Chưa đăng nhập");

  const title = formData.get("title") as string;
  const location = formData.get("location") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const price = parseInt(formData.get("price") as string);
  const maxPlayers = parseInt(formData.get("maxPlayers") as string) || 4;
  const description = formData.get("description") as string;

  // Court booking specific fields
  const courtId = formData.get("courtId") as string || null;
  const bookingDate = formData.get("bookingDate") as string || null;
  const bookingSlotsRaw = formData.get("bookingSlots") as string || null;
  const bookingSlots = bookingSlotsRaw ? JSON.parse(bookingSlotsRaw) : [];

  // Wallet check for creator deposit
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.balance < price) {
    throw new Error("Số dư không đủ để đặt cọc phòng!");
  }

  // 1. Deduct price
  await supabase
    .from("profiles")
    .update({ balance: profile.balance - price })
    .eq("id", user.id);

  // 2. Create room
  const { error } = await supabase.from("rooms").insert({
    title,
    location,
    start_time: startTime,
    end_time: endTime,
    price,
    max_players: maxPlayers,
    player_registry: [user.id], // Creator is auto-joined
    description: description || null,
    court_id: courtId || null,
    booking_date: bookingDate || null,
    booking_slots: bookingSlots
  });

  if (error) throw error;

  revalidatePath("/dashboard");
}

export async function topUpBalance() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Chưa đăng nhập");

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Không tìm thấy hồ sơ");

  const { error } = await supabase
    .from("profiles")
    .update({ balance: profile.balance + 200000 })
    .eq("id", user.id);

  if (error) throw new Error("Lỗi khi nạp tiền");

  revalidatePath("/dashboard");
}

export async function topUpCustomBalance(amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Chưa đăng nhập");
  if (isNaN(amount) || amount <= 0) throw new Error("Số tiền không hợp lệ");

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Không tìm thấy hồ sơ");

  const { error } = await supabase
    .from("profiles")
    .update({ balance: profile.balance + amount })
    .eq("id", user.id);

  if (error) throw new Error("Lỗi khi nạp tiền");

  revalidatePath("/dashboard");
}

export async function updateProfile(fullName: string, skillLevel: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Chưa đăng nhập");
  if (!fullName.trim()) throw new Error("Họ và tên không được để trống");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      skill_level: skillLevel,
    })
    .eq("id", user.id);

  if (error) throw new Error("Lỗi khi cập nhật hồ sơ");

  revalidatePath("/dashboard");
}

export async function createCourt(
  name: string,
  address: string,
  phone: string,
  numFields: number,
  workingStart: number,
  workingEnd: number,
  fieldsData: unknown
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Chưa đăng nhập");
  if (!name.trim()) throw new Error("Tên sân không được để trống");
  if (!address.trim()) throw new Error("Địa chỉ không được để trống");
  if (!phone.trim()) throw new Error("Số điện thoại không được để trống");

  const { error } = await supabase.from("courts").insert({
    owner_id: user.id,
    name,
    address,
    phone,
    num_fields: numFields,
    working_start: workingStart,
    working_end: workingEnd,
    fields_data: fieldsData,
  });

  if (error) throw error;

  revalidatePath("/dashboard/courts");
}

export async function updateCourt(
  courtId: string,
  name: string,
  address: string,
  phone: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Chưa đăng nhập");
  if (!name.trim()) throw new Error("Tên sân không được để trống");
  if (!address.trim()) throw new Error("Địa chỉ không được để trống");
  if (!phone.trim()) throw new Error("Số điện thoại không được để trống");

  const { error } = await supabase
    .from("courts")
    .update({ name, address, phone })
    .eq("id", courtId)
    .eq("owner_id", user.id);

  if (error) throw error;

  revalidatePath("/dashboard/courts");
}

export async function getOwnerCourts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllCourts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCourtBookings(courtId: string, dateStr: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("booking_slots")
    .eq("court_id", courtId)
    .eq("booking_date", dateStr);

  if (error) throw error;

  const bookedSlots: { field: number; hour: number }[] = [];
  data?.forEach((room) => {
    const slots = room.booking_slots as { field: number; hour: number }[] | null;
    if (Array.isArray(slots)) {
      bookedSlots.push(...slots);
    }
  });

  return bookedSlots;
}
