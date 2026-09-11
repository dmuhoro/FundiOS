import { mutation } from "./_generated/server";
import { REMINDER_WINDOW_DAYS } from "@/lib/constants";
import { buildFollowUpReminder } from "@/lib/whatsapp/templates";
import { enqueueJob } from "./lib/jobs";

export const fireDueReminders = mutation({
  args: {},
  handler: async (ctx) => {
    const tenants = await ctx.db.query("tenants").collect();
    const now = Date.now();
    const windowEnd = now + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    let enqueued = 0;

    for (const tenant of tenants) {
      const services = await ctx.db
        .query("services")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
        .collect();
      const customers = await ctx.db
        .query("customers")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
        .collect();
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
        .collect();

      const customersById = new Map(customers.map((c) => [c._id, c]));
      const vehiclesById = new Map(vehicles.map((x) => [x._id, x]));

      for (const service of services) {
        if (service.reminderSent) continue;
        if (!service.nextServiceAt || service.nextServiceAt > windowEnd) continue;

        const customer = customersById.get(service.customerId);
        const vehicle = vehiclesById.get(service.vehicleId);
        if (!customer || !customer.waOptIn || !vehicle) continue;

        const message = buildFollowUpReminder({
          customerName: customer.name,
          make: vehicle.make,
          model: vehicle.model,
        });

        const idempotencyKey = `reminder|${tenant._id}|${service._id}`;
        const { deduped } = await enqueueJob(ctx, {
          tenantId: tenant._id,
          type: "whatsapp_reminder",
          payload: {
            to: customer.phone,
            phoneNumberId: tenant.waPhoneId ?? "",
            message,
            source: "service_reminder",
          },
          idempotencyKey,
        });

        if (!service.reminderSent) {
          await ctx.db.patch(service._id, { reminderSent: true, updatedAt: now });
        }
        if (!deduped) enqueued += 1;
      }
    }

    return { enqueued };
  },
});