import { describe, expect, it } from "vitest";
import { canTransition, convertLead, planLeadCapture, type LeadRecord } from "@/lib/crm/leads";

function makeLead(overrides: Partial<LeadRecord>): LeadRecord {
  return {
    id: "lead-1",
    garageId: "garage-1",
    name: "Nyaga",
    phone: "+254712345678",
    vehicleMake: null,
    vehicleModel: null,
    message: null,
    source: "whatsapp",
    status: "new",
    convertedTo: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("leads — capture & conversion", () => {
  it("plans a new lead when no existing lead matches", () => {
    expect(planLeadCapture({ existing: null })).toEqual({
      action: "create_new",
      reason: "no_existing_lead",
    });
  });

  it("links to an existing open lead with the same phone", () => {
    const existing = makeLead({});
    expect(planLeadCapture({ existing })).toEqual({
      action: "link_existing",
      reason: "phone_match_open_lead",
      leadId: "lead-1",
    });
  });

  it("creates a new lead when the existing one was already converted", () => {
    const existing = makeLead({ status: "converted", convertedTo: "customer-1" });
    expect(planLeadCapture({ existing })).toEqual({
      action: "create_new",
      reason: "no_existing_lead",
    });
  });

  it("only allows forward transitions through the lead flow", () => {
    expect(canTransition("new", "contacted")).toBe(true);
    expect(canTransition("new", "converted")).toBe(true);
    expect(canTransition("contacted", "lost")).toBe(true);
    expect(canTransition("converted", "new")).toBe(false);
    expect(canTransition("lost", "contacted")).toBe(false);
    expect(canTransition("contacted", "contacted")).toBe(true);
  });

  it("converts a lead into a customer and marks it converted", async () => {
    const created = { id: "customer-1" };
    const converted: Array<{ leadId: string; customerId: string }> = [];

    const result = await convertLead(
      { lead: makeLead({}), customer: { name: "Nyaga", phone: "+254712345678", wa_opt_in: true } },
      {
        createCustomer: async () => created,
        markConverted: async (c) => { converted.push(c); },
      },
    );

    expect(result).toEqual({ customerId: "customer-1" });
    expect(converted).toEqual([{ leadId: "lead-1", customerId: "customer-1" }]);
  });

  it("refuses to convert a lead that was already converted", async () => {
    const result = await convertLead(
      { lead: makeLead({ convertedTo: "customer-1" }), customer: { name: "Nyaga", phone: "+254712345678" } },
      {
        createCustomer: async () => {
          throw new Error("createCustomer must not be called");
        },
        markConverted: async () => {
          throw new Error("markConverted must not be called");
        },
      },
    );

    expect(result).toEqual({ blocked: "already_converted" });
  });
});