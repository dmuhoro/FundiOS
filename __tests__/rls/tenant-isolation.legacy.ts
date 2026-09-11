/**
 * RLS Isolation Test — SUPERSEDED (ADR-002, 2026-09-11)
 *
 * The Sprint-01 RLS-proof scenarios (garage A cannot read/write garage B,
 * anonymous denied, super-admin via service role only) were manually VERIFIED
 * against Postgres 16. The backend moved to Convex (ADR-002 / decision D7) and
 * tenant isolation is now enforced at the Convex function boundary, NOT SQL RLS.
 *
 * The equivalent automated proof now lives in `convex/isolation.test.ts`
 * (ConvexTest in-memory backend, real functions, explicit identities). That
 * suite proves:
 *   - anonymous denied on every tenant endpoint          (→ "anonymous is denied")
 *   - garage A cannot read/write garage B                (→ "garage A can CRUD")
 *   - deactivated membership is denied                   (→ "deactivated member")
 *   - super_admin has scoped admin read + onboarding,    (→ "assigned membership")
 *     ordinary members are forbidden from admin paths
 *
 * The SQL files remain only as legacy artifacts until Sprint 05 removes the
 * Supabase API wiring.
 */