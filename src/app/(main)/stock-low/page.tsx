import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProfile } from "@/lib/auth/profile";
import type { Product } from "@/types/database";

export default async function StockLowPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  const { data: rows } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .eq("control_stock", true)
    .order("stock_quantity", { ascending: true });

  const products = (rows ?? []) as Product[];
  const low = products.filter((p) => Number(p.stock_quantity) <= Number(p.minimum_stock));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Estoque baixo</h1>
        <p className="text-sm text-zinc-500">
          Produtos com estoque atual menor ou igual ao mínimo (RN04).
        </p>
      </div>

      <Card>
        <CardTitle className="mb-4">
          {low.length} produto(s) em alerta
        </CardTitle>
        {low.length === 0 ? (
          <p className="text-sm text-zinc-500">Nada por aqui. Estoque dentro do esperado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                  <th className="pb-2 pr-4 font-medium">Produto</th>
                  <th className="pb-2 pr-4 font-medium">SKU</th>
                  <th className="pb-2 pr-4 font-medium">Atual</th>
                  <th className="pb-2 pr-4 font-medium">Mínimo</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {low.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{p.name}</td>
                    <td className="py-3 pr-4 text-zinc-600">{p.sku}</td>
                    <td className="py-3 pr-4 tabular-nums">
                      <Badge variant="warning">{Number(p.stock_quantity)}</Badge>
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-zinc-600">{Number(p.minimum_stock)}</td>
                    <td className="py-3 text-right">
                      {isAdmin ? (
                        <Link href={`/products/${p.id}/edit`} className="text-teal-600 hover:underline">
                          Ajustar
                        </Link>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
