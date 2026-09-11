import { z } from "zod";

export const createVehicleSchema = z.object({
  customer_id: z.string().uuid(),
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.number().int().min(1900).max(2200).nullish(),
  plate_number: z.string().trim().max(20).nullish(),
  color: z.string().trim().max(40).nullish(),
  mileage_km: z.number().int().nonnegative().nullish(),
  notes: z.string().trim().max(2000).nullish(),
});

export type CreateVehicleInput = z.input<typeof createVehicleSchema>;
export type CreateVehicle = z.infer<typeof createVehicleSchema>;