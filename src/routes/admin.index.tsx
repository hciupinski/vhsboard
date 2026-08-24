import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, ExternalLink, Pencil, Plus } from "lucide-react";
import { Brand } from "@/components/Brand";
import { AdminGuard, AdminSignOutButton } from "@/components/admin/AdminGuard";
import { DeleteOfferDialog } from "@/components/admin/DeleteOfferDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OfferActivity, OfferStatus } from "@/lib/offers/types";

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

const activityLabels: Record<OfferActivity, string> = {
  surf: "Surf",
  snow: "Snowboard",
  combo: "Surf + snowboard",
};

const statusLabels: Record<OfferStatus, string> = {
  draft: "Szkic",
  published: "Opublikowana",
  archived: "Zarchiwizowana",
};

const updatedAtFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
});

const listAdminOffers = async () => {
  const repository = await import("@/lib/offers/admin-repository");
  return repository.listAdminOffers();
};

const resolveAdminImageUrls = async (paths: string[]) => {
  const repository = await import("@/lib/offers/admin-repository");
  return repository.resolveAdminImageUrls(paths);
};

const archiveOffer = async (id: string) => {
  const repository = await import("@/lib/offers/admin-repository");
  return repository.archiveOffer(id);
};

function AdminListContent() {
  const queryClient = useQueryClient();
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const {
    data: offers = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: listAdminOffers,
  });
  const heroImagePaths = useMemo(
    () => offers.flatMap(({ heroImagePath }) => (heroImagePath ? [heroImagePath] : [])),
    [offers],
  );
  const { data: signedImageUrls = new Map<string, string>() } = useQuery({
    queryKey: ["admin-offer-images", ...heroImagePaths],
    queryFn: () => resolveAdminImageUrls(heroImagePaths),
    enabled: heroImagePaths.length > 0,
  });
  const archiveMutation = useMutation({
    mutationFn: ({ id }: { id: string; slug: string }) => archiveOffer(id),
    onSuccess: async (_, { slug }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-offers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-offer", slug] }),
        queryClient.invalidateQueries({ queryKey: ["published-offers"] }),
        queryClient.invalidateQueries({ queryKey: ["published-offer", slug] }),
      ]);
    },
  });

  const handleArchive = async (id: string, slug: string) => {
    setArchiveError(null);
    try {
      await archiveMutation.mutateAsync({ id, slug });
    } catch {
      setArchiveError("Nie udało się zarchiwizować oferty. Spróbuj ponownie.");
    }
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
          {archiveError ? (
            <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              {archiveError}
            </p>
          ) : null}
          {isPending ? (
            <p
              role="status"
              className="rounded-2xl border border-border p-10 text-center text-sm text-muted-foreground"
            >
              Ładowanie ofert…
            </p>
          ) : null}
          {isError ? (
            <div
              role="alert"
              className="rounded-2xl border border-border bg-background p-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                Nie udało się pobrać ofert. Spróbuj ponownie.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => void refetch()}
              >
                Spróbuj ponownie
              </Button>
            </div>
          ) : null}
          {offers.map((o) => (
            <article
              key={o.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background p-4 sm:flex-row sm:items-center"
            >
              <div className="h-24 w-full overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-32">
                {o.heroImagePath && signedImageUrls.get(o.heroImagePath) ? (
                  <img
                    src={signedImageUrls.get(o.heroImagePath)}
                    alt={`Zdjęcie główne: ${o.title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={`Brak zdjęcia głównego: ${o.title}`}
                    className="flex h-full items-center justify-center text-muted-foreground"
                  >
                    <Compass className="size-5" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl tracking-wide">
                    {o.title || "Oferta bez tytułu"}
                  </h2>
                  <Badge variant={o.status === "published" ? "default" : "secondary"}>
                    {statusLabels[o.status]}
                  </Badge>
                  <Badge variant="outline">{activityLabels[o.activity]}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{o.location}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Zaktualizowano{" "}
                  <time dateTime={o.updatedAt}>
                    {updatedAtFormatter.format(new Date(o.updatedAt))}
                  </time>
                  {" · "}/wyjazdy/{o.slug}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {o.status === "published" ? (
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link to="/wyjazdy/$slug" params={{ slug: o.slug }}>
                      <ExternalLink className="mr-1 size-4" /> Podgląd
                    </Link>
                  </Button>
                ) : null}
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/admin/$slug" params={{ slug: o.slug }}>
                    <Pencil className="mr-1 size-4" /> Edytuj
                  </Link>
                </Button>
                {o.status !== "archived" ? (
                  <DeleteOfferDialog
                    offerTitle={o.title}
                    isArchiving={
                      archiveMutation.isPending && archiveMutation.variables?.id === o.id
                    }
                    onConfirm={() => handleArchive(o.id, o.slug)}
                  />
                ) : null}
              </div>
            </article>
          ))}
          {!isPending && !isError && offers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nie ma jeszcze ofert. Zacznij od nowej.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
