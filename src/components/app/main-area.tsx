"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function MainArea({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pos = pathname === "/sales/new";

  return (
    <main
      className={cn(
        "flex-1 overflow-auto",
        pos ? "flex min-h-0 flex-col p-0" : "p-4 md:p-8",
      )}
    >
      <div
        className={cn(
          pos ? "flex min-h-0 flex-1 flex-col" : "mx-auto max-w-[1200px]",
        )}
      >
        {children}
      </div>
    </main>
  );
}
