import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { CalendarDays, MapPin, Wallet } from "lucide-react";

import { OfferFacts } from "@/components/offers/OfferFacts";
import { OfferGallery } from "@/components/offers/OfferGallery";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { formatPriceFrom, formatTripDates } from "@/lib/offers/formatters";
import { publishedOfferQueryOptions } from "@/lib/offers/query-options";
import type { PublicOffer } from "@/lib/offers/types";

const activityLabels: Record<PublicOffer["activity"], string> = {
  surf: "Surf",
  snow: "Snowboard",
  combo: "Surf + snowboard",
};

export const Route = createFileRoute("/wyjazdy/$slug")({
  loader: async ({ context, params }) => {
    const offer = await context.queryClient.ensureQueryData(
      publishedOfferQueryOptions(params.slug),
    );
    if (offer === null) {
      throw notFound();
    }

    return { offer, slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Nie znaleziono wyjazdu — VHSBOARD" },
          { name: "robots", content: "noindex" },
        ],
      };
    }

    const { offer } = loaderData;
    const title = `${offer.title} — ${offer.location} | VHSBOARD`;
    return {
      meta: [
        { title },
        { name: "description", content: offer.shortDescription },
        { property: "og:title", content: title },
        { property: "og:description", content: offer.shortDescription },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: TripDetail,
});

function TripDetail() {
  const { slug } = Route.useLoaderData();
  const { data: offer } = useSuspenseQuery(publishedOfferQueryOptions(slug));

  if (offer === null) {
    throw notFound();
  }

  const { content } = offer;
  const hasPriceDetails = content.included.length > 0 || content.excluded.length > 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-foreground">
          {offer.heroImageUrl ? (
            <img
              src={offer.heroImageUrl}
              alt=""
              width={1600}
              height={1104}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-sunset-gradient opacity-35" />
          )}
          <div className="absolute inset-0 bg-foreground/55" />
          <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-16 sm:pb-20 sm:pt-24">
            <span className="inline-block rounded-full bg-sunset-gradient px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
              {activityLabels[offer.activity]}
            </span>
            <h1 className="mt-4 max-w-2xl text-5xl leading-[0.95] text-background sm:text-7xl">
              {offer.title}
            </h1>
            {offer.subtitle ? (
              <p className="mt-4 max-w-xl text-lg text-background/90">{offer.subtitle}</p>
            ) : null}
            {offer.shortDescription ? (
              <p className="mt-3 max-w-xl text-background/85">{offer.shortDescription}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-background/90">
              <span className="flex items-center gap-2">
                <MapPin className="size-4" />
                {offer.location}
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                {formatTripDates(offer.startDate, offer.endDate)}
              </span>
              <span className="flex items-center gap-2">
                <Wallet className="size-4" />
                {formatPriceFrom(offer.priceFrom, offer.currency)} od osoby
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:py-20 lg:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0">
            {content.paragraphs.length > 0 ? (
              <section aria-labelledby="about-trip-title">
                <h2 id="about-trip-title" className="text-3xl sm:text-4xl">
                  O wyjeździe
                </h2>
                {content.paragraphs.map((paragraph, index) => (
                  <p
                    key={`${index}-${paragraph.slice(0, 24)}`}
                    className="mt-4 text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ) : null}

            {content.highlights.length > 0 ? (
              <section
                className={content.paragraphs.length > 0 ? "mt-12" : undefined}
                aria-labelledby="highlights-title"
              >
                <h2 id="highlights-title" className="text-3xl sm:text-4xl">
                  Najlepsze momenty
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {content.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                    >
                      {highlight}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {content.schedule.length > 0 ? (
              <section
                className={
                  content.paragraphs.length > 0 || content.highlights.length > 0
                    ? "mt-12"
                    : undefined
                }
                aria-labelledby="schedule-title"
              >
                <h2 id="schedule-title" className="text-3xl sm:text-4xl">
                  Jak wyglądają dni
                </h2>
                <ol className="mt-4 space-y-4 border-l border-border pl-5">
                  {content.schedule.map((scheduleItem) => (
                    <li key={`${scheduleItem.day}-${scheduleItem.text}`} className="relative">
                      <span className="absolute -left-[27px] top-1.5 size-3 rounded-full bg-sunset-gradient" />
                      <p className="font-display text-xl text-foreground">{scheduleItem.day}</p>
                      <p className="text-sm text-muted-foreground">{scheduleItem.text}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {hasPriceDetails ? (
              <section
                className={
                  content.paragraphs.length > 0 ||
                  content.highlights.length > 0 ||
                  content.schedule.length > 0
                    ? "mt-12"
                    : undefined
                }
                aria-labelledby="price-details-title"
              >
                <h2 id="price-details-title" className="text-3xl sm:text-4xl">
                  W cenie
                </h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {content.included.length > 0 ? (
                    <ul className="space-y-2.5">
                      {content.included.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm">
                          <span
                            aria-hidden="true"
                            className="mt-1 size-2 shrink-0 rounded-full bg-accent"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {content.excluded.length > 0 ? (
                    <div>
                      <h3 className="font-display text-xl text-muted-foreground">Poza ceną</h3>
                      <ul className="mt-2.5 space-y-2.5">
                        {content.excluded.map((item) => (
                          <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                            <span
                              aria-hidden="true"
                              className="mt-1 size-2 shrink-0 rounded-full bg-destructive"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-warm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Twój wyjazd</p>
              <OfferFacts offer={offer} />
            </div>
          </aside>
        </div>

        {offer.images.length > 0 ? <OfferGallery images={offer.images} /> : null}
      </main>
      <PublicFooter />
    </div>
  );
}
