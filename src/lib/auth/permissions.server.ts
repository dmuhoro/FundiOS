import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Call in any dashboard server component or route handler.
 * Returns the current user's garage_id.
 * Redirects to /login if unauthenticated.
 * Throws if the user has no garage association.
 */
export async function requireGarage(): Promise<{
  userId: string;
  garageId: string;
  role: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userRecord, error } = await supabase
    .from("users")
    .select("garage_id, role")
    .eq("id", user.id)
    .single();

  if (error || !userRecord?.garage_id) {
    throw new Error("User has no garage association");
  }

  return {
    userId: user.id,
    garageId: userRecord.garage_id,
    role: userRecord.role,
  };
}

/**
 * Call in admin routes only.
 * Confirms role = super_admin via service role.
 */
export async function requireSuperAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userRecord?.role !== "super_admin") {
    redirect("/dashboard/overview");
  }

  return { userId: user.id };
}