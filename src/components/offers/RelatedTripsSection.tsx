import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { getTodayInWarsaw } from "@/lib/offers/home-offers";
import { publishedOffersQueryOptions } from "@/lib/offers/query-options";
import { selectRelatedTrips } from "@/lib/offers/related-trips";
import { OfferCard } from "./OfferCard";

export function RelatedTripsSection({ currentOfferId }: { currentOfferId: string }) {
  const { data = [], isPending, isError } = useQuery(publishedOffersQueryOptions("trip"));
  const offers = selectRelatedTrips(data, currentOfferId, getTodayInWarsaw());
  const showCards = !isPending && !isError && offers.length > 0;
  return (
    <section
      className="border-t border-border bg-secondary/55 py-12 sm:py-14"
      aria-label="Inne wyjazdy"
    >
      <div className="mx-auto max-w-6xl px-5">
        {showCards && <h2 className="text-4xl leading-[0.95] sm:text-6xl">Zobacz inne wyjazdy</h2>}
        {isPending && (
          <div
            aria-label="Ładowanie innych wyjazdów"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton
                key={i}
                data-testid="related-trip-skeleton"
                className="min-h-[26rem] rounded-3xl"
              />
            ))}
          </div>
        )}
        {isError && (
          <p role="alert" className="text-muted-foreground">
            Nie udało się pobrać innych wyjazdów.
          </p>
        )}
        {showCards && (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
        <Link
          to="/wyjazdy"
          className="mt-6 inline-block rounded-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Zobacz wszystkie wyjazdy
        </Link>
      </div>
    </section>
  );
}
