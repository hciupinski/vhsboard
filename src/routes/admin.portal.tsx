import { createFileRoute, Link } from "@tanstack/react-router";

import { Brand } from "@/components/Brand";
import { AdminGuard, AdminSignOutButton } from "@/components/admin/AdminGuard";
import { PortalCarouselManager } from "@/components/admin/PortalCarouselManager";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/portal")({
  head: () => ({
    meta: [{ title: "Portal — CMS VHSBOARD" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: () => (
    <AdminGuard>
      <PortalPage />
    </AdminGuard>
  ),
});

function PortalPage() {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Brand />
            </Link>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              CMS portalu
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to="/admin">Oferty</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to="/admin/dokumenty">Dokumenty</Link>
            </Button>
            <AdminSignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="font-display text-4xl tracking-wide">Karuzela strony głównej</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Wybierz zdjęcia widoczne w karuzeli na stronie głównej i ustaw ich kolejność.
        </p>
        <div className="mt-8">
          <PortalCarouselManager />
        </div>
      </main>
    </div>
  );
}
