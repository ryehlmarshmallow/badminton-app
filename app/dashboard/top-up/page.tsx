import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopUpForm } from "@/components/top-up-form";

export const dynamic = "force-dynamic";

export default async function TopUpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return redirect("/onboarding");
  }

  return (
    <div className="w-full max-w-xl mx-auto py-8 px-4">
      <TopUpForm initialBalance={profile.balance} />
    </div>
  );
}
