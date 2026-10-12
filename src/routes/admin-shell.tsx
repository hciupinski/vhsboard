import { createFileRoute } from "@tanstack/react-router";
import { getRobotsContent } from "@/lib/seo";

// Empty build target; never prefetch a session or privileged CMS data.
export const Route = createFileRoute("/admin-shell")({
  head: () => ({ meta: [{ name: "robots", content: getRobotsContent(false) }] }),
  component: () => null,
});
