import { OfferCard } from "@/components/offers/OfferCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicOffer } from "@/lib/offers/types";

type OfferListStateProps = {
  offers: PublicOffer[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function OfferListState({ offers, isPending, isError, onRetry }: OfferListStateProps) {
  if (isPending) {
    return (
      <div className="mt-10 grid gap-6 md:grid-cols-3" aria-label="Ładowanie ofert">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-border bg-card p-6">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="mt-6 h-5 w-2/5" />
            <Skeleton className="mt-3 h-8 w-4/5" />
            <Skeleton className="mt-6 h-10 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-10 rounded-3xl border border-destructive/30 bg-card p-6" role="alert">
        <p className="font-medium">Nie udało się pobrać ofert.</p>
        <p className="mt-1 text-sm text-muted-foreground">Sprawdź połączenie i spróbuj ponownie.</p>
        <Button type="button" className="mt-4 rounded-full" onClick={onRetry}>
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="mt-10 rounded-3xl border border-border bg-card p-6 text-muted-foreground">
        Nie mamy teraz opublikowanych wyjazdów. Wróć do nas za chwilę.
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-3">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
}
