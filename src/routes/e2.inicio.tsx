import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/e2/inicio")({
  component: CloneRoute,
});

function CloneRoute() {
  return null;
}
