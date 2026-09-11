import { createClient } from "@/lib/supabase/server";
import { isDbConfigured } from "@/lib/db-guard";

export type GarageLookupResult =
  | { status: "ok"; garageId: string; garageName: string }
  | { status: "db_unavailable" }
  | { status: "not_found" };

export async function resolveGarageByPhoneNumberId(
  waPhoneNumberId: string,
): Promise<GarageLookupResult> {
  if (!isDbConfigured()) {
    return { status: "db_unavailable" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("wa_phone_id", waPhoneNumberId)
    .maybeSingle();

  if (error || !data) {
    return { status: "not_found" };
  }

  return { status: "ok", garageId: data.id, garageName: data.name };
}