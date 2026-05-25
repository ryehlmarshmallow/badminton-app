import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-bold text-emerald-600 text-lg">
              <Link href={"/"}>Badminton Connect VN</Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </nav>
        
        <div className="flex-1 flex flex-col gap-10 w-full max-w-5xl p-5 items-center justify-center">
          <Hero />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border flex flex-col gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xl">
                💳
              </div>
              <h3 className="font-bold text-lg">Ví ảo tiện lợi</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Tự động trừ tiền và hoàn trả tức thì khi tham gia hoặc rời sân. Bảo mật và minh bạch.
              </p>
            </div>
            
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border flex flex-col gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xl">
                🏸
              </div>
              <h3 className="font-bold text-lg">Ghép sân thần tốc</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Tìm kiếm các trận đấu phù hợp với trình độ của bạn chỉ trong vài cú click chuột.
              </p>
            </div>
            
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border flex flex-col gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xl">
                🏆
              </div>
              <h3 className="font-bold text-lg">Quản lý chuyên nghiệp</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Hệ thống tự động khóa sân khi đủ người, bảo vệ quyền lợi của cả chủ sân và người tham gia.
              </p>
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Badminton Connect MVP &copy; 2026
          </p>
        </footer>
      </div>
    </main>
  );
}
