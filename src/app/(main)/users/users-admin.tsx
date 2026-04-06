"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

export function UsersAdmin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "operator">("operator");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    const json = (await res.json()) as { error?: string; id?: string };
    setLoading(false);
    if (!res.ok) {
      setMsg({ type: "err", text: json.error ?? "Erro ao criar" });
      return;
    }
    setMsg({ type: "ok", text: "Usuário criado. Já pode fazer login." });
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("operator");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {msg?.type === "ok" && <Alert variant="success">{msg.text}</Alert>}
      {msg?.type === "err" && <Alert variant="error">{msg.text}</Alert>}

      <form onSubmit={createUser} className="grid max-w-lg gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email">E-mail (login)</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="password">Senha inicial</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="role">Perfil</Label>
          <Select id="role" className="mt-1" value={role} onChange={(e) => setRole(e.target.value as "admin" | "operator")}>
            <option value="operator">Operador</option>
            <option value="admin">Administrador</option>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Criando…" : "Criar usuário"}
          </Button>
        </div>
      </form>

      <p className="text-xs text-zinc-500">
        Para editar ou desativar, use a tabela abaixo. Alterações exigem service role ou políticas admin —
        use o painel Supabase ou amplie a API. Nesta base, você pode desativar pelo SQL:{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">update profiles set active = false …</code>
      </p>

      <UserQuickEdit />
    </div>
  );
}

function UserQuickEdit() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [active, setActive] = useState(true);
  const [role, setRole] = useState<"admin" | "operator">("operator");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim()) {
      setErr("Informe o UUID do usuário (coluna ID na tabela).");
      return;
    }
    setLoading(true);
    setErr(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        active,
        role,
        full_name: fullName || undefined,
      })
      .eq("id", userId.trim());
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.refresh();
    setUserId("");
    setFullName("");
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-200 p-4 dark:border-zinc-700">
      <p className="mb-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">Editar perfil existente</p>
      {err && <Alert variant="error" className="mb-3">{err}</Alert>}
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Label>ID do usuário (UUID)</Label>
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-1 font-mono text-xs" />
        </div>
        <div>
          <Label>Perfil</Label>
          <Select className="mt-1" value={role} onChange={(e) => setRole(e.target.value as "admin" | "operator")}>
            <option value="operator">Operador</option>
            <option value="admin">Administrador</option>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input id="active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <Label htmlFor="active" className="mb-0">
            Ativo
          </Label>
        </div>
        <div className="sm:col-span-2">
          <Label>Nome (opcional)</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="secondary" disabled={loading}>
            {loading ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
