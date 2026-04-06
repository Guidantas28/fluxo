import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import { Card, CardTitle } from "@/components/ui/card";
import { UsersAdmin } from "@/app/(main)/users/users-admin";
import { ROLE_LABELS } from "@/lib/constants";
import type { Profile } from "@/types/database";

export default async function UsersPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const users = (rows ?? []) as Profile[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Usuários</h1>
        <p className="text-sm text-zinc-500">Somente administradores. Convites via API segura.</p>
      </div>

      <Card>
        <CardTitle className="mb-4">Novo usuário</CardTitle>
        <UsersAdmin />
      </Card>

      <Card>
        <CardTitle className="mb-4">Equipe</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                <th className="pb-2 pr-4 font-medium">Nome</th>
                <th className="pb-2 pr-4 font-medium">Perfil</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">ID</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-3 pr-4 font-medium">{u.full_name || "—"}</td>
                  <td className="py-3 pr-4">{ROLE_LABELS[u.role] ?? u.role}</td>
                  <td className="py-3 pr-4">{u.active ? "Ativo" : "Inativo"}</td>
                  <td className="py-3 font-mono text-xs text-zinc-400">{u.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
