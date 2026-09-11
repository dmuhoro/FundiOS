import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .trim()
    .min(9)
    .max(20)
    .transform((value) => normalizePhone(value)),
  email: z.string().trim().email().nullish(),
  notes: z.string().trim().max(2000).nullish(),
  wa_opt_in: z.boolean().default(false),
});

export type CreateCustomerInput = z.input<typeof createCustomerSchema>;
export type CreateCustomer = z.infer<typeof createCustomerSchema>;