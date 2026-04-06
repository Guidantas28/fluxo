import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_LABELS, SALE_STATUS_LABELS } from "@/lib/constants";
import type { PaymentMethod, SaleStatus } from "@/types/database";

type SaleListRow = {
  id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  created_at: string;
  clients: { name: string } | null;
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let q = supabase
    .from("sales")
    .select("id,total_amount,payment_method,status,created_at,clients(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && ["draft", "completed", "cancelled"].includes(status)) {
    q = q.eq("status", status);
  }

  const { data: sales, error } = await q;

  if (error) {
    return (
      <Card>
        <p className="text-sm text-red-600">{error.message}</p>
      </Card>
    );
  }

  const rows = (sales ?? []) as unknown as SaleListRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Vendas</h1>
          <p className="text-sm text-zinc-500">Últimas movimentações</p>
        </div>
        <Link href="/sales/new">
          <Button>Nova venda</Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterLink href="/sales" active={!status}>
            Todas
          </FilterLink>
          <FilterLink href="/sales?status=draft" active={status === "draft"}>
            Rascunhos
          </FilterLink>
          <FilterLink href="/sales?status=completed" active={status === "completed"}>
            Concluídas
          </FilterLink>
          <FilterLink href="/sales?status=cancelled" active={status === "cancelled"}>
            Canceladas
          </FilterLink>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                <th className="pb-2 pr-4 font-medium">Data</th>
                <th className="pb-2 pr-4 font-medium">Total</th>
                <th className="pb-2 pr-4 font-medium">Pagamento</th>
                <th className="pb-2 pr-4 font-medium">Cliente</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    Nenhuma venda.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 pr-4 text-zinc-600">
                      {new Date(s.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 pr-4 font-medium tabular-nums">
                      {Number(s.total_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="py-3 pr-4">{PAYMENT_LABELS[s.payment_method]}</td>
                    <td className="py-3 pr-4 text-zinc-600">{s.clients?.name ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={s.status === "completed" ? "success" : s.status === "draft" ? "muted" : "warning"}>
                        {SALE_STATUS_LABELS[s.status]}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/sales/${s.id}`} className="text-teal-600 hover:underline">
                        Detalhes
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

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {children}
    </Link>
  );
}
