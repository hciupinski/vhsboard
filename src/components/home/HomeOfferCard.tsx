import { Link } from "@tanstack/react-router";

import { formatPriceFrom, formatTripDates } from "@/lib/offers/formatters";
import type { PublicOffer } from "@/lib/offers/types";

const activityLabels: Record<PublicOffer["activity"], string> = {
  surf: "Surf",
  snow: "Snowboard",
  combo: "Surf + snowboard",
  wake: "Wakeboard",
};

export function HomeOfferCard({ offer }: { offer: PublicOffer }) {
  const content = (
    <article className="relative isolate aspect-[5/5] min-w-0 overflow-hidden rounded-3xl bg-foreground shadow-warm transition-transform duration-300 motion-reduce:transition-none md:group-hover:-translate-y-1">
      <div className="absolute inset-0">
        {offer.heroImageUrl ? (
          <img
            src={offer.heroImageUrl}
            alt=""
            loading="lazy"
            width={1200}
            height={900}
            className="size-full object-cover transition-transform duration-500 motion-reduce:transition-none md:group-hover:scale-105"
          />
        ) : (
          <div aria-hidden="true" className="size-full bg-sunset-gradient opacity-75" />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/40 to-transparent"
        />
      </div>
      <div className="absolute inset-x-0 top-0 flex justify-start p-5">
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-sm">
          {activityLabels[offer.activity]}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-background sm:p-6">
        <p className="text-sm font-medium text-background/80">
          {formatTripDates(offer.startDate, offer.endDate)}
        </p>
        <h3 className="mt-1 font-display text-3xl leading-none sm:text-4xl">{offer.title}</h3>
        <p className="mt-4 text-sm font-medium text-background/80">Już od</p>
        <p className="font-display text-3xl leading-none text-background">
          {formatPriceFrom(offer.priceFrom, offer.currency)}
        </p>
        <span
          aria-hidden="true"
          className="mt-5 flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-[opacity,transform] duration-300 motion-reduce:transition-none md:pointer-events-none md:translate-y-2 md:opacity-0 md:group-focus-visible:pointer-events-auto md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          Sprawdź szczegóły
        </span>
      </div>
    </article>
  );

  if (offer.offerKind === "trip") {
    return (
      <Link
        to="/wyjazdy/$slug"
        params={{ slug: offer.slug }}
        aria-label={offer.title}
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
      aria-label={offer.title}
      className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}
