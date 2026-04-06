"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupFormValues } from "@/lib/validations/signup";
import { FluxoMark } from "@/components/brand/fluxo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Globe, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setServerError(null);
    setSuccessMsg(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        data: {
          full_name: values.full_name.trim(),
          role: "operator",
        },
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSuccessMsg(
      "Conta criada. Se o projeto Supabase exige confirmação de e-mail, verifique sua caixa de entrada para ativar o acesso.",
    );
    form.reset();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background-light px-4 py-10 dark:bg-background-dark">
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
            <Link href="/login" className="mb-6 flex items-center gap-3 text-primary">
              <FluxoMark className="size-8" />
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Fluxo+</span>
            </Link>
            <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">Criar conta</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Comece a usar o Fluxo+ em poucos passos.</p>
          </div>

          <div className="px-8 pb-10">
            {successMsg && (
              <Alert variant="success" className="mb-4">
                {successMsg}{" "}
                <Link href="/login" className="font-semibold text-emerald-800 underline dark:text-emerald-300">
                  Ir para o login
                </Link>
              </Alert>
            )}
            {serverError && <Alert variant="error" className="mb-4">{serverError}</Alert>}

            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  autoComplete="name"
                  className="mt-1.5 bg-slate-50"
                  {...form.register("full_name")}
                />
                {form.formState.errors.full_name && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.full_name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@empresa.com"
                  className="mt-1.5 bg-slate-50"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="mt-1.5 bg-slate-50"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="mt-1.5 bg-slate-50"
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ao criar a conta, você entra como <strong>operador</strong>. Um administrador pode alterar seu
                perfil depois.
              </p>

              <Button
                type="submit"
                className="h-11 w-full font-bold shadow-sm"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Criando conta…" : "Criar conta"}
              </Button>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Já tem conta?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Entrar
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
