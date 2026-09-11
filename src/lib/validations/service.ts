import { z } from "zod";
import { SERVICE_STATUSES } from "@/lib/constants";

const PAYMENT_METHODS = ["cash", "mpesa", "card", "invoice"] as const;

const datetimeOrNull = z
  .string()
  .datetime()
  .nullable()
  .default(null);

export const createServiceSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  description: z.string().trim().min(1).max(2000),
  amount_kes: z.number().finite().nonnegative().nullish(),
  status: z.enum(SERVICE_STATUSES).default("pending"),
  payment_method: z.enum(PAYMENT_METHODS).nullish(),
  appointment_at: datetimeOrNull,
  completed_at: datetimeOrNull,
  next_service_km: z.number().int().nonnegative().nullish(),
  next_service_at: datetimeOrNull,
});

export const updateServiceStatusSchema = z.object({
  status: z.enum(SERVICE_STATUSES),
});

export type CreateServiceInput = z.input<typeof createServiceSchema>;
export type CreateService = z.infer<typeof createServiceSchema>;
export type UpdateServiceStatus = z.infer<typeof updateServiceStatusSchema>;