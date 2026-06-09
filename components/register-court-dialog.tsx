"use client";

import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Store, Info, Phone, MapPin, Clock } from "lucide-react";
import { createCourt, updateCourt } from "@/lib/actions";
import { CourtGrid } from "./court-grid";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SlotConfig {
  isAvailable: boolean;
  useDefaultPrice: boolean;
  customPrice: number;
}

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
    slots: Record<string, SlotConfig>;
  };
}

interface RegisterCourtDialogProps {
  court?: Court;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function RegisterCourtDialog({ court, trigger, onSuccess }: RegisterCourtDialogProps) {
  const isEdit = !!court;
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [numFields, setNumFields] = useState(2);
  const [workingStart, setWorkingStart] = useState(8);
  const [workingEnd, setWorkingEnd] = useState(22);
  
  // Pricing states
  const [samePrice, setSamePrice] = useState(true);
  const [globalPrice, setGlobalPrice] = useState(50000);
  const [rowPrices, setRowPrices] = useState<number[]>([50000, 50000]);
  const [slots, setSlots] = useState<Record<string, SlotConfig>>({});

  // Selected cell customization
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Initialize form when opening/editing
  useEffect(() => {
    if (open) {
      if (court) {
        setName(court.name);
        setAddress(court.address);
        setPhone(court.phone);
        setNumFields(court.num_fields);
        setWorkingStart(court.working_start);
        setWorkingEnd(court.working_end);
        setSamePrice(court.fields_data?.samePrice ?? true);
        setGlobalPrice(court.fields_data?.globalPrice ?? 50000);
        setRowPrices(court.fields_data?.rowPrices || Array(court.num_fields).fill(50000));
        setSlots(court.fields_data?.slots || {});
      } else {
        // Reset to default
        setName("");
        setAddress("");
        setPhone("");
        setNumFields(2);
        setWorkingStart(8);
        setWorkingEnd(22);
        setSamePrice(true);
        setGlobalPrice(50000);
        setRowPrices([50000, 50000]);
        setSlots({});
        setSelectedField(null);
        setSelectedHour(null);
      }
    }
  }, [open, court]);

  // Adjust rowPrices array length when numFields changes
  useEffect(() => {
    if (isEdit) return; // Immutable in edit mode
    setRowPrices((prev) => {
      const next = [...prev];
      if (next.length < numFields) {
        return [...next, ...Array(numFields - next.length).fill(globalPrice)];
      } else if (next.length > numFields) {
        return next.slice(0, numFields);
      }
      return next;
    });
  }, [numFields, globalPrice, isEdit]);

  // Handle cell click in grid
  const handleCellClick = (fieldIndex: number, hour: number) => {
    if (isEdit) {
      toast.info("Không thể thay đổi cấu hình lịch trình & giá của sân đã đăng ký.");
      return;
    }
    setSelectedField(fieldIndex);
    setSelectedHour(hour);
  };

  const getSelectedCellConfig = () => {
    if (selectedField === null || selectedHour === null) return null;
    const key = `${selectedField}-${selectedHour}`;
    return slots[key] || { isAvailable: true, useDefaultPrice: true, customPrice: getCellDefaultPrice(selectedField) };
  };

  const getCellDefaultPrice = (fIdx: number) => {
    return samePrice ? globalPrice : (rowPrices[fIdx - 1] ?? globalPrice);
  };

  const updateSelectedCellConfig = (updates: Partial<SlotConfig>) => {
    if (selectedField === null || selectedHour === null) return;
    const key = `${selectedField}-${selectedHour}`;
    const defaultPrice = getCellDefaultPrice(selectedField);
    
    setSlots((prev) => {
      const current = prev[key] || { isAvailable: true, useDefaultPrice: true, customPrice: defaultPrice };
      return {
        ...prev,
        [key]: { ...current, ...updates },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEdit) {
        await updateCourt(court.id, name, address, phone);
        toast.success("Cập nhật thông tin sân thành công!");
      } else {
        const fieldsData = {
          samePrice,
          globalPrice,
          rowPrices,
          slots,
        };
        await createCourt(name, address, phone, numFields, workingStart, workingEnd, fieldsData);
        toast.success("Đăng ký sân cầu lông thành công!");
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  // Selected slot configuration UI
  const cellConfig = getSelectedCellConfig();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold">
            <PlusCircle className="mr-2 h-5 w-5" />
            Đăng ký sân mới
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              <Store className="h-6 w-6 text-emerald-500" />
              {isEdit ? "Chỉnh sửa thông tin sân" : "Đăng ký sân cầu lông mới"}
            </DialogTitle>
            <DialogDescription>
              {isEdit 
                ? "Chỉnh sửa thông tin cơ bản của sân. Lưu ý: Cấu hình giá và số lượng sân tập là immutable (không thể thay đổi)."
                : "Điền thông tin chi tiết, chọn thời gian hoạt động và cấu hình bảng giá cho các sân tập."}
            </DialogDescription>
          </DialogHeader>

          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Store className="h-4 w-4 text-emerald-500" />
                Tên sân
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sân Cầu Lông Kỳ Hòa"
                required
              />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                Địa chỉ chi tiết
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="796 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-indigo-500" />
                Số điện thoại liên hệ
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numFields">Số lượng sân nhỏ (Fields)</Label>
              <Input
                id="numFields"
                type="number"
                min="1"
                max="10"
                value={numFields}
                onChange={(e) => setNumFields(parseInt(e.target.value) || 1)}
                disabled={isEdit}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="workingStart" className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  Mở cửa
                </Label>
                <select
                  id="workingStart"
                  value={workingStart}
                  onChange={(e) => setWorkingStart(parseInt(e.target.value))}
                  disabled={isEdit}
                  className="w-full h-9 px-2 rounded-md border bg-background text-sm"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>{`${h.toString().padStart(2, "0")}:00`}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workingEnd" className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-red-500" />
                  Đóng cửa
                </Label>
                <select
                  id="workingEnd"
                  value={workingEnd}
                  onChange={(e) => setWorkingEnd(parseInt(e.target.value))}
                  disabled={isEdit}
                  className="w-full h-9 px-2 rounded-md border bg-background text-sm"
                >
                  {Array.from({ length: 25 }, (_, i) => i).slice(1).map((h) => (
                    <option key={h} value={h}>{`${h.toString().padStart(2, "0")}:00`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Default Pricing (Disabled in Edit Mode) */}
          <div className={cn(
            "p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 space-y-4",
            isEdit && "opacity-60 pointer-events-none"
          )}>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Cấu hình giá mặc định</h3>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="samePrice"
                checked={samePrice}
                onCheckedChange={(checked) => setSamePrice(checked === true)}
                disabled={isEdit}
              />
              <Label htmlFor="samePrice" className="cursor-pointer font-medium text-sm">
                Tất cả các sân nhỏ có cùng giá mặc định
              </Label>
            </div>

            {samePrice ? (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="globalPrice">Giá thuê mặc định (VND/giờ)</Label>
                <Input
                  id="globalPrice"
                  type="number"
                  step="5000"
                  value={globalPrice}
                  onChange={(e) => setGlobalPrice(parseInt(e.target.value) || 0)}
                  disabled={isEdit}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: numFields }).map((_, fIdx) => (
                  <div key={fIdx} className="space-y-2">
                    <Label htmlFor={`rowPrice-${fIdx}`}>Sân {fIdx + 1} (VND/giờ)</Label>
                    <Input
                      id={`rowPrice-${fIdx}`}
                      type="number"
                      step="5000"
                      value={rowPrices[fIdx] ?? 50000}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setRowPrices((prev) => {
                          const next = [...prev];
                          next[fIdx] = val;
                          return next;
                        });
                      }}
                      disabled={isEdit}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Interactive Grid */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Bảng chi tiết thời gian & giá thuê</h3>
                <p className="text-xs text-zinc-500">
                  {isEdit 
                    ? "Xem thông tin hoạt động."
                    : "Bấm vào từng ô để thay đổi trạng thái hoạt động hoặc tùy chỉnh giá riêng cho thời điểm đó."}
                </p>
              </div>
              {isEdit && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-900/50">
                  <Info className="h-3.5 w-3.5" />
                  Read-Only Mode
                </span>
              )}
            </div>

            <CourtGrid
              numFields={numFields}
              workingStart={workingStart}
              workingEnd={workingEnd}
              samePrice={samePrice}
              globalPrice={globalPrice}
              rowPrices={rowPrices}
              slots={slots}
              selectedSlots={
                selectedField !== null && selectedHour !== null
                  ? { [`${selectedField}-${selectedHour}`]: true }
                  : {}
              }
              onCellClick={handleCellClick}
              mode="owner"
            />
          </div>

          {/* Section 4: Cell Customization Panel (Hidden in Edit Mode or if no cell selected) */}
          {!isEdit && cellConfig && selectedField !== null && selectedHour !== null && (
            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-100 dark:border-emerald-900/40">
                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Tùy chỉnh ô: Sân {selectedField} ({selectedHour.toString().padStart(2, "0")}:00 - {(selectedHour + 1).toString().padStart(2, "0")}:00)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedField(null);
                    setSelectedHour(null);
                  }}
                  className="h-7 text-emerald-700 hover:text-emerald-900"
                >
                  Đóng tùy chỉnh
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 items-end">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cellAvailable" className="text-emerald-800 dark:text-emerald-300 font-medium">Trạng thái sân</Label>
                  <div className="flex items-center gap-2 h-9">
                    <select
                      id="cellAvailable"
                      value={cellConfig.isAvailable ? "yes" : "no"}
                      onChange={(e) => updateSelectedCellConfig({ isAvailable: e.target.value === "yes" })}
                      className="h-9 rounded-md border border-emerald-200 dark:border-emerald-800 bg-background text-sm px-2 text-zinc-800 dark:text-zinc-100"
                    >
                      <option value="yes">Hoạt động (Cho thuê)</option>
                      <option value="no">Tạm đóng (Không cho thuê)</option>
                    </select>
                  </div>
                </div>

                {cellConfig.isAvailable && (
                  <>
                    <div className="flex items-center gap-2 h-9">
                      <Checkbox
                        id="cellDefaultPrice"
                        checked={cellConfig.useDefaultPrice}
                        onCheckedChange={(checked) => updateSelectedCellConfig({ useDefaultPrice: checked === true })}
                      />
                      <Label htmlFor="cellDefaultPrice" className="cursor-pointer text-emerald-800 dark:text-emerald-300 font-medium">
                        Sử dụng giá mặc định ({getCellDefaultPrice(selectedField).toLocaleString()}đ)
                      </Label>
                    </div>

                    {!cellConfig.useDefaultPrice && (
                      <div className="flex flex-col gap-1.5 max-w-[180px]">
                        <Label htmlFor="cellCustomPrice" className="text-emerald-800 dark:text-emerald-300 font-medium">Giá tùy chỉnh (VND)</Label>
                        <Input
                          id="cellCustomPrice"
                          type="number"
                          step="5000"
                          value={cellConfig.customPrice}
                          onChange={(e) => updateSelectedCellConfig({ customPrice: parseInt(e.target.value) || 0 })}
                          className="h-9 border-emerald-200 dark:border-emerald-800"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : isEdit ? "Cập nhật thông tin" : "Hoàn tất đăng ký"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
