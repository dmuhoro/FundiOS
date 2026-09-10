export const APP_NAME = "FundiOS";
export const WHATSAPP_API_VERSION = "v21.0";
export const WHATSAPP_BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

export const LEAD_SOURCES = [
  "whatsapp",
  "facebook",
  "walk_in",
  "referral",
  "google",
  "other",
] as const;

export const LEAD_STATUSES = ["new", "contacted", "converted", "lost"] as const;
export const SERVICE_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const KES_FORMATTER = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 0,
});

// Reminders fire when service is due within this many days
export const REMINDER_WINDOW_DAYS = 7;

// How long before a new lead is considered "unresponded"
export const UNRESPONDED_LEAD_THRESHOLD_HOURS = 2;