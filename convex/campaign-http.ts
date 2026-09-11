import { httpAction } from "./_generated/server";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { parseCaptureForm, resolveUtmCampaign, buildCapturePage, buildCaptureSuccessPage } from "./lib/campaign";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

function errorPayload(error: unknown): { status: number; body: string } {
  if (error instanceof ConvexError) {
    const data = error.data as { code?: string; message?: string } | undefined;
    const code = data?.code ?? "error";
    const message = data?.message ?? "Request failed";
    const status =
      code === "NOT_FOUND" ? 404 : code === "UNAUTHENTICATED" ? 401 : 400;
    return {
      status,
      body: JSON.stringify({ error: code, message }),
    };
  }
  return { status: 500, body: JSON.stringify({ error: "internal_error" }) };
}

export const serveCapture = httpAction(async (ctx, request) => {
  const pathname = new URL(request.url).pathname;
  const slug = pathname.replace(/^\/c\//, "").toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const { campaignKey, source } = resolveUtmCampaign({
      slug,
      utmCampaign: url.searchParams.get("utm_campaign"),
      utmSource: url.searchParams.get("utm_source"),
    });
    let page: string;
    try {
      const tenant = await ctx.runQuery(api.tenants.getBySlug, { slug });
      if (!tenant) return new Response("Not found", { status: 404 });
      page = buildCapturePage({
        slug,
        garageName: tenant.name,
        campaignKey,
        source,
      });
    } catch (error) {
      const { status, body } = errorPayload(error);
      return new Response(body, {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(page, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let raw: unknown;
  try {
    if (contentType.includes("application/json")) {
      raw = await request.json();
    } else {
      const params = new URLSearchParams(await request.text());
      raw = Object.fromEntries(params.entries());
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "malformed_body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const parsed = parseCaptureForm(raw);
  if (!parsed.ok) {
    return new Response(
      JSON.stringify({ error: parsed.code, message: parsed.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    await ctx.runMutation(api.campaigns.captureLandingLead, {
      slug,
      phone: parsed.payload.phone,
      name: parsed.payload.name,
      message: parsed.payload.message,
      source: parsed.payload.source ?? "facebook",
      campaignKey: parsed.payload.campaignKey,
    });
  } catch (error) {
    const { status, body } = errorPayload(error);
    return new Response(body, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tenant = await ctx.runQuery(api.tenants.getBySlug, { slug });
  return new Response(
    buildCaptureSuccessPage({ garageName: tenant?.name ?? "the garage" }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
});