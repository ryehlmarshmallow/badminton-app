"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Users, LogOut, Info, Loader2 } from "lucide-react";
import { joinRoom, leaveRoom } from "@/lib/actions";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

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

export function RoomCard({ room, currentUserId }: { room: Room; currentUserId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [players, setPlayers] = useState<{ id: string; full_name: string; skill_level: string }[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  
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

  useEffect(() => {
    if (isDetailsOpen && room.player_registry.length > 0) {
      const fetchPlayers = async () => {
        setIsLoadingPlayers(true);
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, skill_level")
            .in("id", room.player_registry);
          
          if (error) throw error;
          if (data) {
            // Sort so the current user shows up first
            const sorted = [...data].sort((a, b) => {
              if (a.id === currentUserId) return -1;
              if (b.id === currentUserId) return 1;
              return 0;
            });
            setPlayers(sorted);
          }
        } catch (err) {
          console.error("Lỗi khi tải danh sách người chơi:", err);
          toast.error("Không thể tải danh sách người chơi");
        } finally {
          setIsLoadingPlayers(false);
        }
      };
      fetchPlayers();
    }
  }, [isDetailsOpen, room.player_registry, currentUserId]);

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      await joinRoom(room.id);
      toast.success("Đã tham gia phòng!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    setIsLoading(true);
    try {
      await leaveRoom(room.id);
      toast.success("Đã rời phòng thành công!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  // Removed handleCancel as any player can leave the room in the middle and it will auto-delete when empty

  return (
    <>
      <Card 
        onClick={() => setIsDetailsOpen(true)}
        className={cn(
          "overflow-hidden border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between",
          isJoined ? "border-emerald-500 shadow-md" : "border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50",
          isFull && !isJoined ? "opacity-75 grayscale" : ""
        )}
      >
        <div>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-bold truncate pr-2">{room.title}</CardTitle>
              {isFull && <Badge variant="secondary">Phòng đã đầy</Badge>}
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
        </div>
        <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 pt-4 flex gap-2">
          {isJoined ? (
            <Button 
              variant="outline" 
              className="w-full text-red-500 hover:text-red-600 border-red-200 hover:border-red-300" 
              onClick={(e) => {
                e.stopPropagation();
                setIsLeaveConfirmOpen(true);
              }}
              disabled={isLoading}
            >
              <LogOut size={16} className="mr-2" />
              Rời phòng
            </Button>
          ) : (
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700" 
              onClick={(e) => {
                e.stopPropagation();
                handleJoin();
              }}
              disabled={isLoading || isFull}
            >
              Tham gia phòng
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 p-0 shadow-2xl bg-white dark:bg-zinc-950">
          <DialogHeader className="p-6 pb-4 bg-emerald-500/10 dark:bg-emerald-500/5 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex justify-between items-start gap-4">
              <DialogTitle className="text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                {room.title}
              </DialogTitle>
              {isFull && <Badge variant="secondary" className="shrink-0">Phòng đã đầy</Badge>}
              {!isFull && <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 shrink-0">Còn chỗ</Badge>}
            </div>
            <DialogDescription className="sr-only">
              Chi tiết thông tin phòng chơi và danh sách người chơi tham gia.
            </DialogDescription>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1.5">
              <MapPin size={12} className="text-emerald-500 shrink-0" />
              <span className="font-medium text-zinc-600 dark:text-zinc-300 truncate">{room.location}</span>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Match Information Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-center">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Thời gian</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 capitalize">
                  <Calendar size={14} className="text-emerald-500 shrink-0" />
                  {formattedDate}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 ml-5">
                  {formattedTimeRange}
                </span>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-center">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Giá mỗi người</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-500">
                  {room.price.toLocaleString('vi-VN')}đ
                </span>
                <span className="text-[10px] text-zinc-400">Tự động trừ khi tham gia</span>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Info size={16} className="text-emerald-500 shrink-0" />
                Mô tả chi tiết
              </h4>
              <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 text-sm leading-relaxed">
                {room.description ? (
                  <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">{room.description}</p>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 italic text-center py-2">
                    Không có mô tả chi tiết cho trận đấu này.
                  </p>
                )}
              </div>
            </div>

            {/* Players List Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Users size={16} className="text-emerald-500 shrink-0" />
                Danh sách người chơi ({room.player_registry.length}/{room.max_players})
              </h4>

              <div className="border border-zinc-100 dark:border-zinc-850 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                {isLoadingPlayers ? (
                  <div className="flex flex-col items-center justify-center py-8 text-zinc-400 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    <span className="text-xs">Đang tải danh sách...</span>
                  </div>
                ) : players.length > 0 ? (
                  players.map((player) => {
                    const isMe = player.id === currentUserId;
                    
                    return (
                      <div key={player.id} className={cn(
                        "flex items-center justify-between p-3 transition-colors",
                        isMe ? "bg-emerald-500/5" : ""
                      )}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Avatar placeholder with initials */}
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm",
                            isMe 
                              ? "bg-gradient-to-tr from-emerald-600 to-emerald-400" 
                              : "bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                          )}>
                            {player.full_name.split(" ").pop()?.substring(0, 2).toUpperCase() || "PL"}
                          </div>
                          
                          <div className="min-w-0">
                            <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 truncate flex items-center gap-1.5">
                              {player.full_name}
                              {isMe && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 px-1.5 py-0.5 rounded-full font-medium">Bạn</span>}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-semibold border px-2 py-0.5 shrink-0",
                            player.skill_level === "Advanced" && "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-950/50",
                            player.skill_level === "Intermediate" && "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-950/50",
                            player.skill_level === "Beginner" && "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-950/50"
                          )}>
                            {player.skill_level === "Beginner" ? "Cơ bản" : player.skill_level === "Intermediate" ? "Trung bình" : "Nâng cao"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-zinc-400 italic">
                    Chưa có người chơi nào tham gia.
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/80 flex gap-3 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDetailsOpen(false)}
              className="text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50"
            >
              Đóng
            </Button>
            
            <div className="flex-1 sm:flex-initial sm:min-w-[150px]">
              {isJoined ? (
                <Button 
                  variant="outline" 
                  className="w-full text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDetailsOpen(false);
                    setIsLeaveConfirmOpen(true);
                  }}
                  disabled={isLoading}
                >
                  <LogOut size={16} className="mr-2" />
                  Rời phòng
                </Button>
              ) : (
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm" 
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsDetailsOpen(false);
                    await handleJoin();
                  }}
                  disabled={isLoading || isFull}
                >
                  Tham gia phòng
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation Dialog */}
      <Dialog open={isLeaveConfirmOpen} onOpenChange={setIsLeaveConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 p-0 shadow-2xl bg-white dark:bg-zinc-950">
          <div className="p-6 pb-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 dark:bg-red-500/10 flex items-center justify-center shrink-0">
              <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-zinc-950 dark:text-white">
                Xác nhận rời phòng
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Bạn có chắc muốn rời phòng này? Tiền sẽ được hoàn lại tự động vào ví của bạn.
              </DialogDescription>
            </div>
          </div>
          <DialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/80 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLeaveConfirmOpen(false)}
              className="text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async (e) => {
                e.stopPropagation();
                setIsLeaveConfirmOpen(false);
                await handleLeave();
              }}
              className="font-bold shadow-sm"
            >
              Rời phòng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}