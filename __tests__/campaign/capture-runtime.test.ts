import { describe, expect, it } from "vitest";
import {
  buildCapturePage,
  buildCaptureSuccessPage,
  parseCaptureForm,
  resolveUtmCampaign,
} from "../../convex/lib/campaign";

describe("parseCaptureForm (edge-safe validator)", () => {
  it("accepts a valid Kenyan capture", () => {
    const result = parseCaptureForm({
      phone: "0711222333",
      name: "Nyaga",
      message: "Noisy brakes",
      source: "facebook",
      campaignKey: "quickstop_ad",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.phone).toBe("0711222333");
      expect(result.payload.source).toBe("facebook");
      expect(result.payload.campaignKey).toBe("quickstop_ad");
    }
  });

  it("rejects a non-Kenyan phone", () => {
    const result = parseCaptureForm({ phone: "+15551234567", campaignKey: "c" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_phone");
  });

  it("rejects an empty phone", () => {
    const result = parseCaptureForm({ phone: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_capture");
  });

  it("rejects an unknown source enum", () => {
    const result = parseCaptureForm({ phone: "0711222333", source: "snapchat" });
    expect(result.ok).toBe(false);
  });

  it("rejects oversized fields (fail closed)", () => {
    const result = parseCaptureForm({
      phone: "0711222333",
      campaignKey: "x".repeat(201),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_capture");
  });

  it("accepts a capture with no campaign key (untracked default)", () => {
    const result = parseCaptureForm({ phone: "0711222333" });
    expect(result.ok).toBe(true);
  });
});

describe("resolveUtmCampaign", () => {
  it("uses utm_campaign when present, else the slug", () => {
    expect(resolveUtmCampaign({ slug: "quickstop", utmCampaign: "sale_march" }).campaignKey).toBe("sale_march");
    expect(resolveUtmCampaign({ slug: "quickstop" }).campaignKey).toBe("quickstop");
  });

  it("maps utm_source to a supported capture source, defaulting to other", () => {
    expect(resolveUtmCampaign({ slug: "q", utmSource: "Instagram" }).source).toBe("instagram");
    expect(resolveUtmCampaign({ slug: "q", utmSource: "tiktok" }).source).toBe("tiktok");
    expect(resolveUtmCampaign({ slug: "q", utmSource: "google" }).source).toBe("google");
    expect(resolveUtmCampaign({ slug: "q", utmSource: "snapchat" }).source).toBe("other");
    expect(resolveUtmCampaign({ slug: "q" }).source).toBe("other");
  });
});

describe("Capture page HTML", () => {
  it("renders a form posting back to the campaign path with hidden attribution", () => {
    const html = buildCapturePage({
      slug: "quickstop",
      garageName: `Quickstop <Garage> & Sons`,
      campaignKey: "awareness_march",
      source: "facebook",
    });
    expect(html).toContain('<form class="card" method="post" action="/c/quickstop">');
    expect(html).toContain('name="campaignKey" value="awareness_march"');
    expect(html).toContain('name="source" value="facebook"');
    expect(html).toContain("Quickstop &lt;Garage&gt; &amp; Sons");
    expect(html).toContain('<input id="phone" name="phone"');
  });

  it("renders a sanitized success page", () => {
    const html = buildCaptureSuccessPage({ garageName: "Quickstop</h1><script>" });
    expect(html).toContain("Quickstop&lt;/h1&gt;&lt;script&gt;");
    expect(html).toContain("Request received");
  });
});