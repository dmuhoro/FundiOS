const CAPABILITIES = [
  {
    title: "WhatsApp lead capture",
    body: "Every inbound message is signature-verified, parsed with Zod, matched to your garage, and captured as a lead — idempotently, so re-delivered webhooks never duplicate.",
  },
  {
    title: "Instant auto-reply",
    body: "Personalized greetings (English or Swahili) are queued on every lead message and dispatched through a durable outbound pipeline.",
  },
  {
    title: "Vehicle CRM",
    body: "Customers, vehicles, and service history per garage — with opt-in reminders that reference the customer's exact make and model.",
  },
  {
    title: "Durable automation",
    body: "Every send is an idempotency-keyed, tenant-scoped job with backoff, a hard failure cap, and a full audit trail. Nothing is silently dropped.",
  },
  {
    title: "Multi-tenant by design",
    body: "Isolation is enforced at the Convex function boundary and verified at query time — proven by automated tests, not assumed.",
  },
  {
    title: "Live owner dashboard",
    body: "A session-gated console with KPIs, an activity feed, and configuration for the garage's marketing machine.",
  },
];

const DOCS = [
  { label: "Product requirements", href: "https://github.com/dmuhoro/fundios/blob/main/docs/PRD.md" },
  { label: "Engineering Constitution", href: "https://github.com/dmuhoro/fundios/blob/main/docs/engineering/CONSTITUTION.md" },
  { label: "Status", href: "https://github.com/dmuhoro/fundios/blob/main/STATUS.md" },
  { label: "Changelog", href: "https://github.com/dmuhoro/fundios/blob/main/CHANGELOG.md" },
];

function capabilitiesHtml(): string {
  return CAPABILITIES.map(
    (c, i) => `
      <li class="card">
        <span class="num">${String(i + 1).padStart(2, "0")}</span>
        <div>
          <h3>${c.title}</h3>
          <p>${c.body}</p>
        </div>
      </li>`,
  ).join("");
}

function docsHtml(): string {
  return DOCS.map(
    (d) => `<a class="doc-link" href="${d.href}" target="_blank" rel="noopener noreferrer">${d.label}</a>`,
  ).join("");
}

export function buildLandingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FundiOS — Marketing Operations OS for Automobile Garages</title>
  <meta name="description" content="FundiOS gives East African automobile garages a professional marketing department: WhatsApp lead capture, auto-reply, vehicle CRM, service reminders, and durable automation — in one dashboard." />
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; line-height: 1.55; }
    .hero { background: linear-gradient(135deg, #0b1b3a 0%, #14306b 55%, #1d4ed8 100%); color: #fff; padding: 72px 24px 64px; }
    .hero-inner, .shell { max-width: 1000px; margin: 0 auto; }
    .eyebrow { text-transform: uppercase; letter-spacing: .18em; font-size: .78rem; color: #cbd5e1; display:block; margin-bottom: 16px; }
    h1 { font-size: clamp(2rem, 5vw, 3.25rem); line-height: 1.1; margin: 0 0 16px; font-weight: 700; }
    h1 em { font-style: normal; color: #fbbf24; }
    .lede { font-size: 1.125rem; color: #e2e8f0; max-width: 640px; margin: 0 0 28px; }
    .pill { display: inline-block; border: 1px solid rgba(255,255,255,.35); border-radius: 999px; padding: 6px 14px; font-size: .85rem; color: #e2e8f0; margin: 0 8px 8px 0; }
    .pill strong { color: #fff; }
    .badge { display:inline-flex; align-items:center; gap:8px; border:1px solid #86efac; color:#bbf7d0; border-radius:999px; padding:6px 14px; font-size:.82rem; margin-bottom:20px; }
    .dot { width:8px; height:8px; border-radius:999px; background:#4ade80; }
    .shell { padding: 56px 24px; }
    h2 { font-size: 1.5rem; font-weight: 700; margin: 0 0 8px; color: #0b1b3a; }
    .sub { color: #475569; margin: 0 0 28px; }
    ul.cards { list-style: none; padding: 0; margin: 0 0 48px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; gap: 14px; }
    .num { color: #1d4ed8; font-weight: 700; font-size: .85rem; letter-spacing: .05em; }
    .card h3 { margin: 0 0 6px; font-size: 1rem; }
    .card p { margin: 0; color: #475569; font-size: .92rem; }
    .endpoints { background: #0f172a; color: #e2e8f0; border-radius: 12px; padding: 20px 24px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9rem; margin: 0 0 48px; overflow-x: auto; }
    .endpoints strong { color: #fbbf24; }
    .doc-links { display: flex; flex-wrap: wrap; gap: 12px; }
    .doc-link { color: #1d4ed8; text-decoration: none; font-size: .95rem; border: 1px solid #bfdbfe; border-radius: 999px; padding: 8px 16px; }
    .doc-link:hover { background: #eff6ff; }
    footer { border-top: 1px solid #e2e8f0; background: #fff; padding: 24px; text-align: center; color: #64748b; font-size: .85rem; }
    footer .pilot { font-weight: 600; color: #0f172a; }
  </style>
</head>
<body>
  <section class="hero">
    <div class="hero-inner">
      <span class="eyebrow">Marketing operations OS</span>
      <h1>Fund<i>iOS</i></h1>
      <p class="lede">
        FundiOS gives East-African automobile garages a professional marketing
        department without hiring one — WhatsApp lead capture, a vehicle CRM,
        instant auto-replies, service reminders, and durable automation, in one
        live dashboard.
      </p>
      <span class="badge"><span class="dot"></span>Service live</span>
      <div>
        <span class="pill">Pilot tenant: <strong>Quickstop Garage</strong></span>
        <span class="pill">Nairobi · Kiambu Road</span>
        <span class="pill">Multi-tenant by design</span>
        <span class="pill">Fail-closed automation</span>
      </div>
    </div>
  </section>

  <div class="shell">
    <h2>What this build does</h2>
    <p class="sub">Six verticals shipped and verified — every one audited, none silent.</p>
    <ul class="cards">
      ${capabilitiesHtml()}
    </ul>

    <h2>Live endpoints</h2>
    <p class="sub">The Convex site that serves this page also hosts the automation API.</p>
    <pre class="endpoints">GET  /                        <strong>this landing page</strong>
POST /api/whatsapp/webhook    inbound WhatsApp (HMAC-verified)
GET  /api/whatsapp/webhook    Meta webhook verification
GET  /c/&lt;garage-slug&gt;         campaign capture page (UTM-attributed)
POST /c/&lt;garage-slug&gt;         campaign capture submission</pre>

    <h2>Engineering evidence</h2>
    <p class="sub">Documentation is the product. Read-only artifacts below (canonical copies live in the repo).</p>
    <div class="doc-links">
      ${docsHtml()}
    </div>
  </div>

  <footer>
    <span class="pilot">FundiOS</span> · Pilot build, Sprints 1–6 shipped · Isolation proven by automated tests ·
    WhatsApp + M-Pesa credentials gate the outbound path until configured.
  </footer>
</body>
</html>`;
}