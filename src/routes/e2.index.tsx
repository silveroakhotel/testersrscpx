import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/e2/")({
  head: () => ({
    meta: [
      { title: "TikTok Rewards" },
      { name: "description", content: "Claim your TikTok reward and get paid instantly." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: E2Entry,
});

function E2Entry() {
  useEffect(() => {
    window.location.replace(`/e2/inicio${window.location.search}${window.location.hash}`);
  }, []);

  return null;
}
