import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/app/sidebar";
import { AppHeader } from "@/components/app/app-header";
import { MainArea } from "@/components/app/main-area";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile || !profile.active) {
    redirect("/login?error=inactive");
  }

  const isAdmin = profile.role === "admin";

  return (
    <div className="flex min-h-screen bg-background-light text-slate-900 md:h-screen md:max-h-screen dark:bg-background-dark dark:text-slate-100">
      <Sidebar role={profile.role} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:overflow-hidden">
        <AppHeader
          email={user.email ?? null}
          fullName={profile.full_name}
          role={profile.role}
          isAdmin={isAdmin}
        />
        <MainArea>{children}</MainArea>
      </div>
    </div>
  );
}
