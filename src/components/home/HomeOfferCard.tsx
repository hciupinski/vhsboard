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
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-warm">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {offer.heroImageUrl ? (
          <img
            src={offer.heroImageUrl}
            alt=""
            loading="lazy"
            width={1200}
            height={900}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div aria-hidden="true" className="size-full bg-sunset-gradient opacity-40" />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-sunset-gradient px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
          {activityLabels[offer.activity]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-medium text-accent">{offer.location}</p>
        <h3 className="mt-1 text-2xl">{offer.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {offer.shortDescription}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-4">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {formatTripDates(offer.startDate, offer.endDate)}
          </span>
          <span className="font-display text-xl text-primary">
            {formatPriceFrom(offer.priceFrom, offer.currency)}
          </span>
        </div>
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
