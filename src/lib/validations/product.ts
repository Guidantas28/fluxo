import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  sku: z.string().min(1, "SKU obrigatório"),
  description: z.string().optional().nullable(),
  sale_price: z.number().min(0, "Preço inválido"),
  cost_price: z.number().min(0, "Custo inválido"),
  stock_quantity: z.number().min(0, "Estoque inválido"),
  minimum_stock: z.number().min(0, "Mínimo inválido"),
  control_stock: z.boolean(),
  active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
