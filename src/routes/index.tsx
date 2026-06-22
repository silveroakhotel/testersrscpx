import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recompensa TikTok" },
      { name: "description", content: "Resgate sua recompensa TikTok com pagamento via Pix instantâneo." },
      { property: "og:title", content: "Recompensa TikTok" },
      { property: "og:description", content: "Resgate sua recompensa TikTok com pagamento via Pix instantâneo." },
    ],
  }),
  component: Index,
});

function Index() {
  return null;
}
