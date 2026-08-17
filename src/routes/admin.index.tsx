import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, ExternalLink, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/Brand";
import { AdminGuard, AdminSignOutButton } from "@/components/admin/AdminGuard";
import { deleteOffer, loadOffers, type OfferDraft } from "@/lib/adminStore";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "CMS ofert — panel VHSBOARD" },
      {
        name: "description",
        content: "Twórz i edytuj oferty wyjazdów VHSBOARD: opis, cena, co w cenie i galeria.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "CMS ofert — panel VHSBOARD" },
      { property: "og:description", content: "Twórz i edytuj oferty wyjazdów VHSBOARD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminList,
});

function AdminList() {
  return (
    <AdminGuard>
      <AdminListContent />
    </AdminGuard>
  );
}

function AdminListContent() {
  const [offers, setOffers] = useState<OfferDraft[]>([]);

  useEffect(() => setOffers(loadOffers()), []);

  const remove = (slug: string) => {
    deleteOffer(slug);
    setOffers(loadOffers());
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Brand />
            </Link>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-secondary-foreground">
              CMS ofert
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AdminSignOutButton />
            <Button asChild size="sm" className="rounded-full">
              <Link to="/admin/$slug" params={{ slug: "new" }}>
                <Plus className="mr-1 size-4" /> Nowa oferta
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="font-display text-4xl tracking-wide">Twoje oferty</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Każda oferta to jeden wpis: opis, cena, co jest i czego nie ma w cenie, plan dzień po dniu
          i zdjęcia z poprzednich wyjazdów.
        </p>

        <div className="mt-8 space-y-3">
          {offers.map((o) => (
            <article
              key={o.slug}
              className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background p-4 sm:flex-row sm:items-center"
            >
              <div className="h-24 w-full overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-32">
                {o.image ? (
                  <img src={o.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Compass className="size-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl tracking-wide">
                    {o.title || "Oferta bez tytułu"}
                  </h2>
                  <Badge variant={o.status === "published" ? "default" : "secondary"}>
                    {o.status === "published" ? "opublikowana" : "szkic"}
                  </Badge>
                  <Badge variant="outline">{o.tag}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {o.place} · {o.days} · {o.price}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Zaktualizowano {o.updatedAt} · /trips/{o.slug}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to="/trips/$slug" params={{ slug: o.slug }}>
                    <ExternalLink className="mr-1 size-4" /> Podgląd
                  </Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/admin/$slug" params={{ slug: o.slug }}>
                    <Pencil className="mr-1 size-4" /> Edytuj
                  </Link>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Usuń ${o.title}`}
                  className="rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => remove(o.slug)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </article>
          ))}
          {offers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nie ma jeszcze ofert. Zacznij od nowej.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
