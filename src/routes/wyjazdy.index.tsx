import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { OfferListState } from "@/components/offers/OfferListState";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { publishedOffersQueryOptions } from "@/lib/offers/query-options";

export const Route = createFileRoute("/wyjazdy/")({
  head: () => ({
    meta: [
      { title: "Wyjazdy | VHSBOARD" },
      {
        name: "description",
        content: "Aktualne wyjazdy organizowane przez VHSBOARD.",
      },
    ],
  }),
  component: TripsPage,
});

function TripsPage() {
  const {
    data: offers = [],
    isPending,
    isError,
    refetch,
  } = useQuery(publishedOffersQueryOptions());

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="bg-secondary/55 py-16 sm:py-24">
        <section className="mx-auto max-w-6xl px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Wyjazdy</p>
          <h1 className="mt-3 text-5xl leading-[0.95] sm:text-7xl">Wyjazdy</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Zobacz aktualne kierunki i szczegóły wyjazdów organizowanych przez VHSBOARD.
          </p>
          <OfferListState
            offers={offers}
            isPending={isPending}
            isError={isError}
            onRetry={() => void refetch()}
          />
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
