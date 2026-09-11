import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { verifySignature } from "@/lib/whatsapp/signature";
import { parseWebhook } from "@/lib/whatsapp/webhook";
import { resolveGarageByPhoneNumberId } from "@/lib/whatsapp/garage-lookup";

// GET — Meta webhook verification challenge
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.info("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn("WhatsApp webhook verification failed", { mode, token });
  return new NextResponse("Forbidden", { status: 403 });
}

// POST — Inbound messages (fail closed: every rejection is explicit, never dropped)
export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  const verified = verifySignature({
    secret: process.env.WHATSAPP_APP_SECRET,
    body: bodyText,
    signature,
  });
  if (!verified) {
    logger.warn("WhatsApp webhook signature verification failed");
    return NextResponse.json({ error: "invalid_signature" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    logger.warn("WhatsApp webhook received malformed JSON");
    return NextResponse.json({ error: "malformed_json" }, { status: 400 });
  }

  const parsed = parseWebhook(payload);
  if (!parsed.ok) {
    if (parsed.code === "no_message") {
      return new NextResponse("OK", { status: 200 });
    }
    logger.warn("WhatsApp webhook envelope rejected", { reason: parsed.reason });
    return NextResponse.json(
      { error: "malformed_envelope", reason: parsed.reason },
      { status: 400 },
    );
  }

  const lookup = await resolveGarageByPhoneNumberId(parsed.message.waPhoneNumberId);
  if (lookup.status === "db_unavailable") {
    logger.warn("WhatsApp webhook cannot be processed: database unavailable");
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
  if (lookup.status === "not_found") {
    logger.warn("WhatsApp webhook: no garage bound to this WA phone number");
    return NextResponse.json({ error: "unknown_wa_number" }, { status: 404 });
  }

  // A garage resolved. The durable queue does not exist yet (migration + adapter
  // pending), so we refuse rather than silently drop. Meta will retry.
  logger.info("WhatsApp webhook message accepted pending durable queue", {
    garageId: lookup.garageId,
  });
  return NextResponse.json(
    { status: "pending_persistence", error: "queue_not_ready" },
    { status: 503 },
  );
}