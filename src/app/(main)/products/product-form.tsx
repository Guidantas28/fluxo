"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import type { Product } from "@/types/database";

const defaults: ProductFormValues = {
  name: "",
  sku: "",
  description: "",
  sale_price: 0,
  cost_price: 0,
  stock_quantity: 0,
  minimum_stock: 0,
  control_stock: true,
  active: true,
};

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          description: product.description ?? "",
          sale_price: Number(product.sale_price),
          cost_price: Number(product.cost_price),
          stock_quantity: Number(product.stock_quantity),
          minimum_stock: Number(product.minimum_stock),
          control_stock: product.control_stock,
          active: product.active,
        }
      : defaults,
  });

  async function onSubmit(values: ProductFormValues) {
    setErr(null);
    const payload = {
      name: values.name,
      sku: values.sku.trim(),
      description: values.description || null,
      sale_price: values.sale_price,
      cost_price: values.cost_price,
      stock_quantity: values.stock_quantity,
      minimum_stock: values.minimum_stock,
      control_stock: values.control_stock,
      active: values.active,
    };

    if (product) {
      const { error } = await supabase.from("products").update(payload).eq("id", product.id);
      if (error) {
        setErr(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        setErr(error.message);
        return;
      }
    }
    router.push("/products");
    router.refresh();
  }

  async function handleDelete() {
    if (!product || !confirm("Excluir este produto? Só é permitido se não houver vendas ou movimentações.")) return;
    setErr(null);
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push("/products");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      {err && <Alert variant="error">{err}</Alert>}

      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" className="mt-1" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" className="mt-1" {...form.register("sku")} />
        {form.formState.errors.sku && (
          <p className="mt-1 text-xs text-red-600">{form.formState.errors.sku.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" className="mt-1" {...form.register("description")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sale_price">Preço de venda</Label>
          <Input
            id="sale_price"
            type="number"
            step="0.01"
            className="mt-1"
            {...form.register("sale_price", { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="cost_price">Custo</Label>
          <Input
            id="cost_price"
            type="number"
            step="0.01"
            className="mt-1"
            {...form.register("cost_price", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="stock_quantity">Quantidade em estoque</Label>
          <Input
            id="stock_quantity"
            type="number"
            step="0.001"
            className="mt-1"
            {...form.register("stock_quantity", { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="minimum_stock">Estoque mínimo</Label>
          <Input
            id="minimum_stock"
            type="number"
            step="0.001"
            className="mt-1"
            {...form.register("minimum_stock", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("control_stock")} />
          Controlar estoque
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("active")} />
          Ativo
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/products")}>
          Cancelar
        </Button>
        {product && (
          <Button type="button" variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        )}
      </div>
    </form>
  );
}
