import { Card, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/app/(main)/clients/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Novo cliente</h1>
        <p className="text-sm text-zinc-500">Cadastro rápido</p>
      </div>
      <Card>
        <CardTitle className="mb-4">Dados</CardTitle>
        <ClientForm />
      </Card>
    </div>
  );
}
