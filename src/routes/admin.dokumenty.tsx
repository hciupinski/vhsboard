import { createFileRoute, Link } from "@tanstack/react-router";

import { Brand } from "@/components/Brand";
import { AdminGuard, AdminSignOutButton } from "@/components/admin/AdminGuard";
import { ContactDocumentManager } from "@/components/admin/ContactDocumentManager";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/dokumenty")({
  head: () => ({
    meta: [{ title: "Dokumenty — CMS VHSBOARD" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: () => (
    <AdminGuard>
      <DocumentPage />
    </AdminGuard>
  ),
});

function DocumentPage() {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Brand />
            </Link>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              CMS dokumentów
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to="/admin">Oferty</Link>
            </Button>
            <AdminSignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="font-display text-4xl tracking-wide">Dokumenty do pobrania</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dodaj regulaminy i informacje w formacie PDF. Linki pojawią się na stronie kontaktowej.
        </p>
        <ContactDocumentManager />
      </main>
    </div>
  );
}
