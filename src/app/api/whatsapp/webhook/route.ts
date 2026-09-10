import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// GET — Meta webhook verification challenge
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    logger.info("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn("WhatsApp webhook verification failed", { mode, token });
  return new NextResponse("Forbidden", { status: 403 });
}

// POST — Inbound messages
export async function POST() {
  // TODO: implement in Phase F6
  // 1. Verify X-Hub-Signature-256
  // 2. Parse message
  // 3. Route to queue
  logger.info("WhatsApp webhook received — handler pending");
  return new NextResponse("OK", { status: 200 });
}