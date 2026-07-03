import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/back-redirect")({
  component: BackRedirect,
});

function BackRedirect() {
  // The cloned app renders the actual back-redirect offer screen into #cloned-root.
  // This TanStack route must stay mounted and do nothing so that screen is not replaced by a blank redirect.
  return null;
}
