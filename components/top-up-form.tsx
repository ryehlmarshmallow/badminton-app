"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { topUpCustomBalance } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Check } from "lucide-react";
import { toast } from "sonner";

interface TopUpFormProps {
  initialBalance: number;
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

export function TopUpForm({ initialBalance }: TopUpFormProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(200000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const amount = selectedAmount !== null ? selectedAmount : parseInt(customAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Số tiền nạp không hợp lệ");
      setIsLoading(false);
      return;
    }

    try {
      await topUpCustomBalance(amount);
      toast.success(`Nạp thành công ${amount.toLocaleString("vi-VN")}đ vào ví!`);
      setCustomAmount("");
      setSelectedAmount(200000);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi nạp tiền";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const currentSelection = selectedAmount !== null ? selectedAmount : (parseInt(customAmount) || 0);

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden">
      <div className="bg-emerald-600 dark:bg-emerald-800 p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/30 p-3 rounded-full">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Số dư hiện tại</p>
            <p className="text-2xl font-bold">{initialBalance.toLocaleString("vi-VN")}đ</p>
          </div>
        </div>
      </div>

      <CardHeader className="pt-6">
        <CardTitle className="text-xl font-bold">Nạp tiền vào tài khoản</CardTitle>
        <CardDescription>
          Nạp tiền nhanh vào ví để đặt và tham gia các trận đấu cầu lông của bạn.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleTopUp} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Chọn số tiền nạp nhanh</Label>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`flex items-center justify-center p-3 rounded-lg border text-sm font-semibold transition-all relative ${
                    selectedAmount === amt
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "bg-transparent border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {amt.toLocaleString("vi-VN")}đ
                  {selectedAmount === amt && (
                    <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-0.5">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customAmount" className="text-sm font-medium">
              Hoặc nhập số tiền khác
            </Label>
            <div className="relative">
              <Input
                id="customAmount"
                type="number"
                placeholder="Nhập số tiền (ví dụ: 150000)"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="pr-12 text-zinc-950 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800"
                min="1000"
                step="1000"
              />
              <span className="absolute right-3 top-2.5 text-sm text-zinc-400 font-medium">đ</span>
            </div>
          </div>

          {currentSelection > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900 border rounded-lg p-3 text-sm flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span>Tổng thanh toán:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                {currentSelection.toLocaleString("vi-VN")}đ
              </span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 py-2 rounded-lg transition-colors"
            disabled={isLoading || currentSelection <= 0}
          >
            {isLoading ? "Đang xử lý giao dịch..." : `Xác nhận nạp ${currentSelection.toLocaleString("vi-VN")}đ`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
