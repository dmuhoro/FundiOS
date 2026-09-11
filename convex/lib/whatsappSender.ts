import { WHATSAPP_BASE_URL } from "@/lib/constants";

export type Transport = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

let testTransport: Transport | null = null;

export function setTransportForTests(transport: Transport | null) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("setTransportForTests is test-only");
  }
  testTransport = transport;
}

export async function sendWhatsAppText(input: {
  to: string;
  phoneNumberId: string;
  body: string;
  accessToken: string | undefined;
  transport?: Transport;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const { to, phoneNumberId, body, accessToken, transport } = input;
  if (!accessToken || !phoneNumberId) {
    return { ok: false, code: "not_configured" };
  }

  const t = transport ?? testTransport ?? fetch;
  let res: Response;
  try {
    res = await t(`${WHATSAPP_BASE_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    });
  } catch {
    return { ok: false, code: "transport_error" };
  }

  if (!res.ok) {
    return { ok: false, code: `http_${res.status}` };
  }
  return { ok: true };
}