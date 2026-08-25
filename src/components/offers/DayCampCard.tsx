import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { formatPriceFrom, formatTripDates } from "@/lib/offers/formatters";
import type { DayCampOffer } from "@/lib/offers/types";

const activityLabels: Record<DayCampOffer["activity"], string> = {
  wake: "Wakeboard",
  snow: "Snowboard",
};

export function DayCampCard({ offer }: { offer: DayCampOffer }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-warm">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {offer.heroImageUrl ? (
          <img
            src={offer.heroImageUrl}
            alt=""
            loading="lazy"
            width={1200}
            height={900}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div aria-hidden="true" className="h-full w-full bg-sunset-gradient opacity-40" />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-sunset-gradient px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
          {activityLabels[offer.activity]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-medium text-accent">{offer.location}</p>
        <h3 className="mt-1 text-2xl">{offer.title}</h3>
        <p className="mt-3 flex-1 text-sm text-muted-foreground">{offer.shortDescription}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-4">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {formatTripDates(offer.startDate, offer.endDate)}
          </span>
          <span className="font-display text-xl text-primary">
            {formatPriceFrom(offer.priceFrom, offer.currency)}
          </span>
        </div>
        <Button asChild className="mt-4 w-full rounded-full" variant="secondary">
          <Link to="/polkolonie/$slug" params={{ slug: offer.slug }}>
            Zobacz szczegóły półkolonii
          </Link>
        </Button>
      </div>
    </article>
  );
}
