import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type SupportChatBody = {
  messages?: ChatMessage[];
  firstName?: string;
};

const SUPPORT_EMAIL = "support@taskpartners.live";
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1200;

export const Route = createFileRoute("/api/public/support-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "gemini_not_configured" }, { status: 503 });
        }

        let body: SupportChatBody;
        try {
          body = (await request.json()) as SupportChatBody;
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const messages = (body.messages ?? [])
          .slice(-MAX_MESSAGES)
          .map((message) => ({
            role: message.role,
            text: String(message.text ?? "").trim().slice(0, MAX_MESSAGE_LENGTH),
          }))
          .filter((message) => message.text);

        if (!messages.length || messages[messages.length - 1]?.role !== "user") {
          return Response.json({ error: "invalid_messages" }, { status: 400 });
        }

        const firstName = String(body.firstName ?? "customer")
          .replace(/[^\p{L}\p{N} '\-]/gu, "")
          .trim()
          .slice(0, 50) || "customer";
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20_000);

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
              },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [
                    {
                      text: buildSystemInstruction(firstName),
                    },
                  ],
                },
                contents: messages.map((message) => ({
                  role: message.role === "assistant" ? "model" : "user",
                  parts: [{ text: message.text }],
                })),
                generationConfig: {
                  maxOutputTokens: 260,
                  temperature: 0.25,
                },
              }),
              signal: controller.signal,
            },
          );

          const data = (await response.json().catch(() => ({}))) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            error?: { message?: string };
          };

          if (!response.ok) {
            console.error("[Gemini support] request failed", response.status, data.error?.message ?? "");
            return Response.json({ error: "support_provider_error" }, { status: 502 });
          }

          const reply = data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("")
            .trim();

          if (!reply) {
            return Response.json({ error: "empty_support_reply" }, { status: 502 });
          }

          return Response.json({ reply });
        } catch (error) {
          const reason = error instanceof Error ? error.name : "unknown";
          console.error("[Gemini support] unavailable", reason);
          return Response.json({ error: "support_unavailable" }, { status: 503 });
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  },
});

function buildSystemInstruction(firstName: string) {
  return `
You are Chloe, the Task Partners virtual support assistant. Never claim or imply that you are human.
Address the customer as ${firstName} only when it feels natural. Use concise, professional US English.

You can explain:
- Account access and profile navigation.
- The one-time six-video account activity check. It confirms that a person is operating the account; it does not generate earnings.
- The displayed account balance and general withdrawal verification workflow.
- Payout details, refunds, technical issues, and how to contact support.

Safety and accuracy rules:
- Never request passwords, one-time codes, full card numbers, CVV, bank credentials, routing/account numbers, government ID numbers, document images, or selfies in chat.
- Never say a payment, refund, withdrawal, document, or identity check is approved unless that exact status appears in the user's message.
- Never guarantee a payout date or financial outcome.
- Do not invent account records, transaction status, policies, laws, fees, or actions you performed.
- For account-specific status, billing, refunds, identity documents, or payout disputes, explain that a human support specialist must review it and direct the customer to ${SUPPORT_EMAIL}.
- If the customer alleges fraud, an unauthorized charge, or account compromise, advise them to contact ${SUPPORT_EMAIL} and their payment provider promptly.
- Keep replies under 120 words and end with one useful next step.
`.trim();
}
