import { createClient } from "@/lib/supabase/server";
import { RoomListClient } from "./room-list-client";

export async function RoomList() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .is("deleted_at", null)
    .order("start_time", { ascending: true });

  return <RoomListClient initialRooms={rooms || []} currentUserId={user.id} />;
}
