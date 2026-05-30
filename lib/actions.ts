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

  if (roomError || !room) throw new Error("Không tìm thấy sân");

  // 2. Checks
  if (room.player_registry.includes(user.id)) throw new Error("Bạn đã tham gia sân này rồi");
  if (room.player_registry.length >= room.max_players) throw new Error("Sân đã đầy");

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
    throw new Error("Lỗi khi tham gia sân");
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

  if (roomError || !room) throw new Error("Không tìm thấy sân");
  if (!room.player_registry.includes(user.id)) throw new Error("Bạn chưa tham gia sân này");

  // 1. Remove from registry (or delete the room if empty)
  const newRegistry = room.player_registry.filter((id: string) => id !== user.id);
  
  if (newRegistry.length === 0) {
    const { error: deleteError } = await supabase
      .from("rooms")
      .delete()
      .eq("id", roomId);
    if (deleteError) throw new Error("Lỗi khi rời và hủy sân");
  } else {
    const { error: leaveError } = await supabase
      .from("rooms")
      .update({ player_registry: newRegistry })
      .eq("id", roomId);
    if (leaveError) throw new Error("Lỗi khi rời sân");
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

  // Wallet check for creator deposit
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.balance < price) {
    throw new Error("Số dư không đủ để đặt cọc sân!");
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
    description: description || null
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
