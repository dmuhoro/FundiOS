/**
 * Proves the Convex-runtime landing page module (the HTML the site's root
 * route actually serves) and its contract: a 200-worthy, self-contained HTML
 * document branded FundiOS — never the infrastructure slug.
 */
import { describe, expect, it } from "vitest";
import { buildLandingPage } from "../../convex/lib/landing";

describe("FundiOS landing page (Convex-runtime)", () => {
  it("produces a well-formed HTML document", () => {
    const html = buildLandingPage();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html lang=");
    expect(html).toContain("</html>");
    expect(html).toContain("<title>");
    expect(html).toContain("</title>");
    expect(html.match(/<h1/g)?.length).toBeGreaterThanOrEqual(1);
    expect(html.match(/<\/section>|<\/footer>|<footer<\/g/g)?.length).toBeGreaterThanOrEqual(1);
  });

  it("brands the product as FundiOS — never the infrastructure slug", () => {
    const html = buildLandingPage();
    expect(html).toContain("FundiOS");
    expect(html).toContain("<title>FundiOS");
    expect(html).not.toContain("confident-weasel-372");
    expect(html).not.toContain("convex.cloud");
  });

  it("lists the live endpoints consumers can rely on", () => {
    const html = buildLandingPage();
    expect(html).toContain("/api/whatsapp/webhook");
    expect(html).toContain("HMAC-verified");
    expect(html).toContain("/");
  });

  it("describes the shipped capabilities with no placeholders", () => {
    const html = buildLandingPage();
    for (const capability of [
      "WhatsApp lead capture",
      "Instant auto-reply",
      "Vehicle CRM",
      "Durable automation",
      "Multi-tenant by design",
      "Live owner dashboard",
    ]) {
      expect(html).toContain(capability);
    }
    expect(html).not.toMatch(/TODO|TBD|lorem|placeholder/gi);
    expect(html).not.toContain("{{");
  });
});