import { DashboardHeader } from "@/components/dashboard-header";
import { RoomList } from "@/components/room-list";
import { CreateRoomDialog } from "@/components/create-room-dialog";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <Suspense fallback={<div className="h-32 w-full animate-pulse bg-zinc-100 rounded-xl" />}>
        <DashboardHeader />
      </Suspense>

      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Danh sách sân đang chờ</h2>
          <p className="text-sm text-zinc-500">Tìm và tham gia các trận đấu phù hợp với bạn</p>
        </div>
        <CreateRoomDialog />
      </div>

      <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse bg-zinc-100 rounded-xl" />)}
      </div>}>
        <RoomList />
      </Suspense>
    </div>
  );
}
