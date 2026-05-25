import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, skill_level")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return redirect("/onboarding");
  }

  return (
    <div className="w-full max-w-xl mx-auto py-8 px-4">
      <SettingsForm
        email={user.email || ""}
        initialFullName={profile.full_name || ""}
        initialSkillLevel={profile.skill_level || "Beginner"}
      />
    </div>
  );
}
