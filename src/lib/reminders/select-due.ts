import { REMINDER_WINDOW_DAYS } from "@/lib/constants";
import {
  buildFollowUpReminder,
  type WhatsAppLanguage,
} from "@/lib/whatsapp/templates";

export interface CustomerForReminder {
  id: string;
  name: string;
  waOptIn: boolean;
  language?: WhatsAppLanguage;
}

export interface ServiceForReminder {
  id: string;
  customerId: string;
  make: string;
  model: string;
  nextServiceAt: string | null;
  reminderSent: boolean;
}

export interface ReminderCandidate {
  serviceId: string;
  customerId: string;
  customerName: string;
  make: string;
  model: string;
  message: string;
}

export function isDueWithinWindow(input: {
  nextServiceAt: string | null;
  now: string;
  windowDays?: number;
}): boolean {
  const { nextServiceAt, now, windowDays = REMINDER_WINDOW_DAYS } = input;
  if (!nextServiceAt) return false;

  const due = Date.parse(nextServiceAt);
  if (!Number.isFinite(due)) return false;

  const windowEnd = Date.parse(now) + windowDays * 24 * 60 * 60 * 1000;
  return due <= windowEnd;
}

export function selectReminderCandidates(input: {
  services: ServiceForReminder[];
  customersById: Map<string, CustomerForReminder> | Record<string, CustomerForReminder>;
  now?: string;
  windowDays?: number;
}): ReminderCandidate[] {
  const { services, windowDays, now = new Date().toISOString() } = input;
  const lookup = (id: string): CustomerForReminder | undefined => {
    if (input.customersById instanceof Map) {
      return input.customersById.get(id);
    }
    return input.customersById[id];
  };

  const candidates: ReminderCandidate[] = [];

  for (const service of services) {
    if (service.reminderSent) continue;

    const customer = lookup(service.customerId);
    if (!customer || !customer.waOptIn) continue;

    if (!isDueWithinWindow({ nextServiceAt: service.nextServiceAt, now, windowDays })) continue;

    candidates.push({
      serviceId: service.id,
      customerId: customer.id,
      customerName: customer.name,
      make: service.make,
      model: service.model,
      message: buildFollowUpReminder({
        customerName: customer.name,
        make: service.make,
        model: service.model,
        language: customer.language,
      }),
    });
  }

  return candidates;
}