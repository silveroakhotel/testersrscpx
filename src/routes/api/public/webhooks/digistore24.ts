import { createFileRoute } from "@tanstack/react-router";
import { sendTikTokEvent } from "@/lib/tiktok-events.server";

/**
 * Digistore24 IPN ("Genérico (IPN)") webhook.
 * Configure:
 *   https://taskpartners.live/api/public/webhooks/digistore24?secret=<DIGISTORE_WEBHOOK_SECRET>
 * Always answers 200 OK so Digistore never disables the connection.
 */
export const Route = createFileRoute("/api/public/webhooks/digistore24")({
  server: {
    handlers: {
      GET: async () => new Response("OK"),
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const raw = await request.text();
          const contentType = request.headers.get("content-type") ?? "";
          const params: Record<string, string> = contentType.includes("application/json")
            ? flatten(safeJson(raw))
            : Object.fromEntries(new URLSearchParams(raw).entries());

          const event = (params["event"] ?? "").toLowerCase();
          console.log("[DS24 webhook] received", JSON.stringify({ event, keys: Object.keys(params) }));

          // Connection test never requires the secret.
          if (event === "connection_test") return new Response("OK");

          const secret = process.env["DIGISTORE_WEBHOOK_SECRET"] ?? process.env["DIGISTORE_IPN_PASSPHRASE"] ?? "";
          if (secret) {
            const querySecret = url.searchParams.get("secret") ?? "";
            const signature = (params["sha_sign"] ?? "").toUpperCase();
            const authorized =
              querySecret === secret || (signature !== "" && signature === (await digistoreSignature(params, secret)));
            if (!authorized) {
              console.error("[DS24 webhook] unauthorized request");
              return new Response("OK");
            }
          }

          // Only these events represent money actually received.
          if (event !== "on_payment" && event !== "on_rebill_payment") {
            console.log("[DS24 webhook] ignored event", event);
            return new Response("OK");
          }

          const orderId = params["order_id"] || params["receipt"] || params["transaction_id"] || `ds-${Date.now()}`;
          const email = (params["email"] ?? params["buyer_email"] ?? "").trim().toLowerCase();
          const firstName =
            (params["address_first_name"] ?? params["first_name"] ?? "").trim() ||
            (params["address_full_name"] ?? "").trim().split(/\s+/)[0] ||
            "there";
          const currency = params["currency"] || "USD";
          const value = Number.parseFloat(String(params["amount"] ?? params["order_amount"] ?? "0").replace(",", ".")) || 0;
          const attribution = parseAttribution(params);

          // 1) TikTok CompletePayment (deduped by ds24_<order_id>)
          const pixelId = process.env["TIKTOK_PIXEL_ID"] ?? "";
          const token = process.env["TIKTOK_EVENTS_API_TOKEN"] ?? process.env["TIKTOK_ACCESS_TOKEN"] ?? "";
          if (pixelId && token) {
            await sendTikTokEvent({
              pixel_id: pixelId,
              token,
              event_type: "CompletePayment",
              event_id: `ds24_${orderId}`,
              ...(process.env["TIKTOK_TEST_EVENT_CODE"]
                ? { test_event_code: process.env["TIKTOK_TEST_EVENT_CODE"] }
                : {}),
              user_data: { email, phone: params["address_phone_no"] ?? params["phone_no"] ?? params["phone"] ?? "" },
              ...(attribution.ttclid ? { ttclid: attribution.ttclid } : {}),
              ...(attribution.ttp ? { ttp: attribution.ttp } : {}),
              ...(params["ip"] ? { ip: params["ip"] } : {}),
              value,
              currency,
              page_url: "https://taskpartners.live/thanks",
              contents: [
                {
                  content_id: params["product_id"] ?? "digistore-product",
                  content_type: "product",
                  content_name: params["product_name"] ?? "Task Partners Access",
                  price: value,
                  quantity: 1,
                },
              ],
            });
          } else {
            console.error("[DS24 webhook] TikTok pixel id or token missing");
          }

          // 2) Access email (idempotent per order)
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            const res = await fetch(`${url.origin}/api/public/send-access-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                first_name: firstName,
                name: firstName,
                order_id: orderId,
                reference: orderId,
                template: "purchase_access",
              }),
            });
            if (!res.ok) console.error("[DS24 webhook] access email failed", res.status);
          } else {
            console.error("[DS24 webhook] no buyer email in payload");
          }

          return new Response("OK");
        } catch (error) {
          console.error("[DS24 webhook] internal error", error);
          return new Response("OK");
        }
      },
    },
  },
});

/** `custom` arrives as `email|ttclid|_ttp` or `ttclid:xxx|ttp:yyy`. */
function parseAttribution(params: Record<string, string>) {
  const blob = [params["custom"], params["ttclid"], params["cam"], params["campaignkey"], params["tracking"]]
    .filter(Boolean)
    .join("|");

  let ttclid = params["ttclid"] || blob.match(/ttclid[=:]([^&|;,\s]+)/i)?.[1] || "";
  let ttp = params["ttp"] || params["_ttp"] || blob.match(/_?ttp[=:]([^&|;,\s]+)/i)?.[1] || "";

  if (!ttclid || !ttp) {
    // positional fallback: email|token|token
    const parts = (params["custom"] ?? "").split("|").filter(Boolean);
    for (const part of parts) {
      if (part.includes("@") || part.includes(":")) continue;
      if (!ttclid) ttclid = part;
      else if (!ttp) ttp = part;
    }
  }
  return { ttclid, ttp };
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function flatten(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === null || value === undefined || typeof value === "object") continue;
    out[key] = String(value);
  }
  return out;
}

async function digistoreSignature(params: Record<string, string>, passphrase: string) {
  const keys = Object.keys(params)
    .filter((key) => key.toLowerCase() !== "sha_sign")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  let payload = "";
  for (const key of keys) {
    const value = params[key];
    if (!value) continue;
    payload += `${key}=${value}${passphrase}`;
  }
  const digest = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}
