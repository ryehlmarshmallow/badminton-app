"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, KeyRound, Mail } from "lucide-react";

interface SettingsFormProps {
  email: string;
  initialFullName: string;
  initialSkillLevel: string;
}

export function SettingsForm({ email, initialFullName, initialSkillLevel }: SettingsFormProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [skillLevel, setSkillLevel] = useState(initialSkillLevel);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const router = useRouter();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống");
      setIsUpdatingProfile(false);
      return;
    }

    try {
      await updateProfile(fullName, skillLevel);
      toast.success("Cập nhật thông tin thành công!");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật";
      toast.error(msg);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsSendingReset(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      toast.success("Email đặt lại mật khẩu đã được gửi thành công!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi gửi yêu cầu";
      toast.error(msg);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Form */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật tên hiển thị và trình độ chơi cầu lông của bạn.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Họ và Tên</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="text-zinc-950 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillLevel" className="text-sm font-medium">Trình độ chơi</Label>
              <div className="relative">
                <select
                  id="skillLevel"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-zinc-950 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer"
                >
                  <option value="Beginner">Mới chơi (Beginner)</option>
                  <option value="Intermediate">Trung bình (Intermediate)</option>
                  <option value="Advanced">Nâng cao (Advanced)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10"
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? "Đang lưu thay đổi..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Form */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Bảo mật & Mật khẩu</CardTitle>
              <CardDescription>Đổi mật khẩu bảo mật qua hệ thống email xác nhận.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-500">Địa chỉ Email nhận thư</Label>
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border rounded-lg p-3 text-zinc-700 dark:text-zinc-300">
              <Mail className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium">{email}</span>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold">⚠️ Quy trình thay đổi mật khẩu:</p>
            <p>Hệ thống sẽ gửi email chứa liên kết đặt lại mật khẩu bảo mật tới email đã đăng ký của bạn. Vui lòng bấm vào link trong email để chuyển đến trang đặt mật khẩu mới.</p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={handlePasswordReset}
              className="w-full bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 font-bold h-10 transition-colors"
              disabled={isSendingReset}
            >
              {isSendingReset ? "Đang gửi email đặt lại mật khẩu..." : "Gửi email đặt lại mật khẩu"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
