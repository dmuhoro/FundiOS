import { query } from "./_generated/server";
import { requireGarage } from "./lib/authorization";

const DAY_MS = 24 * 60 * 60 * 1000;

const ACTION_LABELS: Record<string, string> = {
  queue_enqueued: "Automation job enqueued",
  whatsapp_sent: "WhatsApp message sent",
  whatsapp_retry: "WhatsApp send is retrying",
  whatsapp_send_failed: "WhatsApp send failed",
  lead_created: "Lead captured",
  lead_converted: "Lead converted to customer",
};

function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.slice(0, 3)}•••${trimmed.slice(-4)}`;
}

function truncate(value: string | undefined | null, max: number): string {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireGarage(ctx);
    const [leads, customers, vehicles, services, queue, logs] = await Promise.all([
      ctx.db
        .query("leads")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect(),
      ctx.db
        .query("customers")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect(),
      ctx.db
        .query("vehicles")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect(),
      ctx.db
        .query("services")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect(),
      ctx.db
        .query("automationQueue")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect(),
      ctx.db
        .query("automationLogs")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect(),
    ]);

    const now = Date.now();
    const optedIn = customers.filter((c) => c.waOptIn).length;

    return {
      leadsTotal: leads.length,
      leadsNew7d: leads.filter((l) => l.createdAt >= now - 7 * DAY_MS).length,
      customersTotal: customers.length,
      optInRate:
        customers.length === 0 ? 0 : Math.round((optedIn / customers.length) * 100),
      vehiclesTotal: vehicles.length,
      servicesOpen: services.filter(
        (s) => s.status === "pending" || s.status === "in_progress",
      ).length,
      servicesCompleted: services.filter((s) => s.status === "completed").length,
      remindersSent: services.filter((s) => s.reminderSent).length,
      whatsappSent: logs.filter((l) => l.action === "whatsapp_sent").length,
      queueBacklog: queue.filter(
        (j) => j.status === "pending" || j.status === "retrying",
      ).length,
      queueFailed: queue.filter((j) => j.status === "failed").length,
    };
  },
});

export const acquisition = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireGarage(ctx);
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .take(500);

    const bySourceMap = new Map<string, number>();
    const byCampaignMap = new Map<string, number>();
    let converted = 0;
    for (const lead of leads) {
      bySourceMap.set(lead.source, (bySourceMap.get(lead.source) ?? 0) + 1);
      if (lead.status === "converted") converted += 1;
      const campaign = lead.campaignKey;
      if (campaign) {
        byCampaignMap.set(campaign, (byCampaignMap.get(campaign) ?? 0) + 1);
      }
    }

    const bySource = [...bySourceMap.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
    const byCampaign = [...byCampaignMap.entries()]
      .map(([campaign, count]) => ({ campaign, count }))
      .sort((a, b) => b.count - a.count);
    const total = leads.length;

    return {
      total,
      facebookLeads: bySourceMap.get("facebook") ?? 0,
      converted,
      conversionRate: total === 0 ? 0 : Math.round((converted / total) * 100),
      untracked: leads.filter((l) => !l.campaignKey).length,
      bySource,
      byCampaign,
      recent: leads.slice(0, 8).map((lead) => ({
        id: lead._id,
        phone: maskPhone(lead.phone),
        name: lead.name ?? null,
        source: lead.source,
        campaignKey: lead.campaignKey ?? null,
        status: lead.status,
        createdAt: lead.createdAt,
      })),
    };
  },
});

export const activityFeed = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireGarage(ctx);
    const [logs, leads] = await Promise.all([
      ctx.db
        .query("automationLogs")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .order("desc")
        .take(10),
      ctx.db
        .query("leads")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .order("desc")
        .take(6),
    ]);

    const events = [
      ...logs.map((l) => ({
        id: l._id,
        kind: "automation" as const,
        title: ACTION_LABELS[l.action] ?? `Automation event: ${l.action}`,
        detail: l.errorMessage ?? truncate(l.payload, 60),
        status: l.status,
        at: l.createdAt,
      })),
      ...leads.map((ld) => ({
        id: ld._id,
        kind: "lead" as const,
        title:
          ld.source === "whatsapp"
            ? "New WhatsApp lead"
            : `New ${ld.source} lead`,
        detail: ld.name ? `${ld.name} · ${maskPhone(ld.phone)}` : maskPhone(ld.phone),
        status: ld.status,
        at: ld.createdAt,
      })),
    ];
    events.sort((a, b) => b.at - a.at);
    return events.slice(0, 15);
  },
});