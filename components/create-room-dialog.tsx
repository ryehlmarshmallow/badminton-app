"use client";

import type { SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Calendar as CalendarIcon, ChevronDownIcon, Clock } from "lucide-react";
import { createRoom } from "@/lib/actions";
import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CreateRoomDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Date and Time state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!date) {
      toast.error("Vui lòng chọn ngày");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    // Combine date and start time
    const [sHours, sMinutes] = startTime.split(":").map(Number);
    const startDate = new Date(date);
    startDate.setHours(sHours, sMinutes, 0, 0);
    
    // Combine date and end time
    const [eHours, eMinutes] = endTime.split(":").map(Number);
    const endDate = new Date(date);
    endDate.setHours(eHours, eMinutes, 0, 0);

    if (endDate <= startDate) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu");
      setIsLoading(false);
      return;
    }
    
    formData.set("startTime", startDate.toISOString());
    formData.set("endTime", endDate.toISOString());

    try {
      await createRoom(formData);
      toast.success("Tạo trận đấu thành công!");
      setOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold">
          <PlusCircle className="mr-2 h-5 w-5" />
          Tạo Phòng Mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo trận đấu mới</DialogTitle>
            <DialogDescription>
              Lưu ý: Bạn sẽ cần đặt cọc trước 1 slot để tạo phòng.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Tên trận đấu</Label>
              <Input id="title" name="title" placeholder="Giao lưu sáng CN" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Địa điểm (Sân)</Label>
              <Input id="location" name="location" placeholder="Sân cầu lông Kỳ Hòa" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả chi tiết</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Ví dụ: Trình độ trung bình, giao lưu vui vẻ, chia sẻ chi phí nước uống..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Ngày đánh</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                    {date ? format(date, "EEEE, 'ngày' dd 'tháng' MM, yyyy", { locale: vi }) : <span>Chọn ngày</span>}
                    <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => {
                      setDate(date);
                      setIsCalendarOpen(false);
                    }}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Giờ bắt đầu
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-background"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-400" />
                  Giờ kết thúc
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-background"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Giá/người (VND)</Label>
                <Input id="price" name="price" type="number" defaultValue="50000" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxPlayers">Số người tối đa</Label>
                <Input id="maxPlayers" name="maxPlayers" type="number" defaultValue="4" required />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
              {isLoading ? "Đang tạo..." : "Xác nhận & Thanh toán cọc"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
