"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, ScanLine, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ROLE_LABELS } from "@/lib/constants";
import { titleForPath } from "@/lib/app/page-titles";
import type { UserRole } from "@/types/database";

function initials(name: string, email: string | null) {
  const s = name.trim() || email || "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

export function AppHeader({
  email,
  fullName,
  role,
  isAdmin,
}: {
  email: string | null;
  fullName: string;
  role: UserRole;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [q, setQ] = useState("");
  const title = titleForPath(pathname);
  const isPos = pathname === "/sales/new";

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function searchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = q.trim();
    if (t) router.push(`/products?q=${encodeURIComponent(t)}`);
  }

  if (isPos) {
    return (
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
            <ScanLine className="size-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white md:text-xl">Nova venda</h2>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <ThemeToggle />
          <div className="flex items-center gap-4 md:gap-8">
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-500 transition hover:text-primary dark:text-slate-400 dark:hover:text-sky-400"
              >
                Painel
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium text-slate-500 transition hover:text-primary dark:text-slate-400 dark:hover:text-sky-400"
              >
                Estoque
              </Link>
              <Link
                href="/reports"
                className="text-sm font-medium text-slate-500 transition hover:text-primary dark:text-slate-400 dark:hover:text-sky-400"
              >
                Relatórios
              </Link>
            </nav>
            <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-700 md:block" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {fullName || email || "Usuário"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[role]}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full border-2 border-slate-100 bg-slate-200 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {initials(fullName, email)}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => void logout()}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
        <h2 className="max-w-[40%] truncate text-lg font-bold text-slate-900 dark:text-white md:max-w-none md:text-xl">
          {title}
        </h2>
        <form onSubmit={searchSubmit} className="mx-auto hidden max-w-md flex-1 md:flex">
          <div className="flex h-10 w-full items-stretch overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/80">
            <div className="flex items-center pl-3 text-slate-500 dark:text-slate-400">
              <Search className="size-5" />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar produtos, clientes…"
              className="min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </form>
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <ThemeToggle />
        <Link href="/sales/new" className="hidden sm:block">
          <Button size="sm" className="shadow-sm">
            Nova venda
          </Button>
        </Link>
        {isAdmin && (
          <Link href="/products/new" className="hidden lg:block">
            <Button variant="outline" size="sm">
              Novo produto
            </Button>
          </Link>
        )}
        <button
          type="button"
          className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Notificações"
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full border border-white bg-red-500 dark:border-slate-950" />
        </button>
        <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-700 md:block" />
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {initials(fullName, email)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {fullName || email?.split("@")[0]}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[role]}</p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => void logout()}>
          Sair
        </Button>
      </div>
    </header>
  );
}
