import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireGarage } from "./lib/authorization";
import { GMB_CHECKLIST_ITEMS } from "@/lib/constants";
import { z } from "zod";

const ALLOWED_KEYS = new Set<string>(GMB_CHECKLIST_ITEMS.map((i) => i.key));

const checklistPayloadSchema = z.object({
  completedItems: z.array(z.string()).max(GMB_CHECKLIST_ITEMS.length),
  notes: z.string().max(2000),
});

export const getChecklist = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireGarage(ctx);
    const row = await ctx.db
      .query("gmbChecklists")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .unique();
    return {
      items: GMB_CHECKLIST_ITEMS,
      completedItems: row?.completedItems ?? [],
      notes: row?.notes ?? "",
      updatedAt: row?.updatedAt ?? null,
    };
  },
});

export const updateChecklist = mutation({
  args: { completedItems: v.array(v.string()), notes: v.string() },
  handler: async (ctx, args) => {
    const { tenantId } = await requireGarage(ctx);
    const parsed = checklistPayloadSchema.safeParse(args);
    if (!parsed.success) {
      throw new ConvexError({
        code: "INVALID_ARGS",
        message: parsed.error.message,
      });
    }
    for (const key of parsed.data.completedItems) {
      if (!ALLOWED_KEYS.has(key)) {
        throw new ConvexError({
          code: "INVALID_ARGS",
          message: `Unknown checklist item: ${key}`,
        });
      }
    }
    const existing = await ctx.db
      .query("gmbChecklists")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .unique();
    const now = Date.now();
    const completedItems = parsed.data.completedItems;
    if (existing) {
      await ctx.db.patch(existing._id, {
        completedItems,
        notes: parsed.data.notes,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("gmbChecklists", {
        tenantId,
        completedItems,
        notes: parsed.data.notes,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { saved: true, completed: completedItems.length };
  },
});