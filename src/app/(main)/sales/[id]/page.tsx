import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SaleActions } from "@/app/(main)/sales/[id]/sale-actions";
import { PAYMENT_LABELS, SALE_STATUS_LABELS } from "@/lib/constants";
import type { Sale, SaleItem } from "@/types/database";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getProfile();

  const { data: sale, error } = await supabase
    .from("sales")
    .select("*, clients(name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !sale) notFound();

  const { data: items } = await supabase.from("sale_items").select("*").eq("sale_id", id);

  const s = sale as Sale & { clients: { name: string } | null };
  const lines = (items ?? []) as SaleItem[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sales" className="text-sm text-teal-600 hover:underline">
          ← Vendas
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Venda</h1>
          <Badge variant={s.status === "completed" ? "success" : s.status === "draft" ? "muted" : "warning"}>
            {SALE_STATUS_LABELS[s.status]}
          </Badge>
        </div>
        <p className="text-sm text-zinc-500">{new Date(s.created_at).toLocaleString("pt-BR")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle className="mb-4">Itens</CardTitle>
          {lines.length === 0 ? (
            <p className="text-sm text-zinc-500">Sem itens.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
                  <th className="pb-2 pr-2">Produto</th>
                  <th className="pb-2 pr-2">Un.</th>
                  <th className="pb-2 pr-2">Qtd</th>
                  <th className="pb-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 pr-2">{l.product_name_snapshot}</td>
                    <td className="py-2 pr-2 tabular-nums">
                      {Number(l.unit_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="py-2 pr-2 tabular-nums">{Number(l.quantity)}</td>
                    <td className="py-2 tabular-nums font-medium">
                      {Number(l.subtotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-4 text-lg font-bold tabular-nums">
            Total:{" "}
            {Number(s.total_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </Card>

        <Card>
          <CardTitle className="mb-4">Resumo</CardTitle>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Pagamento</dt>
              <dd className="font-medium">{PAYMENT_LABELS[s.payment_method]}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Cliente</dt>
              <dd className="font-medium">{s.clients?.name ?? "—"}</dd>
            </div>
            {s.notes && (
              <div>
                <dt className="text-zinc-500">Observações</dt>
                <dd>{s.notes}</dd>
              </div>
            )}
          </dl>
          <SaleActions
            saleId={s.id}
            status={s.status}
            isAdmin={profile?.role === "admin"}
          />
        </Card>
      </div>
    </div>
  );
}
