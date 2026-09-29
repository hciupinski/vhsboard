import { Link } from "@tanstack/react-router";

import { getOfferCardStatus } from "@/lib/offers/card-status";
import { formatPriceFrom, formatTripDates } from "@/lib/offers/formatters";
import type { PublicOffer } from "@/lib/offers/types";

const activityLabels: Record<PublicOffer["activity"], string> = {
  surf: "Surf",
  snow: "Snowboard",
  combo: "Surf + snowboard",
  wake: "Wakeboard",
};

export function HomeOfferCard({ offer }: { offer: PublicOffer }) {
  const { isFinished, showLastPlacesBadge } = getOfferCardStatus(offer);
  const linkLabel = `${offer.title}${showLastPlacesBadge ? ". Ostatnie miejsca" : ""}`;
  const content = (
    <article
      className={`relative isolate flex min-h-[26rem] min-w-0 flex-col overflow-hidden rounded-3xl bg-foreground shadow-warm transition-transform duration-300 motion-reduce:transition-none${isFinished ? "" : " md:group-hover:-translate-y-1"}`}
    >
      <div className="absolute inset-0">
        {offer.heroImageUrl ? (
          <img
            src={offer.heroImageUrl}
            alt=""
            loading="lazy"
            width={1200}
            height={900}
            className={`size-full object-cover transition-transform duration-500 motion-reduce:transition-none${isFinished ? " grayscale" : " md:group-hover:scale-105"}`}
          />
        ) : (
          <div aria-hidden="true" className="size-full bg-sunset-gradient opacity-75" />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/40 to-transparent"
        />
      </div>
      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-sm">
            {activityLabels[offer.activity]}
          </span>
          {showLastPlacesBadge && (
            <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase tracking-widest text-foreground shadow-sm">
              Ostatnie miejsca
            </span>
          )}
          {isFinished && (
            <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase tracking-widest text-foreground shadow-sm">
              Zakończone
            </span>
          )}
        </div>
        <div className="mt-auto pt-8 text-background">
          <p className="text-sm font-medium text-background/80">
            {formatTripDates(offer.startDate, offer.endDate)}
          </p>
          <h3 className="mt-1 font-display text-3xl leading-none sm:text-4xl">{offer.title}</h3>
          <p className="mt-4 text-sm font-medium text-background/80">Już od</p>
          <p className="font-display text-3xl leading-none text-background">
            {formatPriceFrom(offer.priceFrom, offer.currency)}
          </p>
          {!isFinished && (
            <span
              aria-hidden="true"
              className="mt-5 flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-[opacity,transform] duration-300 motion-reduce:transition-none md:pointer-events-none md:translate-y-2 md:opacity-0 md:group-focus-visible:pointer-events-auto md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100"
            >
              Sprawdź szczegóły
            </span>
          )}
        </div>
      </div>
    </article>
  );

  if (isFinished) return content;

  if (offer.offerKind === "trip") {
    return (
      <Link
        to="/wyjazdy/$slug"
        params={{ slug: offer.slug }}
        aria-label={linkLabel}
        className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {content}
      </Link>
    );
  }

  return (
    <Link
      to="/obozy/$slug"
      params={{ slug: offer.slug }}
      aria-label={linkLabel}
      className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}
