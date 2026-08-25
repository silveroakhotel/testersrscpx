/**
 * TikTok Events API 2.0 helper (server-only).
 * Docs: https://business-api.tiktok.com/portal/docs?id=1771101186666498
 */

export type TikTokContent = {
  content_id?: string;
  content_name?: string;
  content_type?: string;
  price?: number;
  quantity?: number;
};

export type SendTikTokEventInput = {
  contents?: TikTokContent[];
  currency?: string;
  event_id: string;
  event_type: string;
  ip?: string;
  page_url?: string;
  pixel_id: string;
  test_event_code?: string;
  token: string;
  ttclid?: string;
  ttp?: string;
  user_agent?: string;
  user_data?: { email?: string; phone?: string; external_id?: string };
  value?: number;
};

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value.trim().toLowerCase()));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sendTikTokEvent(input: SendTikTokEventInput) {
  const user: Record<string, string> = {};
  const email = input.user_data?.email ?? "";
  const phone = (input.user_data?.phone ?? "").replace(/[^\d+]/g, "");

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) user["email"] = await sha256Hex(email);
  if (phone.length >= 8) user["phone"] = await sha256Hex(phone.startsWith("+") ? phone : `+1${phone}`);
  if (input.user_data?.external_id) user["external_id"] = await sha256Hex(input.user_data.external_id);
  if (input.ttclid) user["ttclid"] = input.ttclid;
  if (input.ttp) user["ttp"] = input.ttp;
  if (input.ip) user["ip"] = input.ip;
  if (input.user_agent) user["user_agent"] = input.user_agent;

  const payload = {
    event_source: "web",
    event_source_id: input.pixel_id,
    ...(input.test_event_code ? { test_event_code: input.test_event_code } : {}),
    data: [
      {
        event: input.event_type,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.event_id,
        user,
        properties: {
          currency: input.currency ?? "USD",
          value: input.value ?? 0,
          ...(input.contents?.length ? { contents: input.contents } : {}),
        },
        ...(input.page_url ? { page: { url: input.page_url } } : {}),
      },
    ],
  };

  console.log(
    "[TikTok Events] sending",
    JSON.stringify({
      event: input.event_type,
      event_id: input.event_id,
      hasEmail: Boolean(user["email"]),
      hasTtclid: Boolean(input.ttclid),
      hasTtp: Boolean(input.ttp),
      value: input.value ?? 0,
    }),
  );

  try {
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: { "Access-Token": input.token, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as { code?: number; message?: string };
    const ok = res.ok && body.code === 0;
    if (!ok) console.error("[TikTok Events] failed", res.status, JSON.stringify(body));
    else console.log("[TikTok Events] sent", input.event_id);
    return { ok, response: body };
  } catch (error) {
    console.error("[TikTok Events] error", error);
    return { ok: false, response: { message: String(error) } };
  }
}
