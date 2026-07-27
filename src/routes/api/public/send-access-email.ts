import { createFileRoute } from "@tanstack/react-router";

type EmailTemplate =
  | "access"
  | "email_3"
  | "email_6"
  | "email_consistency"
  | "email_42"
  | "withdrawal_requested"
  | "withdrawal_verification"
  | "withdrawal_compliance"
  | "withdrawal_batch"
  | "withdrawal_scheduled";

type AccessEmailBody = {
  amount?: number;
  balance?: number;
  count?: number;
  email?: string;
  name?: string;
  reference?: string;
  template?: EmailTemplate;
};

const FROM = "Task Partners Support <support@taskpartners.live>";
const DASHBOARD_URL = "https://taskpartners.live/tasks-app?utm_source=tiktok";

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

        const template = buildEmailTemplate({
          amount: Number(body.amount ?? 0),
          balance: Number(body.balance ?? 0),
          count: Number(body.count ?? 0),
          firstName,
          reference: (body.reference ?? "").trim(),
          template: body.template ?? "access",
        });

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM,
            html: template.html,
            subject: template.subject,
            to: [email],
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

function buildEmailTemplate(props: { amount?: number; balance: number; count: number; firstName: string; reference?: string; template: EmailTemplate }) {
  const firstName = escapeHtml(props.firstName);
  const balance = usd(props.balance || 0);
  const amount = usd(props.amount || props.balance || 0);
  const reference = escapeHtml(props.reference || "");
  const refLine = reference
    ? `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#64748b;">Withdrawal reference: <strong style="color:#0f172a;">${reference}</strong></p>`
    : "";

  if (props.template === "withdrawal_requested") {
    return {
      subject: `Withdrawal request received — ${amount}`,
      html: emailShell({
        body: `
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">We received your withdrawal request of <strong>${amount}</strong>. Your request has entered the standard payout review pipeline used for high-value creator partner payouts.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Current stage: <strong style="color:#0f172a;">Additional Verification</strong>. Open your dashboard to complete the pending verification items so your payout keeps moving through the pipeline.</p>
          ${refLine}
        `,
        title: "Withdrawal request received",
      }),
    };
  }

  if (props.template === "withdrawal_verification") {
    return {
      subject: "Action required: Additional Verification",
      html: emailShell({
        body: `
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your withdrawal of <strong>${amount}</strong> requires <strong>Additional Verification</strong> before it can be released. This step normally takes 3-5 business days.</p>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#475569;">Pending items on your account:</p>
          <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.7;color:#475569;">
            <li>Proof of address (utility bill or bank statement)</li>
            <li>ACH micro-deposit confirmation</li>
            <li>Re-confirmation of your payout details</li>
          </ul>
          ${refLine}
        `,
        title: "Additional Verification",
      }),
    };
  }

  if (props.template === "withdrawal_compliance") {
    return {
      subject: "Your account is under enhanced review",
      html: emailShell({
        body: `
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Verification is complete. Because of the withdrawal amount of <strong>${amount}</strong>, your account is now under <strong>Enhanced Due Diligence (compliance review)</strong>. This stage normally takes 5-7 business days.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">To keep the review on schedule, confirm your source of funds and income declaration inside your dashboard. No further action is required after that; our compliance team completes the review automatically.</p>
          ${refLine}
        `,
        title: "Compliance review in progress",
      }),
    };
  }

  if (props.template === "withdrawal_batch") {
    return {
      subject: "Withdrawal approved — added to the next payout batch",
      html: emailShell({
        body: `
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Good news: compliance review is complete and your withdrawal of <strong>${amount}</strong> has been <strong>approved</strong>.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Payouts are released in scheduled batches. Your withdrawal is now in the next payout batch and will be transmitted to your payout provider within 5-7 business days. You can follow the batch countdown in your dashboard.</p>
          ${refLine}
        `,
        title: "Approved — next payout batch",
      }),
    };
  }

  if (props.template === "withdrawal_scheduled") {
    return {
      subject: "Your payout has been released",
      html: emailShell({
        body: `
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your payout batch has been transmitted and your withdrawal of <strong>${amount}</strong> has been released to your selected payout method.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Depending on your provider, the credit posts to your account within 1-3 business days. Current account balance on record: <strong>${balance}</strong>.</p>
          ${refLine}
        `,
        title: "Payout released",
      }),
    };
  }


  if (props.template === "email_3") {
    return {
      subject: "Activity Sync Detected",
      html: emailShell({
        body: `
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Our system detected your first activity sync after 3 completed creator audits. This confirms that your reviewer profile is active and progressing through the verification cycle.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Your account activity has been synchronized successfully. Available balance status: <strong>${balance}</strong> toward the $4,000.00 withdrawal threshold.</p>
        `,
        title: "Activity Sync Detected",
      }),
    };
  }

  if (props.template === "email_6") {
    return {
      subject: "Daily Quota Completed",
      html: emailShell({
        body: `
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your first daily audit quota has been completed successfully. This helps maintain account quality, review accuracy, and secure payout eligibility.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Today&apos;s account activity has been recorded. Please return on the next cycle to continue releasing your pending balance.</p>
        `,
        title: "Daily Quota Completed",
      }),
    };
  }

  if (props.template === "email_consistency") {
    return {
      subject: "Excellent Consistency",
      html: emailShell({
        body: `
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Excellent consistency. Your account has reached another verified audit milestone, and your activity pattern remains aligned with creator partner review requirements.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Your reviewer profile remains in good standing. Continue the available daily audit cycle to keep releasing pending balance toward the $4,000.00 threshold.</p>
        `,
        title: "Excellent Consistency",
      }),
    };
  }

  if (props.template === "email_42") {
    return {
      subject: "Verification Milestone Achieved",
      html: emailShell({
        body: `
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your verification milestone has been completed. This indicates that the required creator audit activity has been recorded on your reviewer profile.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Please open your dashboard to review the current withdrawal status and confirm your payout details.</p>
        `,
        title: "Verification Milestone Achieved",
      }),
    };
  }

  return {
    subject: "Your premium access is live! 🎉",
    html: emailShell({
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your Task Partners reviewer account has been activated. You can now access your dashboard, complete creator audits, manage payout details, and track your account status.</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">If you have questions about access, refunds, or payout details, open the Support tab inside your dashboard.</p>
      `,
      title: "Your premium access is live!",
    }),
  };
}

function emailShell({ body, title }: { body: string; title: string }) {
  return `
    <div style="margin:0;background:#f8fafc;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="padding:28px 24px;background:#010101;color:#ffffff;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#25F4EE;">Task Partners</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:26px 24px;">
          ${body}
          <a href="${DASHBOARD_URL}" style="display:block;text-align:center;background:#FE2C55;color:#ffffff;text-decoration:none;font-weight:800;border-radius:8px;padding:15px 18px;margin:24px 0;">
            Open My Dashboard
          </a>
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

function usd(value: number) {
  return value.toLocaleString("en-US", { currency: "USD", style: "currency" });
}
