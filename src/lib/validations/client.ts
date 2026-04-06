import { z } from "zod";

export const clientSchema = z
  .object({
    name: z.string().min(1, "Nome obrigatório"),
    phone: z.string().optional(),
    email: z.string().optional(),
    document: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const e = val.email?.trim() ?? "";
    if (e !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "E-mail inválido", path: ["email"] });
    }
  });

export type ClientFormValues = z.infer<typeof clientSchema>;
