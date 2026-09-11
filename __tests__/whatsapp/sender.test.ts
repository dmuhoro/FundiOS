import { describe, expect, it } from "vitest";
import {
  sendWhatsAppText,
  setTransportForTests,
} from "../../convex/lib/whatsappSender";

type Transport = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

function fakeTransport(
  status: number,
  body?: Record<string, unknown>,
): Transport {
  return async (_url, _init) =>
    new Response(body ? JSON.stringify(body) : undefined, { status });
}

describe("WhatsApp outbound sender", () => {
  it("returns not_configured when token is missing", async () => {
    const result = await sendWhatsAppText({
      to: "254712345678",
      phoneNumberId: "123",
      body: "Hi",
      accessToken: undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not_configured");
  });

  it("returns not_configured when phoneNumberId is missing", async () => {
    const result = await sendWhatsAppText({
      to: "254712345678",
      phoneNumberId: "",
      body: "Hi",
      accessToken: "tok",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not_configured");
  });

  it("sends the correct payload and returns ok", async () => {
    let capturedUrl: string | undefined;
    let capturedInit: RequestInit | undefined;
    const t: Transport = async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };
    setTransportForTests(t);
    try {
      const result = await sendWhatsAppText({
        to: "254712345678",
        phoneNumberId: "105431206008513",
        body: "Hello from FundiOS",
        accessToken: "test-token",
      });
      expect(result).toEqual({ ok: true });
      expect(capturedUrl).toContain("/v21.0/105431206008513/messages");
      const parsed = JSON.parse(capturedInit!.body as string);
      expect(parsed).toEqual({
        messaging_product: "whatsapp",
        to: "254712345678",
        type: "text",
        text: { body: "Hello from FundiOS" },
      });
      expect(capturedInit!.headers).toMatchObject({
        Authorization: "Bearer test-token",
      });
    } finally {
      setTransportForTests(null);
    }
  });

  it("maps HTTP non-200 to a http_* code", async () => {
    setTransportForTests(fakeTransport(429, { error: "rate limited" }));
    try {
      const result = await sendWhatsAppText({
        to: "254712345678",
        phoneNumberId: "105431206008513",
        body: "Hi",
        accessToken: "tok",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("http_429");
    } finally {
      setTransportForTests(null);
    }
  });

  it("maps fetch throw to transport_error", async () => {
    setTransportForTests(async () => {
      throw new TypeError("fetch failed");
    });
    try {
      const result = await sendWhatsAppText({
        to: "254712345678",
        phoneNumberId: "105431206008513",
        body: "Hi",
        accessToken: "tok",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("transport_error");
    } finally {
      setTransportForTests(null);
    }
  });
});