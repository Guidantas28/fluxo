import { Suspense } from "react";
import { SignupForm } from "@/app/cadastro/signup-form";

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-center text-sm text-slate-500 dark:bg-background-dark dark:text-slate-400">
          Carregando…
        </p>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
