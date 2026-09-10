# ADR Index — FundiOS

> Architecture Decision Records. Formal ADRs live here; the legacy/decision log
> is `docs/decisions.md` (D1–D6). Decisions D4 was promoted to the first formal
> ADR because it changes the tenant-isolation keystone.

| # | Title | Status |
|---|-------|--------|
| 001 | RLS policy pattern → SECURITY DEFINER helper `public.current_garage_id()` | Accepted |

## Linking Convention

- ADRs reference each other, `docs/decisions.md`, and the evidence that backs them.
- A change that contradicts an ADR must supersede it **in the same commit**.
- An ADR is required when changing: the tenant model (`garage_id`/RLS), encryption,
  the notification queue, webhook signature verification, the auth/session model,
  or any money path (Constitution Art. I–V).

## Template

```markdown
# ADR-NNN: <Title>

**Date:** YYYY-MM-DD · **Status:** Proposed / Accepted / Superseded / REVERSED

## Context
## Decision
## Consequence
## Evidence / Links
```