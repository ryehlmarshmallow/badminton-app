"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Users, Trash2, LogOut } from "lucide-react";
import { joinRoom, leaveRoom, cancelRoom } from "@/lib/actions";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Room {
  id: string;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  price: number;
  max_players: number;
  creator_id: string;
  player_registry: string[];
}

export function RoomCard({ room, currentUserId }: { room: Room; currentUserId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const isCreator = room.creator_id === currentUserId;
  const isJoined = room.player_registry.includes(currentUserId);
  const isFull = room.player_registry.length >= room.max_players;
  
  const startTime = new Date(room.start_time);
  const endTime = new Date(room.end_time);
  
  const formattedDate = startTime.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });

  const formattedTimeRange = `${startTime.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endTime.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      await joinRoom(room.id);
      toast.success("Đã tham gia sân!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Bạn có chắc muốn rời sân này? Tiền sẽ được hoàn lại vào ví.")) return;
    setIsLoading(true);
    try {
      await leaveRoom(room.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Hủy sân này? Tiền cọc của bạn sẽ được hoàn lại.")) return;
    setIsLoading(true);
    try {
      await cancelRoom(room.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden border-2 transition-all",
      isJoined ? "border-emerald-500 shadow-md" : "border-transparent",
      isFull && !isJoined ? "opacity-75 grayscale" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold truncate pr-2">{room.title}</CardTitle>
          {isFull && <Badge variant="secondary">Sân đã đầy</Badge>}
          {!isFull && <Badge variant="outline" className="text-emerald-600 border-emerald-600">Còn chỗ</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
            <MapPin size={16} className="mr-2 shrink-0 text-emerald-500" />
            <span className="truncate">{room.location}</span>
          </div>
          <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
            <Calendar size={16} className="mr-2 shrink-0 text-emerald-500" />
            <span className="capitalize">{formattedDate} • {formattedTimeRange}</span>
          </div>
          <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
            <Users size={16} className="mr-2 shrink-0 text-emerald-500" />
            <span>{room.player_registry.length}/{room.max_players} Người chơi</span>
          </div>
        </div>
        
        <div className="pt-2 border-t flex justify-between items-center">
          <span className="text-xs text-zinc-500 uppercase font-semibold">Giá mỗi slot</span>
          <span className="text-lg font-bold text-emerald-600">{room.price.toLocaleString('vi-VN')}đ</span>
        </div>
      </CardContent>
      <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 pt-4 flex gap-2">
        {isCreator ? (
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleCancel}
            disabled={isLoading || room.player_registry.length > 1}
          >
            <Trash2 size={16} className="mr-2" />
            Hủy sân
          </Button>
        ) : isJoined ? (
          <Button 
            variant="outline" 
            className="w-full text-red-500 hover:text-red-600 border-red-200 hover:border-red-300" 
            onClick={handleLeave}
            disabled={isLoading}
          >
            <LogOut size={16} className="mr-2" />
            Rời sân
          </Button>
        ) : (
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700" 
            onClick={handleJoin}
            disabled={isLoading || isFull}
          >
            Tham gia sân
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}