import { createFileRoute } from "@tanstack/react-router";

const FROM = "Task Partners Support <support@taskpartners.live>";
const DASHBOARD_URL = "https://taskpartners.live/tasks-app?utm_source=tiktok";

/**
 * Digistore24 IPN endpoint.
 * Configure in Digistore24 (product > Settings > IPN / Connections):
 *   URL: https://taskpartners.live/api/public/digistore-ipn
 *   Passphrase: same value stored in DIGISTORE_IPN_PASSPHRASE
 */
export const Route = createFileRoute("/api/public/digistore-ipn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const passphrase = process.env["DIGISTORE_IPN_PASSPHRASE"];
        const resendKey = process.env["RESEND_API_KEY"];

        let params: Record<string, string> = {};
        try {
          const raw = await request.text();
          const contentType = request.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            params = flatten(JSON.parse(raw));
          } else {
            params = Object.fromEntries(new URLSearchParams(raw).entries());
          }
        } catch {
          return new Response("invalid_body", { status: 400 });
        }

        // Signature check (Digistore24 SHA512 sha_sign)
        if (passphrase) {
          const provided = (params["sha_sign"] ?? "").toUpperCase();
          const expected = await digistoreSignature(params, passphrase);
          if (!provided || provided !== expected) {
            console.error("[Digistore IPN] invalid signature");
            return new Response("invalid_signature", { status: 401 });
          }
        }

        const event = (params["event"] ?? "").toLowerCase();
        const orderId = params["order_id"] ?? params["transaction_id"] ?? "";
        const email = (params["email"] ?? params["buyer_email"] ?? "").trim().toLowerCase();
        const firstName =
          (params["address_first_name"] ?? params["first_name"] ?? "").trim() ||
          (params["address_full_name"] ?? "").trim().split(/\s+/)[0] ||
          "there";
        const productName = params["product_name"] ?? "Task Partners Access";
        const amount = params["amount"] ?? params["order_amount"] ?? "";
        const currency = params["currency"] ?? "USD";

        // Only approved payments trigger the access email.
        const approved = event === "on_payment" || event === "connection_test" || event === "";
        if (!approved) {
          return new Response("OK");
        }

        if (event === "connection_test") {
          return new Response("OK");
        }

        // Server-side TikTok conversion (Events API 2.0)
        await trackTikTokPurchase({
          amount,
          currency,
          email,
          orderId,
          params,
          productName,
        });


        if (!resendKey) {
          console.error("[Digistore IPN] RESEND_API_KEY missing");
          return new Response("OK"); // never make Digistore retry forever
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          console.error("[Digistore IPN] missing buyer email");
          return new Response("OK");
        }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
            ...(orderId ? { "Idempotency-Key": `digistore-${orderId}` } : {}),
          },
          body: JSON.stringify({
            from: FROM,
            to: [email],
            subject: "Your payout unlock is confirmed",
            html: purchaseEmail({
              amount: amount ? `${amount} ${currency}` : "",
              firstName,
              orderId,
              productName,
            }),
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error("[Digistore IPN] Resend failed", res.status, body);
        }

        return new Response("OK");
      },
      GET: async () => new Response("OK"),
    },
  },
});

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Fires a CompletePayment conversion to the TikTok Events API (server-side). */
async function trackTikTokPurchase({
  amount,
  currency,
  email,
  orderId,
  params,
  productName,
}: {
  amount: string;
  currency: string;
  email: string;
  orderId: string;
  params: Record<string, string>;
  productName: string;
}) {
  const accessToken = process.env["TIKTOK_ACCESS_TOKEN"];
  const pixelId = process.env["TIKTOK_PIXEL_ID"] ?? "D9LL0KBC77UFHPI0J730";
  if (!accessToken) {
    console.error("[Digistore IPN] TIKTOK_ACCESS_TOKEN missing - conversion not sent");
    return;
  }

  // Digistore forwards click ids through the custom/tracking fields when set.
  const trackingBlob = [
    params["ttclid"],
    params["custom"],
    params["cam"],
    params["campaignkey"],
    params["tracking"],
    params["affiliate_tracking"],
  ]
    .filter(Boolean)
    .join("&");
  const ttclid =
    params["ttclid"] || (trackingBlob.match(/ttclid[=:]([^&|;,\s]+)/i)?.[1] ?? "");
  const ttp = params["ttp"] || (trackingBlob.match(/ttp[=:]([^&|;,\s]+)/i)?.[1] ?? "");

  const rawPhone = (params["address_phone_no"] ?? params["phone_no"] ?? params["phone"] ?? "").replace(
    /[^\d+]/g,
    "",
  );

  const user: Record<string, string> = {};
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) user["email"] = await sha256Hex(email);
  if (rawPhone.length >= 8) {
    user["phone"] = await sha256Hex(rawPhone.startsWith("+") ? rawPhone : `+1${rawPhone}`);
  }
  if (ttclid) user["ttclid"] = ttclid;
  if (ttp) user["ttp"] = ttp;
  if (params["ip"]) user["ip"] = params["ip"];

  if (Object.keys(user).length === 0) {
    console.error("[Digistore IPN] no TikTok identifiers available");
    return;
  }

  const value = Number.parseFloat(String(amount).replace(",", ".")) || 0;

  const payload = {
    event_source: "web",
    event_source_id: pixelId,
    data: [
      {
        event: "CompletePayment",
        event_time: Math.floor(Date.now() / 1000),
        event_id: orderId || `ds-${Date.now()}`,
        user,
        properties: {
          currency: currency || "USD",
          value,
          contents: [
            {
              content_id: params["product_id"] ?? "digistore-product",
              content_type: "product",
              content_name: productName,
              price: value,
              quantity: 1,
            },
          ],
        },
        page: { url: "https://taskpartners.live/thanks" },
      },
    ],
  };

  try {
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: { "Access-Token": accessToken, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}) as { code?: number; message?: string });
    if (!res.ok || (body as { code?: number }).code !== 0) {
      console.error("[Digistore IPN] TikTok Events API failed", res.status, JSON.stringify(body));
    }
  } catch (error) {
    console.error("[Digistore IPN] TikTok Events API error", error);
  }
}

function flatten(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    out[key] = String(value);
  }
  return out;
}

/**
 * Digistore24 signature: all params except sha_sign, sorted by key
 * (case-insensitive), skipping empty values, joined as key=value+passphrase,
 * hashed with SHA-512 and upper-cased.
 */
async function digistoreSignature(params: Record<string, string>, passphrase: string) {
  const keys = Object.keys(params)
    .filter((key) => key.toLowerCase() !== "sha_sign")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  let payload = "";
  for (const key of keys) {
    const value = params[key];
    if (value === undefined || value === null || value === "") continue;
    payload += `${key}=${value}${passphrase}`;
  }

  const digest = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function purchaseEmail({
  amount,
  firstName,
  orderId,
  productName,
}: {
  amount: string;
  firstName: string;
  orderId: string;
  productName: string;
}) {
  const name = escapeHtml(firstName);
  return `
    <div style="margin:0;background:#f8fafc;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="padding:28px 24px;background:#010101;color:#ffffff;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#25F4EE;">Task Partners</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">Payment confirmed</h1>
        </div>
        <div style="padding:26px 24px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${name},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your payment for <strong>${escapeHtml(productName)}</strong> was approved and your account has been unlocked.</p>
          ${amount ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Amount: <strong>${escapeHtml(amount)}</strong></p>` : ""}
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">You can now open your dashboard and continue your payout review.</p>
          <a href="${DASHBOARD_URL}" style="display:block;text-align:center;background:#FE2C55;color:#ffffff;text-decoration:none;font-weight:800;border-radius:8px;padding:15px 18px;margin:24px 0;">
            Open My Dashboard
          </a>
          ${orderId ? `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#64748b;">Order reference: ${escapeHtml(orderId)}</p>` : ""}
          <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">This is an automated account notification from Task Partners Support.</p>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char] ?? char;
  });
}
