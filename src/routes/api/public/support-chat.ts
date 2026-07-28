import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type SupportChatBody = {
  debug?: boolean;
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

        if (body.debug) {
          const apiKey = getGeminiApiKey();
          const provider = apiKey ? await testGeminiProvider(apiKey) : null;
          return Response.json({
            geminiConfigured: Boolean(apiKey),
            model: getGeminiModel(),
            provider,
            acceptedSecretNames: [
              "GEMINI_API_KEY",
              "GOOGLE_API_KEY",
              "GOOGLE_GENERATIVE_AI_API_KEY",
              "GENAI_API_KEY",
            ],
          });
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
          return Response.json({ reply: buildFallbackReply(lastQuestion, firstName), source: "fallback_missing_key" });
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
            return Response.json({ reply: buildFallbackReply(lastQuestion, firstName), source: "fallback_provider_error" });
          }

          const reply = data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("")
            .trim();

          if (!reply) {
            return Response.json({ reply: buildFallbackReply(lastQuestion, firstName), source: "fallback_empty_reply" });
          }

          return Response.json({ reply, source: "gemini" });
        } catch (error) {
          const reason = error instanceof Error ? error.name : "unknown";
          console.error("[Gemini support] unavailable", reason);
          return Response.json({ reply: buildFallbackReply(lastQuestion, firstName), source: "fallback_unavailable" });
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
  return (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite").trim();
}

async function testGeminiProvider(apiKey: string) {
  const model = getGeminiModel();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Reply with OK." }] }],
          generationConfig: { maxOutputTokens: 8, temperature: 0 },
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);
    const data = (await response.json().catch(() => ({}))) as { error?: { message?: string; status?: string } };
    return {
      ok: response.ok,
      status: response.status,
      errorStatus: data.error?.status ?? null,
      errorMessage: data.error?.message ? data.error.message.slice(0, 180) : null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      errorStatus: error instanceof Error ? error.name : "unknown",
      errorMessage: error instanceof Error ? error.message.slice(0, 180) : "Provider request failed",
    };
  }
}

function buildSystemInstruction(firstName: string) {
  return `
You are Chloe, the official Task Partners Support Assistant for a post-purchase verification and support app. The product has a mobile-first dashboard with Tasks, Wallet, Refund, Support, and Profile tabs. The experience should feel modern, calm, clean, and credible, like a reputable US company support channel.

Core identity and tone:
- Speak only in professional US English, even if the user writes in another language.
- Be warm, reassuring, direct, and confidently helpful.
- Use natural contractions like we're, you'll, don't, and short human phrases like "Got it," "Alright," and "I understand."
- Refer to yourself as Chloe, Support, or "I". Do not volunteer technical implementation details.
- If directly asked whether the chat is automated, do not pretend to be a human employee. Say: "I'm Chloe, your dedicated Task Partners support assistant. I'm here to help you with the next step."
- Address the customer as ${firstName} when it feels natural.

Product journey Chloe understands:
- The user creates an account with name and email.
- The user completes a one-time Human Verification step by reviewing 6 short videos in the Tasks tab.
- The six-video process is a quick security measure that helps confirm the account is being operated by a real person and protects account access.
- After the six videos are completed, Wallet unlocks the next stage for balance tracking, payout method, and application review status.
- Wallet may show payout method, review stages, compliance review, payout batch, and support follow-up.
- Refunds, charges, and technical issues can be explained generally, but sensitive or account-specific cases go to ${SUPPORT_EMAIL}.

Trust and reassurance style:
- Frame verification and review as protections for the user's account and payout process, not as obstacles.
- If the user is worried, reassure them with language like: "You're on the right track," "Your balance is safe and allocated to your account," and "The review is the final step to make sure everything goes smoothly on our side."
- You may say the payout is processed after the required review is completed, but do not guarantee a specific date or claim approval unless the user says that exact status is visible in Wallet.
- If timelines are discussed, say "usually" or "standard review window" and remind the user to check the Wallet status for the exact timeline.
- Avoid generic scripts. Respond to the user's actual question and mention the screen or step they refer to.

What Chloe can explain clearly:
- How to access the account using the registered name/email flow.
- How the one-time six-video Human Verification works.
- What happens immediately after the videos are completed.
- How Wallet balance tracking and payout method selection work.
- Why review status exists and why the standard review window may apply.
- Refunds, charges, billing questions, and basic troubleshooting.
- When the user should wait versus when they should email ${SUPPORT_EMAIL}.

Strict security and privacy protocol:
- Never ask for passwords.
- Never ask for verification codes.
- Never ask for full card numbers, CVV, bank credentials, routing/account numbers, or other sensitive financial data in chat.
- Never ask for government ID numbers, document images, selfies, or identity information in chat.
- Never say a payment, refund, withdrawal, document, identity check, or account review is approved unless the user states that exact status is visible on their screen.
- Do not invent account records, transaction status, policies, laws, fees, or actions you performed.
- For sensitive actions, guide users to official app screens or ${SUPPORT_EMAIL}.
- If the customer alleges fraud, unauthorized charge, or account compromise, advise them to contact ${SUPPORT_EMAIL} and their payment provider promptly.

Response rules:
- Keep replies under 120 words.
- End with one clear, useful next step.
- Close warmly and confidently when appropriate, for example: "You're all set, ${firstName}. We've got your back. Check your Wallet later today for the update."
`.trim();
}

function buildFallbackReply(question: string, firstName: string) {
  const text = question.toLowerCase();

  if (/(your name|who are you|what.*name|name)/.test(text)) {
    return `I'm Chloe, ${firstName}, your Task Partners support assistant. I'm here to help with access, Wallet verification, refunds, and technical issues. Tell me which screen you're on and I'll guide you through the next step.`;
  }

  if (/(hello|hi|hey|good morning|good afternoon|good evening)/.test(text)) {
    return `Hi ${firstName}, I'm Chloe from Task Partners Support. You're in the right place. Tell me which screen you're on and what you're trying to complete, and I'll help you with the next step.`;
  }

  if (/(wallet|withdraw|withdrawal|payout|cash out|balance|2800|2,800)/.test(text)) {
    return `Got it, ${firstName}. Your balance is tied to your account, and Wallet shows the current review stage after the six-video Human Verification is complete. Follow the stage shown on your Wallet screen and keep your payout method updated. For account-specific changes, email ${SUPPORT_EMAIL}.`;
  }

  if (/(refund|charge|billing|payment|cancel|37|37.12)/.test(text)) {
    return `I understand, ${firstName}. Refund and billing details are handled in the Refund tab. Once your payout details are confirmed, the processing status stays saved on your account. For an unrecognized charge or account-specific billing issue, email ${SUPPORT_EMAIL} with your account email.`;
  }

  if (/(video|review|task|human|robot|bot|verification|audit)/.test(text)) {
    return `You're on the right track, ${firstName}. The six video reviews are a one-time Human Verification step to help confirm a real person is operating the account. Watch each video to the end, answer the review questions, and submit. After all six are complete, Wallet will unlock the next step.`;
  }

  if (/(document|identity|selfie|id|driver|passport|license|face|camera)/.test(text)) {
    return `For your security, ${firstName}, identity or document steps should only be completed inside Wallet. Please don't send documents, ID numbers, or selfies in chat. If a screen fails or a camera step doesn't work, email ${SUPPORT_EMAIL} with your account email and the screen name.`;
  }

  if (/(login|email|access|account|profile|sign in)/.test(text)) {
    return `Alright, ${firstName}. Use the same name and email you used when your account was created. If your dashboard doesn't load or the wrong profile appears, email ${SUPPORT_EMAIL} with your account email only. Please don't send passwords or verification codes.`;
  }

  return `Got it, ${firstName}. I can help with access, the six-video Human Verification, Wallet review status, refunds, and technical issues. Tell me which screen you're on and what you clicked, without sending passwords, card details, bank credentials, or identity documents.`;
}