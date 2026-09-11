import { z } from "zod";
import { isValidKenyanPhone } from "./phone";

export const CAPTURE_BODY_LIMIT = 2048;
export const CAPTURE_FIELD_LIMITS = {
  phone: 24,
  name: 120,
  message: 1000,
  campaignKey: 200,
} as const;

const captureInputSchema = z.object({
  phone: z.string().min(1).max(CAPTURE_FIELD_LIMITS.phone),
  name: z.string().max(CAPTURE_FIELD_LIMITS.name).optional(),
  message: z.string().max(CAPTURE_FIELD_LIMITS.message).optional(),
  source: z
    .enum(["facebook", "instagram", "tiktok", "google", "other"])
    .optional(),
  campaignKey: z.string().max(CAPTURE_FIELD_LIMITS.campaignKey).optional(),
});

export type CaptureInput = z.infer<typeof captureInputSchema>;
export type CaptureResult =
  | { ok: true; payload: Required<Pick<CaptureInput, "phone">> & CaptureInput }
  | { ok: false; code: string; message: string };

export function parseCaptureForm(input: unknown): CaptureResult {
  const parsed = captureInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid_capture",
      message: parsed.error.issues[0]?.message ?? "Invalid capture payload",
    };
  }
  if (!isValidKenyanPhone(parsed.data.phone)) {
    return {
      ok: false,
      code: "invalid_phone",
      message: "Provide a valid Kenyan phone number",
    };
  }
  return { ok: true, payload: parsed.data };
}

export function resolveUtmCampaign(input: {
  slug: string;
  utmCampaign?: string | null;
  utmSource?: string | null;
}): { campaignKey: string; source: CaptureInput["source"] } {
  const campaignKey =
    input.utmCampaign?.trim().slice(0, CAPTURE_FIELD_LIMITS.campaignKey) ||
    input.slug;
  const utm = input.utmSource?.trim().toLowerCase().slice(0, 40) ?? "";
  const source: CaptureInput["source"] =
    utm === "facebook" || utm === "instagram" || utm === "tiktok" || utm === "google"
      ? utm
      : "other";
  return { campaignKey, source };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildCapturePage(input: {
  slug: string;
  garageName: string;
  campaignKey?: string;
  source?: CaptureInput["source"];
}): string {
  const garage = escapeHtml(input.garageName);
  const slug = escapeHtml(input.slug);
  const campaignKey = escapeHtml(input.campaignKey ?? input.slug);
  const source = input.source ?? "facebook";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Book a garage visit — ${garage}</title>
  <meta name="description" content="Tell ${garage} about your vehicle and get a fast response on WhatsApp." />
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; color: #0f172a; line-height: 1.55; }
    .hero { background: linear-gradient(135deg, #0b1b3a 0%, #14306b 55%, #1d4ed8 100%); color: #fff; padding: 56px 24px 48px; text-align: center; }
    .hero h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); margin: 0 0 8px; }
    .hero p { color: #e2e8f0; margin: 0; }
    .card { max-width: 520px; margin: -28px auto 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px; box-shadow: 0 10px 30px rgba(2, 6, 23, .08); }
    label { display: block; font-size: .85rem; font-weight: 600; color: #334155; margin: 14px 0 6px; }
    input, textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 1rem; font-family: inherit; }
    input:focus, textarea:focus { outline: 2px solid #1d4ed8; outline-offset: 1px; border-color: transparent; }
    button { width: 100%; margin-top: 22px; border: 0; border-radius: 8px; padding: 14px; font-size: 1rem; font-weight: 600; color: #fff; background: #1d4ed8; cursor: pointer; }
    button:hover { background: #1e40af; }
    .note { margin-top: 16px; font-size: .8rem; color: #64748b; text-align: center; }
    input[name="phone"] { font-size: 1.05rem; }
  </style>
</head>
<body>
  <section class="hero">
    <h1>${garage}</h1>
    <p>Tell us about your vehicle — we'll get back to you fast on WhatsApp.</p>
  </section>
  <form class="card" method="post" action="/c/${slug}">
    <input type="hidden" name="campaignKey" value="${campaignKey}" />
    <input type="hidden" name="source" value="${source}" />
    <label for="name">Your name (optional)</label>
    <input id="name" name="name" type="text" maxlength="120" autocomplete="name" />
    <label for="phone">Phone number (required)</label>
    <input id="phone" name="phone" type="tel" inputmode="tel" maxlength="24" required placeholder="07xx xxx xxx" autocomplete="tel" />
    <label for="message">What does the car need? (optional)</label>
    <textarea id="message" name="message" rows="3" maxlength="1000" placeholder="e.g. oil service, noisy brakes"></textarea>
    <button type="submit">Send my request</button>
    <p class="note">Powered by FundiOS · your number is only used to respond to this request.</p>
  </form>
</body>
</html>`;
}

export function buildCaptureSuccessPage(input: { garageName: string }): string {
  const garage = escapeHtml(input.garageName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Request received — ${garage}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f1f5f9; color: #0f172a; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    .card { max-width: 460px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 40px 32px; text-align: center; }
    .check { display: inline-grid; place-items: center; width: 52px; height: 52px; border-radius: 999px; background: #dcfce7; color: #16a34a; font-size: 1.6rem; }
    h1 { font-size: 1.4rem; margin: 16px 0 8px; }
    p { color: #475569; margin: 0 0 8px; }
    .garage { font-weight: 700; color: #0f172a; }
  </style>
</head>
<body>
  <div class="card">
    <span class="check">✓</span>
    <h1>Request received</h1>
    <p>Thanks! <span class="garage">${garage}</span> will get back to you on WhatsApp soon.</p>
  </div>
</body>
</html>`;
}