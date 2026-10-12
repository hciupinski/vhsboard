import { createFileRoute } from "@tanstack/react-router";
import { createPageMetadata } from "@/lib/seo";

// TanStack Start needs a real route to render the SPA fallback during the
// build. Its output is written as /_shell/app.html, not as a public page.
export const Route = createFileRoute("/spa-shell")({
  head: () => {
    const metadata = createPageMetadata({
      path: "/",
      title: "Wyjazdy i obozy | VHSBOARD",
      description: "Odkryj wyjazdy surfingowe, snowboardowe i aktywne obozy VHSBOARD.",
    });
    return {
      meta: metadata.meta.filter((meta) => !("property" in meta && meta.property === "og:url")),
    };
  },
  component: () => null,
});
