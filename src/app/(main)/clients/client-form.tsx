"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { clientSchema, type ClientFormValues } from "@/lib/validations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import type { Client } from "@/types/database";

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? {
          name: client.name,
          phone: client.phone ?? "",
          email: client.email ?? "",
          document: client.document ?? "",
          notes: client.notes ?? "",
        }
      : { name: "", phone: "", email: "", document: "", notes: "" },
  });

  async function onSubmit(values: ClientFormValues) {
    setErr(null);
    const payload = {
      name: values.name.trim(),
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      document: values.document?.trim() || null,
      notes: values.notes?.trim() || null,
    };

    if (client) {
      const { error } = await supabase.from("clients").update(payload).eq("id", client.id);
      if (error) {
        setErr(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) {
        setErr(error.message);
        return;
      }
    }
    router.push("/clients");
    router.refresh();
  }

  async function handleDelete() {
    if (!client || !confirm("Excluir este cliente?")) return;
    setErr(null);
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push("/clients");
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" className="mt-1" {...form.register("phone")} />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" className="mt-1" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="document">Documento</Label>
        <Input id="document" className="mt-1" {...form.register("document")} />
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" className="mt-1" {...form.register("notes")} />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/clients")}>
          Cancelar
        </Button>
        {client && (
          <Button type="button" variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        )}
      </div>
    </form>
  );
}
