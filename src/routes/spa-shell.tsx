import { createFileRoute } from "@tanstack/react-router";
import { getRobotsContent } from "@/lib/seo";

// TanStack Start needs a real route to render the SPA fallback during the
// build. Its output is written as /_shell/app.html, not as a public page.
export const Route = createFileRoute("/spa-shell")({
  head: () => ({ meta: [{ name: "robots", content: getRobotsContent() }] }),
  component: () => null,
});
