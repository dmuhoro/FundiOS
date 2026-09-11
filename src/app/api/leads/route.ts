import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isDbConfigured } from "@/lib/db-guard";
import { createIdempotencyKey } from "@/lib/queue/notification-queue";
import { createLeadSchema } from "@/lib/validations/lead";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, garage_id, name, phone, vehicle_make, vehicle_model, message, source, status, converted_to, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  let validated;
  try {
    validated = createLeadSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      { error: "validation_failed", details: (err as ZodError).format() },
      { status: 400 },
    );
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("garage_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!userRecord?.garage_id) {
    return NextResponse.json({ error: "no_garage" }, { status: 403 });
  }

  const garageId = userRecord.garage_id as string;
  const idempotencyKey = createIdempotencyKey(garageId, "lead_created", {
    phone: validated.phone,
    source: validated.source,
  });

  const { data: existingLog } = await supabase
    .from("automation_logs")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingLog) {
    return NextResponse.json({ status: "already_processed" }, { status: 200 });
  }

  const { error: insertError } = await supabase.from("leads").insert({
    garage_id: garageId,
    name: validated.name,
    phone: validated.phone,
    vehicle_make: validated.vehicle_make,
    vehicle_model: validated.vehicle_model,
    message: validated.message,
    source: validated.source,
    status: validated.status,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "insert_failed", details: insertError.message },
      { status: 500 },
    );
  }

  const { error: auditError } = await supabase.from("automation_logs").insert({
    garage_id: garageId,
    trigger_type: "lead_created",
    entity_type: "lead",
    action: "lead_created",
    payload: { source: validated.source },
    status: "success",
    idempotency_key: idempotencyKey,
  });

  if (auditError) {
    logger.warn("Failed to write automation log", { error: auditError.message });
  }

  return NextResponse.json({ status: "created" }, { status: 201 });
}