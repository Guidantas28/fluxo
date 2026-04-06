import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/profile";
import { Card, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/app/(main)/products/product-form";

export default async function NewProductPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") redirect("/products");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Novo produto</h1>
        <p className="text-sm text-zinc-500">Cadastro rápido para o catálogo</p>
      </div>
      <Card>
        <CardTitle className="mb-4">Dados do produto</CardTitle>
        <ProductForm />
      </Card>
    </div>
  );
}
