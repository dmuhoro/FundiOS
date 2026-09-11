import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const WA_NUMBER = "105431206008513";
const SENDER = "+254712345678";

describe("WhatsApp inbound (HTTP-action path)", () => {
  it("a single inbound phone creates independent leads per tenant (idempotent re-delivery)", async () => {
    const t = convexTest(schema, modules);

    const tenantA = await t.run(async (ctx) => {
      const now = Date.now();
      const id = await ctx.db.insert("tenants", {
        name: "Garage A",
        slug: "wa-a",
        planTier: "starter",
        waPhoneId: WA_NUMBER,
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });
      return id;
    });

    const tenantB = await t.run(async (ctx) => {
      const now = Date.now();
      const id = await ctx.db.insert("tenants", {
        name: "Garage B",
        slug: "wa-b",
        planTier: "starter",
        waPhoneId: WA_NUMBER,
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });
      return id;
    });

    const first = await t.mutation(api.leads.createInbound, {
      tenantId: tenantA,
      phone: SENDER,
      source: "whatsapp",
    });
    const second = await t.mutation(api.leads.createInbound, {
      tenantId: tenantA,
      phone: SENDER,
      source: "whatsapp",
    });
    const otherTenant = await t.mutation(api.leads.createInbound, {
      tenantId: tenantB,
      phone: SENDER,
      source: "whatsapp",
    });

    expect(second).toBe(first);
    expect(otherTenant).not.toBe(first);

    const tenantALeads = await t.run((ctx) =>
      ctx.db.query("leads").withIndex("by_tenant", (q) => q.eq("tenantId", tenantA)).collect(),
    );
    const tenantBLeads = await t.run((ctx) =>
      ctx.db.query("leads").withIndex("by_tenant", (q) => q.eq("tenantId", tenantB)).collect(),
    );
    expect(tenantALeads).toHaveLength(1);
    expect(tenantALeads[0].phone).toBe("+254712345678");
    expect(tenantBLeads).toHaveLength(1);
  });

  it("resolves the garage bound to a WhatsApp phone number id", async () => {
    const t = convexTest(schema, modules);

    const tenantId = await t.run(async (ctx) => {
      const now = Date.now();
      return await ctx.db.insert("tenants", {
        name: "Garage A",
        slug: "wa-resolve",
        planTier: "starter",
        waPhoneId: WA_NUMBER,
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });
    });

    const resolved = await t.query(api.tenants.getByWaPhoneId, {
      waPhoneId: WA_NUMBER,
    });
    expect(resolved?._id).toBe(tenantId);
    expect(resolved?.name).toBe("Garage A");

    const missing = await t.query(api.tenants.getByWaPhoneId, {
      waPhoneId: "not-a-bound-number",
    });
    expect(missing).toBeNull();
  });
});