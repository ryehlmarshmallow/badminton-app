'use client';

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RoomCard } from "./room-card";

interface Room {
  id: string;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  price: number;
  max_players: number;
  player_registry: string[];
  description?: string | null;
}

interface RoomListClientProps {
  initialRooms: Room[];
  currentUserId: string;
}

export function RoomListClient({ initialRooms, currentUserId }: RoomListClientProps) {
  const [onlyJoined, setOnlyJoined] = useState(false);

  const filteredRooms = onlyJoined
    ? initialRooms.filter((room) => room.player_registry.includes(currentUserId))
    : initialRooms;

  return (
    <div className="space-y-6">
      {/* Switch filter panel */}
      <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 px-4 py-2.5 rounded-full shadow-sm w-fit transition-all hover:bg-zinc-100/50 dark:hover:bg-zinc-900/80 select-none">
        <Switch
          id="joined-filter"
          checked={onlyJoined}
          onCheckedChange={setOnlyJoined}
          className="data-[state=checked]:bg-emerald-600"
        />
        <Label htmlFor="joined-filter" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
          Chỉ hiện phòng đã tham gia
        </Label>
      </div>

      {filteredRooms.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400">
            {onlyJoined 
              ? "Bạn chưa tham gia phòng nào." 
              : "Hiện chưa có phòng nào được tạo. Hãy là người đầu tiên!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
