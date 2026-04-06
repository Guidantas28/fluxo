import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "warning" | "success" | "muted" | "danger" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
        variant === "default" && "bg-primary/10 text-primary dark:bg-primary/25 dark:text-sky-300",
        variant === "warning" &&
          "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
        variant === "success" &&
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
        variant === "muted" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        variant === "danger" && "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
        variant === "info" && "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
        className,
      )}
      {...props}
    />
  );
}
