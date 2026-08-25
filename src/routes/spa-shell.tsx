import { createFileRoute } from "@tanstack/react-router";

// TanStack Start needs a real route to render the SPA fallback during the
// build. Its output is written as /_shell.html, not as a public page.
export const Route = createFileRoute("/spa-shell")({
  component: () => null,
});
