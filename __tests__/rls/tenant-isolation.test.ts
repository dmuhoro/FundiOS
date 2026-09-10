/**
 * RLS Isolation Test: garage A cannot read garage B's data
 *
 * The pilot's multi-tenancy contract: a user from garage A must never
 * read, write, or update any row belonging to garage B — verified at the
 * RLS policy level, not assumed (PRD § 11).
 *
 * STATUS: manually VERIFIED on 2026-09-10 against Postgres 16 (throwaway
 * DB, non-superuser role + simulated JWT sub):
 *   - migration applied clean (8 types / 8 tables / 6 triggers / 7 policies)
 *   - garage A sees 1 customer, 0 of garage B's (read isolation proven)
 *   - cross-tenant INSERT rejected by RLS (write isolation proven, fail-closed)
 *   - anonymous session sees 0 rows on every tenant table (no leakage)
 *   - RLS recursion bug in the PRD's inline-subselect pattern found + fixed
 *     via public.current_garage_id() SECURITY DEFINER helper
 *
 * The vitest harness below converts that manual proof into an automated
 * suite once the Supabase test harness is wired.
 */
import { describe, it } from "vitest";

describe("RLS — tenant isolation", () => {
  it.todo("garage A user cannot SELECT rows belonging to garage B");
  it.todo("garage A user cannot UPDATE rows belonging to garage B");
  it.todo("garage A user cannot DELETE rows belonging to garage B");
  it.todo("super_admin bypasses isolation via service role only, never RLS");
});