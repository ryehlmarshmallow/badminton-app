import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.full_name) {
    return redirect("/onboarding");
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold text-emerald-600">
              <Link href={"/dashboard"}>Badminton Connect VN</Link>
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <div className="flex items-center gap-4">
                <ThemeSwitcher />
                <Suspense>
                  <AuthButton />
                </Suspense>
              </div>
            )}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-10 w-full max-w-5xl p-5">
          {children}
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
