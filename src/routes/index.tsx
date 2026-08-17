import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TikTok Recompensas" },
      {
        name: "description",
        content: "Resgate sua recompensa TikTok e receba por Pix, PayPal, Venmo, transferência ou banco.",
      },
      { property: "og:title", content: "TikTok Recompensas" },
      {
        property: "og:description",
        content: "Resgate sua recompensa TikTok e receba por Pix, PayPal, Venmo, transferência ou banco.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return null;
}
