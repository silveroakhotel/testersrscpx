import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/back-redirect")({
  component: CloneRoute,
});

function CloneRoute() {
  return null;
}
