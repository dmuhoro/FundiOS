import type { LeadStatus } from "@/types";

export interface LeadRecord {
  id: string;
  garageId: string;
  name: string | null;
  phone: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  message: string | null;
  source: string;
  status: LeadStatus;
  convertedTo: string | null;
  createdAt: string;
}

export const LEAD_STATUS_FLOW: LeadStatus[] = ["new", "contacted", "converted", "lost"];

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  if (from === to) return true;
  const flowIndex = (status: LeadStatus) => LEAD_STATUS_FLOW.indexOf(status);
  return flowIndex(to) > flowIndex(from);
}

export type LeadCaptureDecision =
  | { action: "create_new"; reason: "no_existing_lead" }
  | { action: "link_existing"; reason: "phone_match_open_lead"; leadId: string };

export function planLeadCapture(input: { existing: LeadRecord | null }): LeadCaptureDecision {
  const existing = input.existing;
  if (!existing) {
    return { action: "create_new", reason: "no_existing_lead" };
  }
  const isOpen = existing.convertedTo === null && existing.status !== "lost";
  if (!isOpen) {
    return { action: "create_new", reason: "no_existing_lead" };
  }
  return { action: "link_existing", reason: "phone_match_open_lead", leadId: existing.id };
}

export async function convertLead(
  input: {
    lead: LeadRecord;
    customer: { name: string; phone: string; wa_opt_in?: boolean };
  },
  deps: {
    createCustomer: (customer: {
      name: string;
      phone: string;
      wa_opt_in?: boolean;
    }) => Promise<{ id: string }>;
    markConverted: (conversion: { leadId: string; customerId: string }) => Promise<void>;
  },
): Promise<{ customerId: string } | { blocked: "already_converted" }> {
  const { lead, customer } = input;
  if (lead.convertedTo !== null) {
    return { blocked: "already_converted" };
  }

  const created = await deps.createCustomer({
    name: customer.name.trim(),
    phone: customer.phone,
    wa_opt_in: customer.wa_opt_in ?? false,
  });
  await deps.markConverted({ leadId: lead.id, customerId: created.id });

  return { customerId: created.id };
}