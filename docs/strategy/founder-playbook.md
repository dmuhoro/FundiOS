# Founder Playbook — Daniel / FundiOS

> Status: **LIVE DOCTRINE.** This replaces the locked-chat raw thoughts as the
> source of truth for the founder business. Agents and future-you execute this
> document, not the chat archive. Re-read before any strategy decision.
> Inspired models referenced explicitly: **Serge Gatari** (build employees that
> work for you; operate a real business, not hustle), **Bgo / CodeToCEO**
> (document the build publicly; audience = pipeline), and the **wedge thesis**
> (own one department with measurable results, earn the rest).

---

## 1. The thesis (why this exists)

> "If I work on one department — marketing — perfectly and get measurable
> results for a business, I get the credibility and admin access to work on
> making the whole business grow and scale."

FundiOS is the productized engine of that thesis: a multi-tenant marketing
operations OS for East African automobile garages. The wedge: **Quickstop
Garage, Kiambu Road** — one garage, one department, one number that moves.

## 2. Positioning

- **We do not sell "posts" or "ads services."** We sell a measurable
  acquisition-to-relationship pipeline: capture → auto-nurture → reminder →
  repeat service. The deliverable is software that executes, plus a light
  strategy layer — not billable hours.
- Pitch: *"We give your garage a professional marketing department without
  hiring one, and we show you which channel actually brings paying jobs."*
- Elevator proof pattern (for the owner): `leads → bookings`, not impressions.

## 3. Business model — software-enabled consultancy

**Two streams, one contract:**

1. **SaaS subscription (per tenant, monthly).** FundiOS access: WhatsApp
   capture + auto-reply, vehicle CRM, reminders, marketing dashboard. This is
   recurring revenue and the moat. Price tiers below.
2. **Light retainer (strategy + creative + monthly review).** Content calendar,
   ad-set structure, copy, one monthly results review. This is the foot-in-door;
   it funds the relationship while the subscription compounds.

Progression (from locked-chat): land on **marketing only**. Get a measurable
win (e.g., leads→bookings up, or capturable attribution). Then earn a
**business-optimization mandate** (scheduling, quoting, payments).
Only then run the full operations OS.

### Pricing (ballpark, pilot region Kenya — calibrate with field-audit Q8)

| Tier | SaaS (KES/mo) | Retainer (KES/mo) | Includes |
|------|--------------|-------------------|----------|
| Starter | 5K–10K | 10K–15K | capture + CRM + dashboard; 2 posts/wk + monthly review |
| Growth | 10K–20K | 20K–40K | + reminders, ad management (Meta), weekly review |
| Premium (ops mandate) | 20K–40K | 40K–80K | + scheduling/payments ops layer, 2 campaigns/mo |

Rules: never discount the retainer below the cost of your time; price the SaaS
so a garage can't outsource-cheap (contractor ≈ >50K KES/mo → SaaS+retainer is
the value). Always fix the promise to a number in Q1 — lift `leads → services`.

### BMC (one-liner map)

- **Customers:** automobile garages (mechanical/bodyshop/mobile) — first
  Quickstop, then the Kiambu-Road cluster, then garage #2 for economies of scale.
- **Problem:** no measurable acquisition, no follow-up, no data.
- **Solution:** capture→nurture→remind pipeline + dashboard proof.
- **Channels:** WhatsApp first; then Facebook/IG/TikTok + Google (per
  `field-audit.md`); founder's own LinkedIn/X build-log as the sales asset.
- **Revenue:** subscription + retainer.
- **Costs:** your time, WhatsApp/Meta spend (client-funded), infra (~cheap).
- **Key metric:** `leads→paid services`, `repeat services`, `opt-in %`.

## 4. SMMA operating playbook (the "how")

- **One niche deep.** Garage niche only, until we own the reference then
  template-copy to garage #2. No wandering niches.
- **Cadence:** weekly (content ship 2–3 assets), monthly (review: what the
  numbers say — keep, kill, double).
- **Channels that work in the niche (from archive):** Facebook (page +
  Marketplace + groups), TikTok + IG (shop-floor before/after, diagnostics),
  WhatsApp Business (catalogue, labels, auto-reply), Google (GMB + reviews).
- **Feedback loops:** every change is a hypothesis with a response field. Log
  results in `docs/evidence/` style. Iterate on what's not working; keep what
  is. **Never run a channel twice without a number from the first run.**
- **Ads protocol (Meta):** one objective (Lead / Traffic→capture page), UTM
  on every link (`utm_source/campaign/content`), creative refreshed every 2–3
  weeks, audience = garage's unknown customers by lookalike + interest, spend
  logged weekly (per ad set) so cost-per-lead is real (currently manual input
  — Meta CAPI integration is future work).

## 5. The moat (why we can't be replicated)

1. **The pipes.** Durable, idempotency-keyed queue + sender + crons you cannot
   get with a freelance agency. We prove delivery, backoff, audit — not hours.
2. **The connector.** FundiOS loads *inside* the tenant's garage OS
   (Brianna'sOS contract v1) — load-bearing, not bolt-on.
3. **Compounding data.** Per-tenant opt-ins, vehicle history, lead→customer
   paths. More garages ⇒ sharper funnel ⇒ higher retention ⇒ nobody out-bids
   the network effect without the multi-tenant grind.
4. **The playbook + public build.** The doctrine and the documented build (this
   repo, LinkedIn/X) are themselves a trust asset.

## 6. Agent infrastructure doctrine (Google AI Studio / opencode / any agent)

> From locked-chat: "use Google AI Studio as my implementation agent
> strategically/properly." The pattern that makes agentic builds safe is
> already proven in this repo — replicate it with any tool:

1. **Strategy in docs first** (this playbook, PRD, Constitution). Agents&nbsp;execute
   doctrine, never improvise the business.
2. **A written safety constitution** (fail-closed, no silent drops, enforcement
   at the real boundary).
3. **Proof exercises the real path** — tests hit the actual submission boundary,
   not a fake helper.
4. **Everything automated is audited** (idempotency keys, logs).
5. **Human-in-the-loop for irreversible actions** (delete, refund, kill).
6. **One vertical slice per sprint; loops until green.** Same discipline applies
   if you hand "AI Studio" (or any agent) a Product-sprint: docs → code → test →
   deploy → evidence, nothing left pending.

## 7. Who must I become (identity layer)

- **Meta ads competence** (from archive question): run real spend on Quickstop,
  study Meta Blueprint/community examples, track cost-per-lead weekly. Skill is
  a consequence of shipped campaigns with numbers — not courses.
- **Operate like Gatari:** build systems/employees (agents = employees) that
  deliver; obsess over the pipeline working without your presence.
- **Public builder like CodeToCEO:** ship the build log weekly; the audience
  becomes the future client list and the proof of competence.
- **Discipline beats motivation:** the weekly rhythm and the monthly review are
  non-negotiable even when they're boring.

## 8. Long-horizon (hold the mountain, gate it)

Alphabet-style portfolio (**kept out of active scope until the wedge is proven
- one department in one garage first**):
- Education — **EasyTutor**
- Business ops — **Daftari**
- HealthTech — **DentalOS / ClinicOS**
- FinTech — borderless-trade platform (working name **AfroPay** — re-name later;
  near-name collisions exist in payments)

Rule: **no second-owned vertical ships until FundiOS has a signed, measurable
garage #2 and the founder infrastructure (ad skills, playbook, agent doctrine)
is proven.** The portfolio team's job: name it now, build it later.

## 9. Anti-scope-creep / failure guards

- No new niche, platform, or product without an evidence row (doctrine §6).
- No promise without a baseline number from the field audit.
- No ad channel without a UTM + logged spend + a feedback loop.
- No silent drops: if a lead/reminder fails, it's marked, retried, or audited.
- Default is **ask for the number**, fetch the real path, then build — never
  assume the market out of a locked chat.

## 10. Definition of done for the current campaign (Sprint 08)

- Public capture landing at `/c/<slug>` (UTM-attributed) → leads land in tenant
  CRM with source + campaign; marketing dashboard shows leads by source,
  by campaign, and conversion → customer.
- Field audit template handed to Daniel. Playbook (this doc) committed.
- Live verify the loop; evidence logged; STATUS/CHANGELOG updated; everything
  green; pushed.