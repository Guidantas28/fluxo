"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  PlusCircle,
  Settings,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
  Users,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types/database";
import { FluxoMark } from "@/components/brand/fluxo-mark";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  quickSale?: boolean;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/products", label: "Estoque", icon: Package },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/sales", label: "Vendas", icon: ShoppingCart },
  { href: "/sales/new", label: "Nova venda", icon: PlusCircle, quickSale: true },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/stock-low", label: "Alertas", icon: TriangleAlert },
  { href: "/users", label: "Equipe", icon: UserCog, adminOnly: true },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/sales/new") return pathname === "/sales/new";
  if (href === "/sales") {
    if (pathname === "/sales") return true;
    if (pathname.startsWith("/sales/") && !pathname.startsWith("/sales/new")) return true;
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const hideForPos = pathname === "/sales/new";

  if (hideForPos) {
    return null;
  }

  return (
    <aside className="sticky top-0 z-20 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3 border-b border-slate-100 p-6 dark:border-slate-800">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
          <FluxoMark className="size-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-none text-slate-900 dark:text-white">Fluxo+</span>
          <span className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
            ERP para o seu negócio
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {items
          .filter((l) => !l.adminOnly || role === "admin")
          .map((l) => {
            const active = isActive(pathname, l.href);
            const Icon = l.icon;
            if (l.quickSale) {
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold shadow-sm shadow-primary/25 transition",
                    active
                      ? "bg-primary text-white"
                      : "bg-primary text-white hover:bg-primary-light",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {l.label}
                </Link>
              );
            }
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300"
                    : "text-slate-600 hover:bg-slate-50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-sky-400",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0",
                    active ? "text-primary dark:text-sky-300" : "text-slate-500 dark:text-slate-500",
                  )}
                />
                {l.label}
              </Link>
            );
          })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
        {role === "admin" && (
          <Link
            href="/users"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400"
          >
            <Settings className="size-5 text-slate-500 dark:text-slate-500" />
            Configurações
          </Link>
        )}
        <button
          type="button"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-white shadow-sm shadow-primary/30 transition hover:bg-primary-light"
        >
          <Sparkles className="size-4" />
          Fazer upgrade
        </button>
      </div>
    </aside>
  );
}
