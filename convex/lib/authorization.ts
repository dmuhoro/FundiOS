import { ConvexError } from "convex/values";
import type { Id, Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export type ErrorPayload = { code: string; message: string };

export class UnauthenticatedError extends ConvexError<ErrorPayload> {
  constructor() {
    super({ code: "UNAUTHENTICATED", message: "Sign in required" });
  }
}

export class ForbiddenError extends ConvexError<ErrorPayload> {
  constructor(message = "Insufficient permissions") {
    super({ code: "FORBIDDEN", message });
  }
}

export class TenantScopeError extends ConvexError<ErrorPayload> {
  constructor(message = "Cross-tenant access forbidden") {
    super({ code: "TENANT_SCOPE", message });
  }
}

export class NotFoundError extends ConvexError<ErrorPayload> {
  constructor() {
    super({ code: "NOT_FOUND", message: "Not found" });
  }
}

export async function requireMember(ctx: Ctx): Promise<Doc<"members">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new UnauthenticatedError();
  const member = await ctx.db
    .query("members")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!member || !member.active) throw new ForbiddenError("No active membership");
  return member;
}

export async function requireGarage(ctx: Ctx): Promise<{
  member: Doc<"members">;
  tenantId: Id<"tenants">;
}> {
  const member = await requireMember(ctx);
  if (!member.tenantId) throw new TenantScopeError("Account has no garage");
  return { member, tenantId: member.tenantId };
}

export async function requireActiveMemberOf(
  ctx: Ctx,
  tenantId: Id<"tenants">,
): Promise<Doc<"members">> {
  const member = await requireGarage(ctx);
  if (member.tenantId !== tenantId) throw new TenantScopeError();
  return member.member;
}

export async function requireSuperAdmin(ctx: Ctx): Promise<Doc<"members">> {
  const member = await requireMember(ctx);
  if (member.role !== "super_admin") throw new ForbiddenError("Super admin required");
  return member;
}

export async function requireTenantDocument<T extends { tenantId: Id<"tenants"> }>(
  ctx: Ctx,
  doc: T | null,
): Promise<T> {
  if (!doc) throw new NotFoundError();
  await requireActiveMemberOf(ctx, doc.tenantId);
  return doc;
}