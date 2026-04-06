"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { SaleStatus } from "@/types/database";

export function SaleActions({
  saleId,
  status,
  isAdmin,
}: {
  saleId: string;
  status: SaleStatus;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function cancel() {
    if (!confirm("Cancelar esta venda?")) return;
    setLoading(true);
    setErr(null);
    const { error } = await supabase.rpc("cancel_sale", { p_sale_id: saleId });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.refresh();
  }

  if (status === "cancelled") {
    return <p className="mt-4 text-sm text-zinc-500">Venda cancelada.</p>;
  }

  if (status === "draft") {
    return (
      <div className="mt-4 space-y-2">
        {err && <Alert variant="error">{err}</Alert>}
        <p className="text-xs text-zinc-500">Rascunho — continue em Nova venda ou cancele.</p>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void cancel()}>
          {loading ? "…" : "Cancelar rascunho"}
        </Button>
      </div>
    );
  }

  if (status === "completed" && isAdmin) {
    return (
      <div className="mt-4 space-y-2">
        {err && <Alert variant="error">{err}</Alert>}
        <p className="text-xs text-zinc-500">Cancelar venda finalizada estorna o estoque (admin).</p>
        <Button type="button" variant="danger" disabled={loading} onClick={() => void cancel()}>
          {loading ? "…" : "Cancelar e estornar estoque"}
        </Button>
      </div>
    );
  }

  if (status === "completed" && !isAdmin) {
    return (
      <p className="mt-4 text-xs text-zinc-500">
        Somente administrador pode cancelar vendas concluídas.
      </p>
    );
  }

  return null;
}
