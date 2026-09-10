# Releases — FundiOS

> Release notes for the FundiOS pilot build. Each release gets a note file
> `RELEASE_<version>_NOTES.md` summarizing capabilities shipped, blockers
> resolved, and `docs/evidence/` references. Linked from `CHANGELOG.md`.

## Current Release

| Release | Date | Status | Notes |
|---------|------|--------|-------|
| v0.1.0-pilot | 2026-09-10 → | IN PROGRESS | 20-day pilot to Quickstop Garage. Sprint 01 (foundation + verified RLS) and Sprint 02 (governance/context layer) done; F1–F10 pending. |

## Gate for this release (from `docs/release-readiness.md`)

- Green build/lint/typecheck/test/CI on every change
- RLS isolation automated suite green
- P0 extraction tests green (queue scope + key-versioned decryption)
- WhatsApp webhook signature-verified and live (F6)
- Every automated action idempotency-keyed in `automation_logs`
- STATUS.md claims match code (auditor protocol)