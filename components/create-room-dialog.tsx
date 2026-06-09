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
import { PlusCircle, Calendar as CalendarIcon, ChevronDownIcon, Clock, Store, MapPin, Users } from "lucide-react";
import { createRoom, getAllCourts, getCourtBookings } from "@/lib/actions";
import { useState, useEffect } from "react";
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
import { SkeletonTable } from "@/components/ui/skeleton";
import { CourtGrid } from "./court-grid";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";

interface Court {
  id: string;
  name: string;
  address: string;
  phone: string;
  num_fields: number;
  working_start: number;
  working_end: number;
  fields_data: {
    samePrice: boolean;
    globalPrice: number;
    rowPrices: number[];
    slots: Record<string, { isAvailable: boolean; useDefaultPrice: boolean; customPrice: number }>;
  };
}

export function CreateRoomDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Date and Time state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Hiring Court integration state
  const [bookingMode, setBookingMode] = useState<"court" | "free">("court");
  const [allCourts, setAllCourts] = useState<Court[]>([]);
  const [selectedCourtValue, setSelectedCourtValue] = useState("");
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [courtBookings, setCourtBookings] = useState<Record<string, boolean>>({});
  const [isFetchingBookings, setIsFetchingBookings] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({});

  // Inputs
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [priceInput, setPriceInput] = useState(50000); // For free mode

  // Fetch all courts on open
  useEffect(() => {
    if (open) {
      const fetchCourts = async () => {
        try {
          const courts = await getAllCourts();
          setAllCourts(courts);
          if (courts.length > 0) {
            setSelectedCourtValue(`${courts[0].name} - ${courts[0].address}`);
          }
        } catch {
          toast.error("Không thể tải danh sách sân.");
        }
      };
      fetchCourts();
    }
  }, [open]);

  // Fetch bookings when selected court or date changes
  useEffect(() => {
    if (selectedCourtValue) {
      const court = allCourts.find((c) => `${c.name} - ${c.address}` === selectedCourtValue) || null;
      setSelectedCourt(court);
      setSelectedSlots({});

      if (court && date) {
        const fetchBookings = async () => {
          setIsFetchingBookings(true);
          try {
            const formattedDate = format(date, "yyyy-MM-dd");
            const bookings = await getCourtBookings(court.id, formattedDate);
            const bookingsMap: Record<string, boolean> = {};
            bookings.forEach((b: { field: number; hour: number }) => {
              bookingsMap[`${b.field}-${b.hour}`] = true;
            });
            setCourtBookings(bookingsMap);
          } catch {
            toast.error("Không thể tải thông tin lịch đặt sân.");
          } finally {
            setIsFetchingBookings(false);
          }
        };
        fetchBookings();
      } else {
        setCourtBookings({});
      }
    } else {
      setSelectedCourt(null);
      setCourtBookings({});
      setSelectedSlots({});
    }
  }, [selectedCourtValue, date, allCourts]);

  // Pricing helper
  const getCellPrice = (court: Court, field: number, hour: number) => {
    const key = `${field}-${hour}`;
    const slot = court.fields_data?.slots?.[key];
    if (slot && !slot.isAvailable) return 0;
    if (slot && !slot.useDefaultPrice) return slot.customPrice;
    if (court.fields_data?.samePrice) return court.fields_data.globalPrice;
    return court.fields_data?.rowPrices?.[field - 1] ?? court.fields_data.globalPrice;
  };

  const calculateTotalPrice = () => {
    if (!selectedCourt) return 0;
    return Object.keys(selectedSlots).reduce((sum, key) => {
      const [field, hour] = key.split("-").map(Number);
      return sum + getCellPrice(selectedCourt, field, hour);
    }, 0);
  };

  const totalPrice = calculateTotalPrice();
  const pricePerPerson = maxPlayers > 0 ? Math.round(totalPrice / maxPlayers) : 0;

  const handleCellClick = (field: number, hour: number) => {
    const key = `${field}-${hour}`;
    setSelectedSlots((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!date) {
      toast.error("Vui lòng chọn ngày");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);

    if (bookingMode === "court") {
      if (!selectedCourt) {
        toast.error("Vui lòng chọn sân cầu lông");
        setIsLoading(false);
        return;
      }

      const selectedKeys = Object.keys(selectedSlots);
      if (selectedKeys.length === 0) {
        toast.error("Vui lòng chọn ít nhất 1 ô giờ trên sân để đặt");
        setIsLoading(false);
        return;
      }

      // Calculate start and end times from selected hours
      const selectedHours = selectedKeys.map((k) => parseInt(k.split("-")[1]));
      const minHour = Math.min(...selectedHours);
      const maxHour = Math.max(...selectedHours);

      const startDate = new Date(date);
      startDate.setHours(minHour, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(maxHour + 1, 0, 0, 0);

      // Set booking info
      const slotsArray = selectedKeys.map((k) => {
        const [f, h] = k.split("-").map(Number);
        return { field: f, hour: h };
      });

      formData.set("location", `${selectedCourt.name} (${selectedCourt.address})`);
      formData.set("price", pricePerPerson.toString());
      formData.set("startTime", startDate.toISOString());
      formData.set("endTime", endDate.toISOString());
      formData.set("courtId", selectedCourt.id);
      formData.set("bookingDate", format(date, "yyyy-MM-dd"));
      formData.set("bookingSlots", JSON.stringify(slotsArray));
    } else {
      // Free Input Mode
      const [sHours, sMinutes] = startTime.split(":").map(Number);
      const startDate = new Date(date);
      startDate.setHours(sHours, sMinutes, 0, 0);
      
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
      formData.set("price", priceInput.toString());
    }

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
      <DialogContent className="max-w-[95vw] sm:max-w-[1300px] max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo trận đấu mới</DialogTitle>
            <DialogDescription>
              Lưu ý: Bạn sẽ cần đặt cọc trước 1 slot (số tiền chia đầu người) để tạo phòng.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Match Name */}
            <div className="grid gap-2">
              <Label htmlFor="title">Tên trận đấu</Label>
              <Input id="title" name="title" placeholder="Giao lưu sáng CN" required />
            </div>

            {/* Toggle Mode Button */}
            <div className="flex flex-col gap-2">
              <Label>Hình thức đặt sân</Label>
              <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setBookingMode("court")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                    bookingMode === "court" 
                      ? "bg-white dark:bg-zinc-900 shadow text-emerald-600 dark:text-emerald-400" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  Đặt sân đã đăng ký
                </button>
                <button
                  type="button"
                  onClick={() => setBookingMode("free")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                    bookingMode === "free" 
                      ? "bg-white dark:bg-zinc-900 shadow text-emerald-600 dark:text-emerald-400" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  Tự nhập địa điểm tự do
                </button>
              </div>
            </div>

            {/* Court Booking Mode Controls */}
            {bookingMode === "court" && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Registered Court via Combobox */}
                  <div className="grid gap-2">
                    <Label htmlFor="court-select" className="flex items-center gap-1">
                      <Store className="h-4 w-4 text-emerald-500" />
                      Chọn sân cầu lông
                    </Label>
                    <Combobox
                      value={selectedCourtValue}
                      onValueChange={(val) => setSelectedCourtValue(val || "")}
                    >
                      <div className="relative">
                        <ComboboxInput
                          id="court-select"
                          placeholder="Tìm sân cầu lông..."
                          className="w-full text-zinc-950 dark:text-zinc-50"
                        />
                      </div>
                      <ComboboxContent className="!w-[150%] min-w-[350px] z-[100] bg-popover text-popover-foreground border shadow-lg max-h-60 rounded-md">
                        <ComboboxList>
                          {allCourts.map((c) => (
                            <ComboboxItem
                              key={c.id}
                              value={`${c.name} - ${c.address}`}
                              className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 text-sm pr-10"
                            >
                              <span className="truncate block w-full text-left">
                                {c.name} - {c.address}
                              </span>
                            </ComboboxItem>
                          ))}
                          <ComboboxEmpty className="p-3 text-center text-sm text-zinc-500">
                            Không tìm thấy sân
                          </ComboboxEmpty>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>

                  {/* Date Picker */}
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4 text-emerald-500" />
                      Ngày chơi
                    </Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
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
                      <PopoverContent className="w-auto p-0 z-[110]" align="start">
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
                </div>

                {/* Loading Skeleton */}
                {isFetchingBookings ? (
                  <div className="flex flex-col gap-2 p-6 rounded-xl border bg-zinc-50/50 dark:bg-zinc-950/50 items-center justify-center">
                    <span className="text-xs text-zinc-500 animate-pulse font-medium">Đang tải trạng thái sân...</span>
                    <SkeletonTable />
                  </div>
                ) : selectedCourt ? (
                  /* 2D Hiring Grid */
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                        Chọn vị trí & khung giờ muốn đặt (Nhấp để chọn)
                      </Label>
                      <span className="text-xs text-zinc-500">
                        Giờ hoạt động: {selectedCourt.working_start}h - {selectedCourt.working_end}h
                      </span>
                    </div>

                    <CourtGrid
                      numFields={selectedCourt.num_fields}
                      workingStart={selectedCourt.working_start}
                      workingEnd={selectedCourt.working_end}
                      samePrice={selectedCourt.fields_data?.samePrice}
                      globalPrice={selectedCourt.fields_data?.globalPrice}
                      rowPrices={selectedCourt.fields_data?.rowPrices}
                      slots={selectedCourt.fields_data?.slots}
                      occupiedSlots={courtBookings}
                      selectedSlots={selectedSlots}
                      onCellClick={handleCellClick}
                      mode="booking"
                    />
                  </div>
                ) : (
                  <div className="p-8 border border-dashed rounded-xl text-center text-sm text-zinc-400">
                    Vui lòng chọn sân cầu lông để hiển thị sơ đồ sân.
                  </div>
                )}
              </div>
            )}

            {/* Free Booking Mode Controls */}
            {bookingMode === "free" && (
              <div className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="location" className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    Địa điểm (Sân)
                  </Label>
                  <Input id="location" name="location" placeholder="Sân cầu lông Kỳ Hòa" required={bookingMode === "free"} />
                </div>
                
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4 text-emerald-500" />
                    Ngày chơi
                  </Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
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
                      required={bookingMode === "free"}
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
                      required={bookingMode === "free"}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả chi tiết</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Ví dụ: Trình độ trung bình, giao lưu vui vẻ, chia sẻ chi phí nước uống..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
              />
            </div>

            {/* Players & Pricing */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="maxPlayers" className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-zinc-400" />
                  Số người tối đa
                </Label>
                <Input
                  id="maxPlayers"
                  name="maxPlayers"
                  type="number"
                  min="1"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 1)}
                  required
                />
              </div>

              {bookingMode === "free" ? (
                <div className="grid gap-2">
                  <Label htmlFor="price">Giá/người (VND)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              ) : (
                <div className="flex flex-col justify-end p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/40 text-xs">
                  <div className="flex justify-between items-center font-medium text-emerald-800 dark:text-emerald-300">
                    <span>Tổng tiền sân:</span>
                    <span className="font-bold text-sm">{totalPrice.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-emerald-900 dark:text-emerald-200 mt-1 border-t border-emerald-200 dark:border-emerald-900/60 pt-1">
                    <span>Chia/Người:</span>
                    <span className="text-base text-emerald-600 dark:text-emerald-400">{pricePerPerson.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
              {isLoading 
                ? "Đang tạo..." 
                : bookingMode === "court" 
                  ? `Xác nhận & Cọc ${pricePerPerson.toLocaleString("vi-VN")}đ` 
                  : `Xác nhận & Cọc ${priceInput.toLocaleString("vi-VN")}đ`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
