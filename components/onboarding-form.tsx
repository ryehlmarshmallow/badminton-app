"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function OnboardingForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [fullName, setFullName] = useState("");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOnboarding = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không tìm thấy người dùng");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName,
          skill_level: skillLevel,
        });

      if (error) throw error;
      
      window.location.href = "/dashboard";
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Chào mừng bạn!</CardTitle>
          <CardDescription className="text-center">
            Hãy hoàn tất hồ sơ để bắt đầu tham gia các trận đấu cầu lông.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOnboarding}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Họ và Tên</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Trình độ chơi</Label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={cn(
                    "flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors",
                    skillLevel === "Beginner" ? "bg-primary/10 border-primary" : "hover:bg-accent"
                  )}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="skillLevel"
                        value="Beginner"
                        checked={skillLevel === "Beginner"}
                        onChange={(e) => setSkillLevel(e.target.value)}
                        className="w-4 h-4 text-primary"
                      />
                      <span>Mới chơi (Beginner)</span>
                    </div>
                  </label>
                  <label className={cn(
                    "flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors",
                    skillLevel === "Intermediate" ? "bg-primary/10 border-primary" : "hover:bg-accent"
                  )}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="skillLevel"
                        value="Intermediate"
                        checked={skillLevel === "Intermediate"}
                        onChange={(e) => setSkillLevel(e.target.value)}
                        className="w-4 h-4 text-primary"
                      />
                      <span>Trung bình (Intermediate)</span>
                    </div>
                  </label>
                  <label className={cn(
                    "flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors",
                    skillLevel === "Advanced" ? "bg-primary/10 border-primary" : "hover:bg-accent"
                  )}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="skillLevel"
                        value="Advanced"
                        checked={skillLevel === "Advanced"}
                        onChange={(e) => setSkillLevel(e.target.value)}
                        className="w-4 h-4 text-primary"
                      />
                      <span>Nâng cao (Advanced)</span>
                    </div>
                  </label>
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang xử lý..." : "Hoàn tất"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
