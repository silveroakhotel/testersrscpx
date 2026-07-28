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
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("debug") !== "1") {
          return Response.json({ ok: true });
        }

        return Response.json({
          geminiConfigured: Boolean(getGeminiApiKey()),
          model: getGeminiModel(),
          acceptedSecretNames: [
            "GEMINI_API_KEY",
            "GOOGLE_API_KEY",
            "GOOGLE_GENERATIVE_AI_API_KEY",
            "GENAI_API_KEY",
          ],
        });
      },
      POST: async ({ request }) => {
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
        const lastQuestion = messages[messages.length - 1]?.text ?? "";
        const apiKey = getGeminiApiKey();
        if (!apiKey) {
          console.error("[Gemini support] missing API key. Expected GEMINI_API_KEY.");
          return Response.json({ reply: buildFallbackReply(lastQuestion, firstName) });
        }

        const model = getGeminiModel();
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
            return Response.json({ reply: buildFallbackReply(lastQuestion, firstName) });
          }

          const reply = data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("")
            .trim();

          if (!reply) {
            return Response.json({ reply: buildFallbackReply(lastQuestion, firstName) });
          }

          return Response.json({ reply });
        } catch (error) {
          const reason = error instanceof Error ? error.name : "unknown";
          console.error("[Gemini support] unavailable", reason);
          return Response.json({ reply: buildFallbackReply(lastQuestion, firstName) });
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  },
});

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GENAI_API_KEY ||
    ""
  ).trim();
}

function getGeminiModel() {
  return (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").trim();
}

function buildSystemInstruction(firstName: string) {
  return `
You are Chloe from Task Partners Support. Present yourself naturally as support, not as "AI" or a bot unless the customer directly asks whether the chat is automated. Never claim or imply that you are a human employee.
Address the customer as ${firstName} only when it feels natural. Use concise, professional US English.

You can explain:
- Account access and profile navigation.
- The one-time six-video account activity check. It confirms that a person is operating the account; it does not generate earnings.
- The displayed account balance and general withdrawal verification workflow.
- The Wallet flow after the human check: payout method, account verification stages, compliance review, payout batch, and support follow-up.
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

function buildFallbackReply(question: string, firstName: string) {
  const text = question.toLowerCase();

  if (/(your name|who are you|what.*name|qual.*nome|como.*chama|quem.*voce|quem.*você|nome)/.test(text)) {
    return `My name is Chloe, ${firstName}. I am here with Task Partners Support to help with access, Wallet verification, refunds, and technical issues. Tell me what you need help with.`;
  }

  if (/(hello|hi|hey|oi|ola|olá|bom dia|boa tarde|boa noite)/.test(text)) {
    return `Hi ${firstName}, I am Chloe from Task Partners Support. Tell me which screen you are on and what you need help with.`;
  }

  if (/(wallet|withdraw|withdrawal|payout|cash out|balance|2800|2,800)/.test(text)) {
    return `${firstName}, open Wallet after completing the six-video human check. If the withdrawal request is already started, follow the current verification stage shown on screen and keep the same payout method updated. For account-specific status, contact ${SUPPORT_EMAIL}.`;
  }

  if (/(refund|charge|billing|payment|cancel|37|37.12)/.test(text)) {
    return `${firstName}, refund details are handled in the Refund tab. Once your payout details are confirmed, the processing status stays saved on your account. For a billing dispute or unrecognized charge, email ${SUPPORT_EMAIL} with your account email.`;
  }

  if (/(video|review|task|human|robot|bot|verification|audit)/.test(text)) {
    return `${firstName}, the six video reviews are a one-time human check. Watch each video until the end, complete the questions, and submit the review. After all six are complete, Wallet will show the next verification step.`;
  }

  if (/(document|identity|selfie|id|driver|passport|license|face|camera)/.test(text)) {
    return `${firstName}, identity steps should only be completed inside Wallet. Do not send documents, ID numbers, or selfies in chat. If a screen fails or a camera step does not work, email ${SUPPORT_EMAIL} with your account email and the screen name.`;
  }

  if (/(login|email|access|account|profile|sign in|name)/.test(text)) {
    return `${firstName}, use the same name and email you used for access. If your dashboard does not load or the wrong profile appears, email ${SUPPORT_EMAIL} with your account email only. Do not send passwords or verification codes.`;
  }

  return `${firstName}, I can help with access, the six-video check, Wallet verification, refunds, and technical issues. Tell me which screen you are on and what you clicked, without sending passwords, card details, bank credentials, or identity documents.`;
}
