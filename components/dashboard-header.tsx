import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { topUpBalance } from "@/lib/actions";

export async function DashboardHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const skillLabels: Record<string, string> = {
    Beginner: "Mới chơi",
    Intermediate: "Trung bình",
    Advanced: "Nâng cao",
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-xl border shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Chào {profile.full_name}!
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
            {skillLabels[profile.skill_level] || profile.skill_level}
          </Badge>
          <span className="text-zinc-500 text-sm">Thành viên chính thức</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800">
        <div className="bg-emerald-500 p-2 rounded-full text-white">
          <Wallet size={20} />
        </div>
        <div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">
            Số dư ví
          </p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {profile.balance.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="ml-4 border-l pl-4 border-emerald-200 dark:border-emerald-800">
           {/* Quick Top-up Button (MVP Dummy) */}
           <form action={topUpBalance}>
             <button type="submit" className="text-xs font-bold text-emerald-600 hover:text-emerald-500 underline underline-offset-4 decoration-2">
               Nạp nhanh 200k
             </button>
           </form>
        </div>
      </div>
    </div>
  );
}
