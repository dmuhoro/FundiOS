import { z } from "zod";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";
import { normalizePhone } from "@/lib/phone";

export const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(120).nullish(),
  phone: z
    .string()
    .trim()
    .min(9)
    .max(20)
    .transform((value) => normalizePhone(value)),
  vehicle_make: z.string().trim().max(80).nullish(),
  vehicle_model: z.string().trim().max(80).nullish(),
  message: z.string().trim().max(4000).nullish(),
  source: z.enum(LEAD_SOURCES).default("whatsapp"),
  status: z.enum(LEAD_STATUSES).default("new"),
});

export type CreateLeadInput = z.input<typeof createLeadSchema>;
export type CreateLead = z.infer<typeof createLeadSchema>;