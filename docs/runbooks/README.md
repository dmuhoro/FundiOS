# Runbooks — FundiOS

> Operational procedures. Each runbook is a step-by-step, copy-paste-able
> procedure with exact commands. If a step can fail, it says what "failed"
> looks like and what to do.

## Index

| Runbook | When to use |
|---|---|
| `deployment.md` | Deploy or verify the app locally / to Vercel + Supabase |
| `supabase-local.md` | Apply migrations + seed locally, regenerate types, run the RLS proof |
| `whatsapp-webhook.md` | Set up / verify the WhatsApp Cloud API webhook (GET + POST plan) |

## Rules

- Never commit secrets; `.env.local.example` documents names only.
- Document any deviation from these steps in `docs/evidence/`.