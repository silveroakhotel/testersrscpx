import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/e2/back-redirect")({
  component: CloneRoute,
});

function CloneRoute() {
  return null;
}
