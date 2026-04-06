import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import { Card, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/app/(main)/products/product-form";
import type { Product } from "@/types/database";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") redirect("/products");

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();

  if (error || !data) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Editar produto</h1>
        <p className="text-sm text-zinc-500">{data.name}</p>
      </div>
      <Card>
        <CardTitle className="mb-4">Dados do produto</CardTitle>
        <ProductForm product={data as Product} />
      </Card>
    </div>
  );
}
