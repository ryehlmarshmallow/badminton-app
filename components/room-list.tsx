import { createClient } from "@/lib/supabase/server";
import { RoomCard } from "./room-card";

export async function RoomList() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .is("deleted_at", null)
    .order("start_time", { ascending: true });

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-dashed">
        <p className="text-zinc-500">Hiện chưa có phòng nào được tạo. Hãy là người đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} currentUserId={user.id} />
      ))}
    </div>
  );
}
