import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { verifyWhatsAppSignature, parseWhatsAppEnvelope } from "./lib/whatsapp";

export const handleWebhook = httpAction(async (ctx, request) => {
  const method = request.method;
  const url = new URL(request.url);
  const secret = process.env.WHATSAPP_APP_SECRET;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const bodyText = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const valid = await verifyWhatsAppSignature({
    secret,
    body: bodyText,
    signature,
  });
  if (!valid) {
    return new Response(
      JSON.stringify({ error: "invalid_signature" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return new Response(
      JSON.stringify({ error: "malformed_json" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const parsed = parseWhatsAppEnvelope(payload);
  if (!parsed.ok) {
    if (parsed.code === "no_message") return new Response("OK", { status: 200 });
    return new Response(
      JSON.stringify({ error: parsed.code }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const tenant = await ctx.runQuery(api.tenants.getByWaPhoneId, {
    waPhoneId: parsed.message.waPhoneNumberId,
  });
  if (!tenant) {
    return new Response(
      JSON.stringify({ error: "unknown_wa_number" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  await ctx.runMutation(api.leads.createInbound, {
    tenantId: tenant._id,
    phone: parsed.message.fromPhone,
    source: "whatsapp",
  });

  // TODO Sprint 06: durable queue + outbound reply
  return new Response(
    JSON.stringify({ status: "ok" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
