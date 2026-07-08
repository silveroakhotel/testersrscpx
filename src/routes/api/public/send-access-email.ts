import { createFileRoute } from "@tanstack/react-router";

type AccessEmailBody = {
  email?: string;
  name?: string;
};

const FROM = "Task Partners Support <support@taskpartners.live>";
const SUBJECT = "Your premium access is live! 🎉";

export const Route = createFileRoute("/api/public/send-access-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "resend_not_configured" }, { status: 500 });
        }

        let body: AccessEmailBody;
        try {
          body = (await request.json()) as AccessEmailBody;
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const email = (body.email ?? "").trim().toLowerCase();
        const firstName = (body.name ?? "").trim().split(/\s+/)[0] || "there";

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return Response.json({ error: "invalid_email" }, { status: 400 });
        }

        const html = accessEmailHtml(firstName);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM,
            to: [email],
            subject: SUBJECT,
            html,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
        if (!res.ok) {
          console.error("[Resend] send failed", res.status, data?.message ?? "");
          return Response.json({ error: "email_send_failed" }, { status: 502 });
        }

        return Response.json({ ok: true, id: data.id ?? null });
      },
    },
  },
});

function accessEmailHtml(firstName: string) {
  return `
    <div style="margin:0;background:#f8fafc;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="padding:28px 24px;background:#0f172a;color:#ffffff;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#25f4ee;">Task Partners</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">Your premium access is live!</h1>
        </div>
        <div style="padding:26px 24px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${escapeHtml(firstName)},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
            Your Task Partners reviewer account has been activated. You can now access your dashboard, complete creator audits, manage payout details, and track your account status.
          </p>
          <a href="https://taskpartners.live/tasks-app" style="display:block;text-align:center;background:#fe2c55;color:#ffffff;text-decoration:none;font-weight:800;border-radius:8px;padding:15px 18px;margin:24px 0;">
            Open My Dashboard
          </a>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
            If you have questions about access, refunds, or payout details, open the Support tab inside your dashboard.
          </p>
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
