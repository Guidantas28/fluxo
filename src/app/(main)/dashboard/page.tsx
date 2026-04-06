import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { WeeklyRevenueChart } from "@/components/dashboard/weekly-revenue-chart";
import { PAYMENT_LABELS, SALE_STATUS_LABELS } from "@/lib/constants";
import type { PaymentMethod, Product, SaleStatus } from "@/types/database";

type RecentSaleRow = {
  id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  created_at: string;
  clients: { name: string } | null;
};

function startEndToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function last7DayKeys() {
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const keys: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    keys.push({ key, label: labels[d.getDay()] });
  }
  return keys;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { start, end } = startEndToday();
  const dayKeys = last7DayKeys();
  const weekStart = new Date(dayKeys[0].key + "T00:00:00.000Z").toISOString();

  const [
    { count: productCount },
    { data: todaySales },
    { data: stockProducts },
    { data: recentSales },
    { data: weekSales },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("sales")
      .select("id,total_amount")
      .eq("status", "completed")
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("products")
      .select("id,name,sku,stock_quantity,minimum_stock")
      .eq("active", true)
      .eq("control_stock", true),
    supabase
      .from("sales")
      .select("id,total_amount,payment_method,status,created_at,clients(name)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("sales")
      .select("created_at,total_amount")
      .eq("status", "completed")
      .gte("created_at", weekStart),
  ]);

  const lowList =
    stockProducts?.filter((p) => Number(p.stock_quantity) <= Number(p.minimum_stock)) ?? [];

  const todayRows = todaySales ?? [];
  const revenueToday = todayRows.reduce((s, r) => s + Number(r.total_amount), 0);
  const salesTodayCount = todayRows.length;

  const saleIdsToday = todayRows.map((r) => (r as { id: string }).id).filter(Boolean);
  let topName = "—";
  let topQty = 0;
  if (saleIdsToday.length > 0) {
    const { data: topItems } = await supabase
      .from("sale_items")
      .select("product_name_snapshot, quantity")
      .in("sale_id", saleIdsToday);
    const map = new Map<string, number>();
    for (const it of topItems ?? []) {
      const row = it as { product_name_snapshot: string; quantity: string | number };
      const n = row.product_name_snapshot;
      map.set(n, (map.get(n) ?? 0) + Number(row.quantity));
    }
    for (const [name, q] of map) {
      if (q > topQty) {
        topQty = q;
        topName = name;
      }
    }
  }

  const byDay = new Map<string, number>();
  for (const row of weekSales ?? []) {
    const r = row as { created_at: string; total_amount: number };
    const k = r.created_at.slice(0, 10);
    byDay.set(k, (byDay.get(k) ?? 0) + Number(r.total_amount));
  }
  const chartPoints = dayKeys.map(({ key, label }) => ({
    label,
    value: byDay.get(key) ?? 0,
  }));

  const weekTotal = (weekSales ?? []).reduce((s, r) => s + Number((r as { total_amount: number }).total_amount), 0);

  const recent = (recentSales ?? []) as unknown as RecentSaleRow[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">Painel</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Resumo do dia e indicadores rápidos</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-blue-50 p-2 text-primary dark:bg-sky-950/50">
              <CreditCard className="size-5" />
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="size-3.5" />
              Hoje
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Vendas de hoje</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
              {revenueToday.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{salesTodayCount} vendas concluídas</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-blue-50 p-2 text-primary dark:bg-sky-950/50">
              <ShoppingCart className="size-5" />
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="size-3.5" />7d
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Receita (7 dias)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
              {weekTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
        </div>

        <Link href="/stock-low">
          <div
            className={`flex h-full flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900 ${
              lowList.length > 0
                ? "border-amber-200 dark:border-amber-900/60"
                : "border-slate-100 dark:border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Package className="size-5" />
              </div>
              {lowList.length > 0 ? (
                <Badge variant="warning">Alerta</Badge>
              ) : (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">OK</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Estoque baixo</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{lowList.length}</p>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Itens no mínimo</p>
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
              <Star className="size-5" />
            </div>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Mais vendido</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Destaque hoje</p>
            <p className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-slate-50">{topName}</p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {topQty > 0 ? `${topQty} un. vendidas` : "Sem vendas hoje"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm lg:col-span-2">
          <WeeklyRevenueChart points={chartPoints} />
        </div>

        <div className="flex flex-col gap-6 rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Ações rápidas</h3>
          <div className="flex flex-col gap-3">
            <Link
              href="/sales/new"
              className="group flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/80"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-primary dark:bg-sky-950/50">
                  <ShoppingCart className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-primary dark:text-slate-50">
                    Nova venda
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Abrir PDV</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-slate-400 dark:text-slate-500" />
            </Link>
            <Link
              href="/products"
              className="group flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/80"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-primary dark:bg-sky-950/50">
                  <Package className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-primary dark:text-slate-50">
                    Conferir estoque
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Produtos e SKUs</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-slate-400 dark:text-slate-500" />
            </Link>
            <Link
              href="/clients/new"
              className="group flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/80"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-primary dark:bg-sky-950/50">
                  <UserPlus className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-primary dark:text-slate-50">
                    Adicionar cliente
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Novo cadastro</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-slate-400 dark:text-slate-500" />
            </Link>
          </div>
          <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="rounded-lg bg-gradient-to-br from-primary to-blue-600 p-4 text-white">
              <p className="text-sm font-bold">Fluxo+</p>
              <p className="mb-3 mt-1 text-xs text-blue-100">Gestão simples para o seu negócio.</p>
              <Link
                href="/reports"
                className="block w-full rounded-md bg-white/20 py-2 text-center text-xs font-medium transition hover:bg-white/30"
              >
                Ver relatórios
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Pedidos recentes</h3>
          <Link href="/sales" className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-light">
            Ver todos
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhuma venda ainda.
                  </td>
                </tr>
              ) : (
                recent.map((s) => (
                  <tr key={s.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">
                      <Link href={`/sales/${s.id}`} className="text-primary hover:underline">
                        #{s.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{s.clients?.name ?? "—"}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          s.status === "completed" ? "success" : s.status === "draft" ? "info" : "muted"
                        }
                      >
                        {SALE_STATUS_LABELS[s.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-medium tabular-nums text-slate-900 dark:text-slate-50">
                      {Number(s.total_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">
                      {new Date(s.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Estoque baixo</h3>
            <Link href="/stock-low" className="text-sm font-semibold text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {lowList.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum produto abaixo do mínimo.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {lowList.slice(0, 5).map((p: Pick<Product, "id" | "name" | "sku" | "stock_quantity" | "minimum_stock">) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-50">{p.name}</p>
                    <p className="text-slate-500 dark:text-slate-400">SKU {p.sku}</p>
                  </div>
                  <Badge variant="warning">
                    {Number(p.stock_quantity)} / mín. {Number(p.minimum_stock)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Resumo</h3>
            <Link href="/products" className="text-sm font-semibold text-primary hover:underline">
              Catálogo
            </Link>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-slate-50">{productCount ?? 0}</span> produtos
            cadastrados no sistema.
          </p>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Pagamentos nas vendas recentes:{" "}
            {recent[0] ? PAYMENT_LABELS[recent[0].payment_method] : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
