import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/app/(main)/clients/client-form";
import { PAYMENT_LABELS, SALE_STATUS_LABELS } from "@/lib/constants";
import type { Client, Sale } from "@/types/database";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();

  if (error || !client) notFound();

  const { data: sales } = await supabase
    .from("sales")
    .select("id,total_amount,payment_method,status,created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const history = (sales ?? []) as Sale[];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/clients" className="text-sm text-teal-600 hover:underline">
          ← Clientes
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {(client as Client).name}
        </h1>
        <p className="text-sm text-zinc-500">Edição e histórico de compras</p>
      </div>

      <Card>
        <CardTitle className="mb-4">Dados do cliente</CardTitle>
        <ClientForm client={client as Client} />
      </Card>

      <Card>
        <CardTitle className="mb-4">Histórico de compras</CardTitle>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma venda vinculada.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {history.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Link href={`/sales/${s.id}`} className="font-medium text-teal-600 hover:underline">
                    {Number(s.total_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </Link>
                  <p className="text-zinc-500">
                    {PAYMENT_LABELS[s.payment_method]} · {SALE_STATUS_LABELS[s.status]}
                  </p>
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(s.created_at).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
