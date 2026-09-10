// Auto-generate full types from Supabase:
// npx supabase gen types typescript --local > src/types/database.ts
// Then re-export from here.

export type UserRole =
  | "owner"
  | "mechanic"
  | "receptionist"
  | "super_admin";

export type LeadSource =
  | "whatsapp"
  | "facebook"
  | "walk_in"
  | "referral"
  | "google"
  | "other";

export type LeadStatus = "new" | "contacted" | "converted" | "lost";

export type ServiceStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "mpesa" | "card" | "invoice";

export type PlanTier = "starter" | "growth" | "premium";