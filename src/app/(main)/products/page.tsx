import Link from "next/link";
import { Package, Search, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/database";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  let query = supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (q && q.trim()) {
    const safe = q.trim().replace(/%/g, "").replace(/,/g, "");
    const term = `%${safe}%`;
    query = query.or(`name.ilike.${term},sku.ilike.${term}`);
  }

  const { data: products, error } = await query;

  const { count: totalCatalog } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  const { data: stockRows } = await supabase
    .from("products")
    .select("stock_quantity,minimum_stock,active,control_stock")
    .eq("active", true)
    .eq("control_stock", true);
  const lowCount =
    stockRows?.filter((r) => Number(r.stock_quantity) <= Number(r.minimum_stock)).length ?? 0;

  if (error) {
    return (
      <Card>
        <p className="text-sm text-red-600">Erro ao carregar produtos: {error.message}</p>
      </Card>
    );
  }

  const rows = (products ?? []) as Product[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 md:text-3xl">Gestão de estoque</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Busque por nome ou SKU</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link href="/products/new">
              <Button className="shadow-sm shadow-primary/25">
                <Package className="size-4" />
                Novo produto
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de produtos</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{totalCatalog ?? 0}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-primary dark:bg-sky-950/50">
              <Package className="size-5" />
            </div>
          </div>
        </div>
        <Link href="/stock-low">
          <div className="h-full rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Estoque baixo</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{lowCount}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <TriangleAlert className="size-5" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      <Card>
        <form className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center" method="get">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar produtos..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="shrink-0">
            Buscar
          </Button>
        </form>

        <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/products"
            className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white shadow-sm"
          >
            Todos
          </Link>
          <Link
            href="/stock-low"
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 hover:border-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-primary/40"
          >
            Estoque baixo
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.sku}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-900 dark:text-slate-50">
                      {Number(p.sale_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                      {p.control_stock ? (
                        <>
                          {Number(p.stock_quantity)}
                          {Number(p.stock_quantity) <= Number(p.minimum_stock) && p.active && (
                            <Badge variant="warning" className="ml-2">
                              baixo
                            </Badge>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.active ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="muted">Inativo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin ? (
                        <Link href={`/products/${p.id}/edit`} className="font-semibold text-primary hover:underline">
                          Editar
                        </Link>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Somente leitura</span>
                      )}
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
