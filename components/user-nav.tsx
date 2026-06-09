"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wallet, Settings, LogOut, ChevronDown, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

interface UserNavProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = getInitials(user.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-lg transition-colors outline-none text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white uppercase select-none">
            {initials}
          </div>
          <span>Chào, {user.name}!</span>
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-zinc-950 dark:text-zinc-50">{user.name}</p>
            <p className="text-xs leading-none text-zinc-500 truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/top-up" className="flex items-center gap-2 w-full cursor-pointer px-2 py-1.5 text-sm">
              <Wallet className="h-4 w-4 text-zinc-500" />
              <span>Nạp tiền vào ví</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/courts" className="flex items-center gap-2 w-full cursor-pointer px-2 py-1.5 text-sm">
              <Store className="h-4 w-4 text-zinc-500" />
              <span>Quản lý sân cầu</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="flex items-center gap-2 w-full cursor-pointer px-2 py-1.5 text-sm">
              <Settings className="h-4 w-4 text-zinc-500" />
              <span>Thông tin cá nhân</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 w-full cursor-pointer px-2 py-1.5 text-sm text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(name: string) {
  if (!name) return "BC";
  const cleanName = name.trim();
  if (cleanName.includes("@")) {
    return cleanName.substring(0, 2).toUpperCase();
  }
  const parts = cleanName.split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
