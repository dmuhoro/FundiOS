import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ForbiddenError } from "./lib/authorization";
import { isValidKenyanPhone } from "./lib/phone";
import { createInboundLead } from "./lib/leadCapture";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

export const captureLandingLead = mutation({
  args: {
    slug: v.string(),
    phone: v.string(),
    name: v.optional(v.string()),
    message: v.optional(v.string()),
    campaignKey: v.optional(v.string()),
    source: v.optional(
      v.union(
        v.literal("facebook"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("google"),
        v.literal("other"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const slug = args.slug.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) throw new ForbiddenError("Invalid campaign");
    if (!isValidKenyanPhone(args.phone)) {
      throw new ForbiddenError("Invalid phone number");
    }

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!tenant) throw new ForbiddenError("Unknown campaign");

    const leadId = await createInboundLead(ctx, {
      tenantId: tenant._id,
      phone: args.phone,
      name: args.name,
      message: args.message,
      source: args.source ?? "facebook",
      campaignKey: args.campaignKey,
      trigger: "campaign_fired",
    });
    return { ok: true, leadId };
  },
});