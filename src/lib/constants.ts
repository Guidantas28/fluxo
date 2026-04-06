import type { PaymentMethod } from "@/types/database";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  debit_card: "Cartão de débito",
  credit_card: "Cartão de crédito",
  other: "Outro",
};

export const SALE_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  operator: "Operador",
};
