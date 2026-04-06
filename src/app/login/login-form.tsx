"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FluxoMark } from "@/components/brand/fluxo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Globe, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const err = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inactive = err === "inactive";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background-light px-4 dark:bg-background-dark">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40 dark:opacity-25">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 via-transparent to-primary/5 dark:from-slate-800/40 dark:to-primary/10" />
        <div className="absolute -right-[10%] -top-[20%] size-[600px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-[20%] -left-[10%] size-[500px] rounded-full bg-blue-300/20 blur-[80px] dark:bg-blue-900/20" />
      </div>

      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <ThemeToggle variant="ghost" />
      </div>

      <div className="relative z-10 w-full max-w-[480px]">
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
          <div className="flex flex-col items-center px-8 pb-6 pt-10 text-center">
            <div className="mb-6 flex items-center gap-3 text-primary">
              <FluxoMark className="size-8" />
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Fluxo+</h2>
            </div>
            <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">Bem-vindo de volta</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Insira seus dados para acessar sua conta.</p>
          </div>

          <div className="px-8 pb-10">
            {inactive && (
              <Alert variant="error" className="mb-4">
                Sua conta está inativa. Fale com o administrador.
              </Alert>
            )}
            {message && <Alert variant="error" className="mb-4">{message}</Alert>}

            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">E-mail</span>
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Senha</span>
                <Input
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50"
                />
              </label>
              <div className="flex justify-end">
                <span className="text-sm font-medium text-slate-400 dark:text-slate-500">Esqueci minha senha</span>
              </div>
              <Button type="submit" className="h-11 w-full font-bold shadow-sm" disabled={loading}>
                {loading ? "Entrando…" : "Entrar"}
              </Button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                <span className="mx-4 flex-shrink text-xs font-medium uppercase text-slate-400 dark:text-slate-500">
                  Ou continue com
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                >
                  Google
                </button>
                <button
                  type="button"
                  disabled
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                >
                  SSO
                </button>
              </div>

              <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Não tem uma conta?{" "}
                <Link href="/cadastro" className="font-semibold text-primary hover:underline">
                  Criar conta
                </Link>
              </p>
            </form>
          </div>
        </div>

        <div className="mt-8 flex w-full max-w-[480px] items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex gap-4">
            <span className="transition hover:text-slate-800 dark:hover:text-slate-200">Privacidade</span>
            <span className="transition hover:text-slate-800 dark:hover:text-slate-200">Termos</span>
          </div>
          <div className="flex cursor-pointer items-center gap-1 transition hover:text-slate-800 dark:hover:text-slate-200">
            <Globe className="size-4" />
            <span>Português (BR)</span>
            <ChevronDown className="size-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
