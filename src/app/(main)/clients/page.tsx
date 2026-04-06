import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { Client } from "@/types/database";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("clients").select("*").order("name", { ascending: true });

  if (q && q.trim()) {
    const safe = q.trim().replace(/%/g, "").replace(/,/g, "");
    const term = `%${safe}%`;
    query = query.or(`name.ilike.${term},phone.ilike.${term},email.ilike.${term}`);
  }

  const { data: clients, error } = await query;

  if (error) {
    return (
      <Card>
        <p className="text-sm text-red-600">Erro: {error.message}</p>
      </Card>
    );
  }

  const rows = (clients ?? []) as Client[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Clientes</h1>
          <p className="text-sm text-zinc-500">Busca por nome, telefone ou e-mail</p>
        </div>
        <Link href="/clients/new">
          <Button>Novo cliente</Button>
        </Link>
      </div>

      <Card>
        <form className="mb-4 flex flex-wrap gap-2" method="get">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar…"
            className="min-w-[200px] flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <Button type="submit" variant="secondary" size="sm">
            Buscar
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                <th className="pb-2 pr-4 font-medium">Nome</th>
                <th className="pb-2 pr-4 font-medium">Telefone</th>
                <th className="pb-2 pr-4 font-medium">E-mail</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{c.name}</td>
                    <td className="py-3 pr-4 text-zinc-600">{c.phone ?? "—"}</td>
                    <td className="py-3 pr-4 text-zinc-600">{c.email ?? "—"}</td>
                    <td className="py-3 text-right">
                      <Link href={`/clients/${c.id}`} className="text-teal-600 hover:underline">
                        Ver / editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
