"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import {
  Check,
  LayoutGrid,
  Minus,
  Package,
  Plus,
  ScanLine,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Client, PaymentMethod, Product } from "@/types/database";

const STORAGE_KEY = "fluxo-draft-sale-id";

type Line = {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  control_stock: boolean;
  stock_quantity: number;
};

export function NewSaleClient() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saleId, setSaleId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Pick<Client, "id" | "name">[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [finalizing, setFinalizing] = useState(false);

  const init = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErr("Sessão expirada.");
      setLoading(false);
      return;
    }

    let sid = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;

    if (sid) {
      const { data: existing } = await supabase
        .from("sales")
        .select("id,status")
        .eq("id", sid)
        .maybeSingle();
      if (!existing || existing.status !== "draft") {
        sid = null;
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    if (!sid) {
      const { data: created, error } = await supabase
        .from("sales")
        .insert({
          user_id: user.id,
          status: "draft",
          payment_method: "cash",
          total_amount: 0,
        })
        .select("id")
        .single();
      if (error || !created) {
        setErr(error?.message ?? "Não foi possível iniciar a venda.");
        setLoading(false);
        return;
      }
      sid = created.id as string;
      sessionStorage.setItem(STORAGE_KEY, sid);
    }

    setSaleId(sid);

    const [{ data: p }, { data: c }, { data: items }] = await Promise.all([
      supabase.from("products").select("*").eq("active", true).order("name"),
      supabase.from("clients").select("id,name").order("name").limit(500),
      supabase.from("sale_items").select("*").eq("sale_id", sid),
    ]);

    setProducts((p ?? []) as Product[]);
    setClients((c ?? []) as Pick<Client, "id" | "name">[]);

    const loaded = (items ?? []) as {
      id: string;
      product_id: string;
      product_name_snapshot: string;
      unit_price: number;
      quantity: number;
      subtotal: number;
    }[];

    const withStock = await Promise.all(
      loaded.map(async (row) => {
        const prod = (p ?? []).find((x) => x.id === row.product_id) as Product | undefined;
        return {
          id: row.id,
          product_id: row.product_id,
          product_name_snapshot: row.product_name_snapshot,
          unit_price: Number(row.unit_price),
          quantity: Number(row.quantity),
          subtotal: Number(row.subtotal),
          control_stock: prod?.control_stock ?? true,
          stock_quantity: Number(prod?.stock_quantity ?? 0),
        } satisfies Line;
      }),
    );
    setLines(withStock);

    const { data: saleRow } = await supabase
      .from("sales")
      .select("client_id,payment_method,notes")
      .eq("id", sid)
      .single();
    if (saleRow) {
      setClientId(saleRow.client_id ?? "");
      setPaymentMethod((saleRow.payment_method as PaymentMethod) ?? "cash");
      setNotes(saleRow.notes ?? "");
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void init();
  }, [init]);

  const filteredProducts = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return products.slice(0, 12);
    return products
      .filter((p) => p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t))
      .slice(0, 20);
  }, [products, search]);

  const total = useMemo(() => lines.reduce((s, l) => s + l.subtotal, 0), [lines]);

  async function persistSaleMeta() {
    if (!saleId) return;
    await supabase
      .from("sales")
      .update({
        client_id: clientId || null,
        payment_method: paymentMethod,
        notes: notes || null,
      })
      .eq("id", saleId);
  }

  async function addProduct(p: Product) {
    if (!saleId) return;
    setErr(null);
    const unit = Number(p.sale_price);
    const qty = 1;
    const subtotal = unit * qty;
    const { data: row, error } = await supabase
      .from("sale_items")
      .insert({
        sale_id: saleId,
        product_id: p.id,
        product_name_snapshot: p.name,
        unit_price: unit,
        quantity: qty,
        subtotal,
      })
      .select("*")
      .single();
    if (error) {
      setErr(error.message);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        id: row.id,
        product_id: p.id,
        product_name_snapshot: p.name,
        unit_price: unit,
        quantity: qty,
        subtotal,
        control_stock: p.control_stock,
        stock_quantity: Number(p.stock_quantity),
      },
    ]);
    setSearch("");
  }

  async function updateLineQty(line: Line, qty: number) {
    if (!saleId || qty <= 0) return;
    const subtotal = line.unit_price * qty;
    const { error } = await supabase
      .from("sale_items")
      .update({ quantity: qty, subtotal })
      .eq("id", line.id);
    if (error) {
      setErr(error.message);
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.id === line.id ? { ...l, quantity: qty, subtotal } : l)),
    );
  }

  async function removeLine(id: string) {
    const { error } = await supabase.from("sale_items").delete().eq("id", id);
    if (error) {
      setErr(error.message);
      return;
    }
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  async function finalize() {
    if (!saleId) return;
    setErr(null);
    if (lines.length === 0) {
      setErr("Adicione ao menos um produto.");
      return;
    }
    for (const l of lines) {
      if (l.control_stock && l.stock_quantity < l.quantity) {
        setErr(`Estoque insuficiente para "${l.product_name_snapshot}".`);
        return;
      }
    }
    setFinalizing(true);
    await persistSaleMeta();
    const { error } = await supabase.rpc("finalize_sale", { p_sale_id: saleId });
    setFinalizing(false);
    if (error) {
      setErr(error.message);
      return;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    router.push(`/sales/${saleId}`);
    router.refresh();
  }

  async function discardDraft() {
    if (!saleId) return;
    if (!confirm("Cancelar este rascunho?")) return;
    const { error } = await supabase.rpc("cancel_sale", { p_sale_id: saleId });
    if (error) {
      setErr(error.message);
      return;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    router.push("/sales");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background-light p-8 text-sm text-slate-500 dark:bg-background-dark dark:text-slate-400">
        Preparando PDV…
      </div>
    );
  }

  const payOptions: { key: PaymentMethod; label: string }[] = [
    { key: "pix", label: "PIX" },
    { key: "debit_card", label: "Cartão" },
    { key: "cash", label: "Dinheiro" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-1 flex-col bg-background-light dark:bg-background-dark md:min-h-0 md:flex-row md:overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col border-slate-200 dark:border-slate-800 md:border-r">
        <div className="shrink-0 space-y-4 p-4 pb-2 md:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800 dark:hover:text-sky-400"
              aria-label="Leitor"
            >
              <ScanLine className="size-5" />
            </button>
          </div>
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm"
            >
              <LayoutGrid className="size-4" />
              Todos os itens
            </button>
            <button
              type="button"
              disabled
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
            >
              Categorias em breve
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-0 md:p-5 md:pt-0">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => void addProduct(p)}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-primary hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500/50"
              >
                <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800">
                  <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600">
                    <Package className="size-10" />
                  </div>
                  {p.control_stock && (
                    <div className="absolute right-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-950/90 dark:text-slate-200">
                      {Number(p.stock_quantity)} em estoque
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <h3 className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">{p.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">SKU {p.sku}</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-base font-bold text-primary">
                      {Number(p.sale_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <span className="rounded-full bg-primary/10 p-1 text-primary opacity-0 transition group-hover:opacity-100">
                      <Plus className="size-4" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:w-[400px] md:border-l md:border-t-0">
        <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 md:px-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Venda atual</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">#{saleId?.slice(0, 8) ?? "—"}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/80">
            <UserPlus className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <Label className="mb-0 text-xs text-slate-500 dark:text-slate-400">Cliente</Label>
              <Select
                className="mt-1 h-9 border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-900"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Selecionar cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-5">
          {err && (
            <Alert variant="error" className="mb-3">
              {err}
            </Alert>
          )}
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Toque em um produto para adicionar.
            </p>
          ) : (
            <ul className="space-y-3">
              {lines.map((l) => (
                <li
                  key={l.id}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-white text-slate-300 shadow-sm dark:bg-slate-800 dark:text-slate-600">
                    <Package className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{l.product_name_snapshot}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {Number(l.unit_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ×{" "}
                      {l.quantity}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        onClick={() => {
                          const n = Math.max(0.001, l.quantity - 1);
                          void updateLineQty(l, n);
                        }}
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {l.quantity}
                      </span>
                      <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        onClick={() => void updateLineQty(l, l.quantity + 1)}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <p className="text-sm font-bold text-slate-900 tabular-nums dark:text-slate-50">
                      {l.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                      aria-label="Remover"
                      onClick={() => void removeLine(l.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:p-5">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
            <span className="font-semibold text-slate-900 tabular-nums dark:text-slate-50">
              {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pagamento
          </p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {payOptions.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setPaymentMethod(o.key)}
                className={cn(
                  "rounded-lg border py-2.5 text-center text-xs font-bold transition",
                  paymentMethod === o.key
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/50",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="mb-4">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Observações</Label>
            <Textarea
              className="mt-1 min-h-[72px] border-slate-200 bg-slate-50 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <p className="mb-1 text-center text-xs text-slate-500 dark:text-slate-400">Total</p>
          <p className="mb-4 text-center text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <Button
            type="button"
            disabled={finalizing || lines.length === 0}
            onClick={() => void finalize()}
            className="mb-2 h-12 w-full gap-2 bg-emerald-500 text-base font-bold text-white shadow-md hover:bg-emerald-600"
          >
            <Check className="size-5" />
            {finalizing ? "Finalizando…" : "Finalizar venda"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => void discardDraft()}>
            Descartar rascunho
          </Button>
        </div>
      </aside>
    </div>
  );
}
