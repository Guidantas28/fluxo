import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { PAYMENT_LABELS } from "@/lib/constants";
import type { PaymentMethod, Sale } from "@/types/database";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfDay(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toISOString();
}

function endOfDay(isoDate: string) {
  const d = new Date(isoDate + "T23:59:59.999");
  return d.toISOString();
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; payment?: string }>;
}) {
  const sp = await searchParams;
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const fromDate = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : toISODate(firstOfMonth);
  const toDate = sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : toISODate(today);
  const paymentFilter = sp.payment as PaymentMethod | undefined;
  const paymentValid =
    paymentFilter &&
    ["cash", "pix", "debit_card", "credit_card", "other"].includes(paymentFilter);

  const supabase = await createClient();
  const start = startOfDay(fromDate);
  const end = endOfDay(toDate);

  let salesQuery = supabase
    .from("sales")
    .select("id,total_amount,payment_method,status,created_at")
    .eq("status", "completed")
    .gte("created_at", start)
    .lte("created_at", end);

  if (paymentValid) {
    salesQuery = salesQuery.eq("payment_method", paymentFilter);
  }

  const { data: salesRows, error } = await salesQuery;

  if (error) {
    return (
      <Card>
        <p className="text-sm text-red-600">{error.message}</p>
      </Card>
    );
  }

  const sales = (salesRows ?? []) as Sale[];
  const totalSold = sales.reduce((a, s) => a + Number(s.total_amount), 0);
  const count = sales.length;

  const byPayment: Record<string, number> = {};
  for (const s of sales) {
    const k = s.payment_method;
    byPayment[k] = (byPayment[k] ?? 0) + Number(s.total_amount);
  }

  const saleIds = sales.map((s) => s.id);
  type ItemRow = {
    product_id: string;
    product_name_snapshot: string;
    quantity: number;
    subtotal: number;
  };
  let topProducts: { name: string; qty: number; revenue: number }[] = [];

  if (saleIds.length > 0) {
    const { data: items } = await supabase.from("sale_items").select("*").in("sale_id", saleIds);
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const raw of items ?? []) {
      const it = raw as ItemRow;
      const cur = map.get(it.product_id) ?? {
        name: it.product_name_snapshot,
        qty: 0,
        revenue: 0,
      };
      cur.qty += Number(it.quantity);
      cur.revenue += Number(it.subtotal);
      map.set(it.product_id, cur);
    }
    topProducts = [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }

  /* Caixa do dia (somente concluídas — RN05) */
  const dayStart = startOfDay(toISODate(today));
  const dayEnd = endOfDay(toISODate(today));
  const { data: todaySales } = await supabase
    .from("sales")
    .select("total_amount")
    .eq("status", "completed")
    .gte("created_at", dayStart)
    .lte("created_at", dayEnd);

  const todayTotal = (todaySales ?? []).reduce((a, r) => a + Number((r as { total_amount: number }).total_amount), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Relatórios</h1>
        <p className="text-sm text-zinc-500">Apenas vendas concluídas entram no caixa (RN05).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-zinc-500">Caixa hoje</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {todayTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Período — total</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {totalSold.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Vendas no período</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{count}</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Ticket médio</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {count === 0
              ? "—"
              : (totalSold / count).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-4">Filtros</CardTitle>
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">De</label>
            <input
              type="date"
              name="from"
              defaultValue={fromDate}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Até</label>
            <input
              type="date"
              name="to"
              defaultValue={toDate}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Pagamento</label>
            <select
              name="payment"
              defaultValue={paymentValid ? paymentFilter : ""}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todos</option>
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((k) => (
                <option key={k} value={k}>
                  {PAYMENT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Aplicar
          </button>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Vendas por forma de pagamento</CardTitle>
          {Object.keys(byPayment).length === 0 ? (
            <p className="text-sm text-zinc-500">Sem dados no período.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((k) => {
                const v = byPayment[k];
                if (!v) return null;
                return (
                  <li key={k} className="flex justify-between gap-4 border-b border-zinc-100 py-2 dark:border-zinc-800">
                    <span>{PAYMENT_LABELS[k]}</span>
                    <span className="font-medium tabular-nums">
                      {v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Produtos mais vendidos (receita)</CardTitle>
          {topProducts.length === 0 ? (
            <p className="text-sm text-zinc-500">Sem itens no período.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topProducts.map((p) => (
                <li
                  key={p.name}
                  className="flex flex-wrap justify-between gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-zinc-500">
                    {p.qty} un. ·{" "}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {p.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
