import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { OfferListState } from "@/components/offers/OfferListState";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { publishedOffersQueryOptions } from "@/lib/offers/query-options";
import type { TripOffer } from "@/lib/offers/types";
import { createPageMetadata } from "@/lib/seo";

export const Route = createFileRoute("/wyjazdy/")({
  head: () =>
    createPageMetadata({
      path: "/wyjazdy",
      title: "Wyjazdy | VHSBOARD",
      description: "Aktualne wyjazdy organizowane przez VHSBOARD.",
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
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <PublicJsonLd path="/wyjazdy" label="Wyjazdy" />
      <main className="flex-1 bg-secondary/55 py-16 sm:py-24">
        <section className="mx-auto max-w-6xl px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Wyjazdy</p>
          <h1 className="mt-3 text-5xl leading-[0.95] sm:text-7xl">
            WYJAZDY, DO KTÓRYCH CHCE SIĘ WRACAĆ
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Kameralne grupy, dobra ekipa i dużo czasu na desce. Organizujemy wyjazdy snowboardowe i
            surfingowe z myślą o progresie, wspólnych zajawkach i relacjach, które zostają na
            dłużej.
          </p>
          <h2 className="mt-12 text-3xl leading-none sm:text-4xl">AKTUALNE KIERUNKI</h2>
          <OfferListState
            offers={offers.filter((offer): offer is TripOffer => offer.offerKind === "trip")}
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
