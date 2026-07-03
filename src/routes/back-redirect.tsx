import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/back-redirect")({
  component: BackRedirect,
});

function BackRedirect() {
  useEffect(() => {
    if (window.history.length > 1) {
      window.history.back();
      // Fallback: if nothing happens shortly (blank page), go home
      setTimeout(() => {
        if (window.location.pathname === "/back-redirect") {
          window.location.replace("/");
        }
      }, 300);
    } else {
      window.location.replace("/");
    }
  }, []);
  return null;
}
