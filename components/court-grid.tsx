"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SlotConfig {
  isAvailable: boolean;
  useDefaultPrice: boolean;
  customPrice: number;
}

interface CourtGridProps {
  numFields: number;
  workingStart: number;
  workingEnd: number;
  samePrice?: boolean;
  globalPrice?: number;
  rowPrices?: number[];
  slots?: Record<string, SlotConfig>;
  occupiedSlots?: Record<string, boolean>; // key: `${field}-${hour}`
  selectedSlots?: Record<string, boolean>; // key: `${field}-${hour}`
  onCellClick?: (fieldIndex: number, hour: number) => void;
  mode?: "owner" | "booking";
}

export function CourtGrid({
  numFields,
  workingStart,
  workingEnd,
  samePrice = true,
  globalPrice = 50000,
  rowPrices = [],
  slots = {},
  occupiedSlots = {},
  selectedSlots = {},
  onCellClick,
  mode = "owner",
}: CourtGridProps) {
  // Generate hours array 0 to 23
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Helper to format hour display (e.g. 08:00 - 09:00)
  const formatHourLabel = (h: number) => {
    const startStr = `${h.toString().padStart(2, "0")}:00`;
    const endStr = `${(h + 1).toString().padStart(2, "0")}:00`;
    return `${startStr} - ${endStr}`;
  };

  // Helper to determine the price of a cell
  const getCellPrice = (fieldIndex: number, hour: number) => {
    const key = `${fieldIndex}-${hour}`;
    const slot = slots[key];
    
    if (slot && !slot.isAvailable) return null;

    if (slot && !slot.useDefaultPrice) {
      return slot.customPrice;
    }

    if (samePrice) {
      return globalPrice;
    } else {
      return rowPrices[fieldIndex - 1] !== undefined ? rowPrices[fieldIndex - 1] : globalPrice;
    }
  };

  // Helper to determine if cell is in working hours
  const isCellInWorkingHours = (hour: number) => {
    return hour >= workingStart && hour < workingEnd;
  };

  return (
    <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/50 p-4">
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        <div className="min-w-[1200px] grid gap-y-1">
          {/* Header Row: Hours */}
          <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-x-1 items-center mb-2">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">
              Sân / Giờ
            </div>
            {hours.map((h) => {
              const inWorking = isCellInWorkingHours(h);
              return (
                <div
                  key={h}
                  className={cn(
                    "text-center text-2xs md:text-xs font-medium py-1 px-0.5 rounded transition-colors",
                    inWorking 
                      ? "text-zinc-700 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-900/80" 
                      : "text-zinc-400 dark:text-zinc-600 bg-zinc-200/20 dark:bg-zinc-900/20"
                  )}
                >
                  <div className="font-bold text-[10px]">{h}h - {h + 1}h</div>
                </div>
              );
            })}
          </div>

          {/* Grid Rows: Fields */}
          {Array.from({ length: numFields }).map((_, fIdx) => {
            const fieldNum = fIdx + 1;
            return (
              <div
                key={fIdx}
                className="grid grid-cols-[80px_repeat(24,1fr)] gap-x-1 items-stretch min-h-[60px]"
              >
                {/* Y-Axis Field Label */}
                <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  Sân {fieldNum}
                </div>

                {/* Cells for each Hour */}
                {hours.map((h) => {
                  const key = `${fieldNum}-${h}`;
                  const inWorking = isCellInWorkingHours(h);
                  const slotConfig = slots[key];
                  const isAvailable = inWorking && (!slotConfig || slotConfig.isAvailable);
                  const price = getCellPrice(fieldNum, h);
                  
                  const isOccupied = occupiedSlots[key];
                  const isSelected = selectedSlots[key];

                  // CSS classes based on state
                  let cellClasses = "";
                  let isClickable = false;

                  if (!inWorking) {
                    // Outside working hours: Dark Gray
                    cellClasses = "bg-zinc-300/40 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-600 border-dashed border-zinc-200 dark:border-zinc-800 cursor-not-allowed";
                  } else if (mode === "owner") {
                    // Owner Mode styling
                    isClickable = true;
                    if (!isAvailable) {
                      // Disabled by owner
                      cellClasses = "bg-zinc-800 dark:bg-zinc-900 text-zinc-500 border-zinc-700 dark:border-zinc-800 hover:bg-zinc-700 cursor-pointer";
                    } else {
                      // Available
                      cellClasses = cn(
                        "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-2xs",
                        isSelected && "ring-2 ring-inset ring-emerald-500 border-emerald-500 z-10 shadow-sm"
                      );
                    }
                  } else {
                    // Booking/Hiring Mode styling
                    if (!isAvailable) {
                      // Not active or disabled by owner
                      cellClasses = "bg-zinc-300/40 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-600 border-dashed border-zinc-200 dark:border-zinc-800 cursor-not-allowed";
                    } else if (isOccupied) {
                      // Booked by others
                      cellClasses = "bg-rose-100/80 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 cursor-not-allowed font-medium shadow-2xs";
                    } else if (isSelected) {
                      // Selected by current user
                      isClickable = true;
                      cellClasses = "bg-emerald-500 text-white border-emerald-600 ring-2 ring-inset ring-emerald-500 z-10 shadow-md font-bold cursor-pointer";
                    } else {
                      // Unoccupied / Free
                      isClickable = true;
                      cellClasses = "bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50 cursor-pointer shadow-2xs";
                    }
                  }

                  return (
                    <div
                      key={h}
                      onClick={() => isClickable && onCellClick?.(fieldNum, h)}
                      className={cn(
                        "flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all duration-150 select-none",
                        cellClasses
                      )}
                      title={
                        !inWorking 
                          ? "Ngoài giờ hoạt động" 
                          : isOccupied 
                            ? "Đã có người đặt" 
                            : `${formatHourLabel(h)}: ${price ? price.toLocaleString("vi-VN") + "đ" : "Không hoạt động"}`
                      }
                    >
                      {/* Price / Label */}
                      {isOccupied ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Đã đặt</span>
                      ) : isAvailable && price !== null ? (
                        <>
                          <span className={cn(
                            "text-[11px] font-bold leading-none",
                             isSelected ? "text-black dark:text-white" : "text-emerald-700 dark:text-emerald-400"
                          )}>
                            {price >= 1000 ? `${Math.round(price / 1000)}k` : `${price}đ`}
                          </span>
                          {mode === "owner" && !slotConfig?.useDefaultPrice && (
                            <span className="text-[8px] opacity-75 font-medium mt-0.5">Tùy chỉnh</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-medium">Đóng</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Legend */}
      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-zinc-300/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800" />
          <span>Ngoài giờ hoạt động / Sân đóng</span>
        </div>
        {mode === "booking" && (
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-rose-100 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50" />
            <span>Đã có người đặt</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/50" />
          <span>Sân trống (Có sẵn)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600" />
          <span>Đang chọn</span>
        </div>
      </div>
    </div>
  );
}
