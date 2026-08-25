import { Button } from "@/components/ui/button";
import { formatGroupSize, formatPriceFrom, formatTripDates } from "@/lib/offers/formatters";
import type { PublicOffer } from "@/lib/offers/types";

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export function OfferFacts({
  offer,
  showBookingCta = true,
}: {
  offer: PublicOffer;
  showBookingCta?: boolean;
}) {
  const isBookingUrlValid = isHttpsUrl(offer.bookingUrl);

  return (
    <div>
      <dl className="space-y-2 text-sm">
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-border pb-2">
          <dt className="text-muted-foreground">Gdzie</dt>
          <dd className="font-medium">{offer.location}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-border pb-2">
          <dt className="text-muted-foreground">Termin</dt>
          <dd className="font-medium">{formatTripDates(offer.startDate, offer.endDate)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-border pb-2">
          <dt className="text-muted-foreground">Czas</dt>
          <dd className="font-medium">{offer.durationDays} dni</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-border pb-2">
          <dt className="text-muted-foreground">Grupa</dt>
          <dd className="font-medium">{formatGroupSize(offer.groupSizeMin, offer.groupSizeMax)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Cena od osoby</dt>
          <dd className="font-display text-xl text-primary">
            {formatPriceFrom(offer.priceFrom, offer.currency)}
          </dd>
        </div>
      </dl>
      {showBookingCta && isBookingUrlValid ? (
        <Button asChild size="lg" className="mt-6 w-full rounded-full">
          <a href={offer.bookingUrl} target="_blank" rel="noopener noreferrer">
            Przejdź do zapisów
          </a>
        </Button>
      ) : null}
    </div>
  );
}
