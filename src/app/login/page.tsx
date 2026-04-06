import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-center text-sm text-slate-500 dark:bg-background-dark dark:text-slate-400">
          Carregando…
        </p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
