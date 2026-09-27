import { Link } from "@tanstack/react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { selectUpcomingHomeOffers } from "@/lib/offers/home-offers";
import type { PublicOffer } from "@/lib/offers/types";

import { HomeOfferCard } from "./HomeOfferCard";

type HomeUpcomingOffersSectionProps = {
  offers: PublicOffer[];
  isPending: boolean;
  isError: boolean;
  today: string;
};

function CategoryLinks() {
  return (
    <div className="mt-6 flex flex-wrap gap-4">
      <Link
        to="/wyjazdy"
        className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Zobacz wyjazdy
      </Link>
      <Link
        to="/obozy"
        className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Zobacz obozy
      </Link>
    </div>
  );
}

export function HomeUpcomingOffersSection({
  offers,
  isPending,
  isError,
  today,
}: HomeUpcomingOffersSectionProps) {
  const upcomingOffers = selectUpcomingHomeOffers(offers, today);

  return (
    <section className="bg-secondary/55 py-12 sm:py-14" aria-labelledby="home-upcoming-heading">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Wyjazdy i obozy
        </p>
        <h2 id="home-upcoming-heading" className="mt-3 text-4xl leading-[0.95] sm:text-6xl">
          NAJBLIŻSZE NA RADARZE
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Sprawdź, co szykujemy najbliżej — na wodzie, śniegu i w dobrym towarzystwie.
        </p>

        {isPending ? (
          <div
            className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            aria-label="Ładowanie ofert"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                data-testid="home-offer-skeleton"
                aria-hidden="true"
                className="overflow-hidden rounded-3xl border border-border bg-card p-6"
              >
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="mt-6 h-5 w-2/5" />
                <Skeleton className="mt-3 h-8 w-4/5" />
                <Skeleton className="mt-6 h-5 w-full" />
              </div>
            ))}
          </div>
        ) : null}

        {!isPending && isError ? (
          <div className="mt-8 max-w-2xl" role="alert">
            <p className="text-lg leading-relaxed text-muted-foreground">
              Nie udało się pobrać najbliższych ofert.
            </p>
            <CategoryLinks />
          </div>
        ) : null}

        {!isPending && !isError && upcomingOffers.length === 0 ? (
          <div className="mt-8 max-w-2xl">
            <p className="text-lg leading-relaxed text-muted-foreground">
              Nie mamy teraz opublikowanych najbliższych terminów.
            </p>
            <CategoryLinks />
          </div>
        ) : null}

        {!isPending && !isError && upcomingOffers.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingOffers.map((offer) => (
              <HomeOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
