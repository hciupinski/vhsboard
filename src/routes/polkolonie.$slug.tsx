import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { CalendarDays, MapPin, Wallet } from "lucide-react";

import { OfferFacts } from "@/components/offers/OfferFacts";
import { OfferGallery } from "@/components/offers/OfferGallery";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Button } from "@/components/ui/button";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { formatPriceFrom, formatTripDates } from "@/lib/offers/formatters";
import { publishedOfferQueryOptions } from "@/lib/offers/query-options";
import { createPageMetadata } from "@/lib/seo";

const activityLabels = {
  wake: "Wakeboard",
  snow: "Snowboard",
} as const;

export const Route = createFileRoute("/polkolonie/$slug")({
  loader: async ({ context, params }) => {
    const offer = await context.queryClient.ensureQueryData(
      publishedOfferQueryOptions(params.slug, "day_camp"),
    );
    if (offer === null || offer.offerKind !== "day_camp") throw notFound();
    return { offer, slug: params.slug };
  },
  head: ({ loaderData }) =>
    loaderData
      ? createPageMetadata({
          path: `/polkolonie/${loaderData.offer.slug}`,
          title: `${loaderData.offer.title} | VHSBOARD`,
          description: loaderData.offer.shortDescription,
          ogType: "article",
        })
      : createPageMetadata({
          path: "/polkolonie",
          title: "Nie znaleziono półkolonii — VHSBOARD",
          description: "Nie znaleziono wskazanej półkolonii.",
          indexable: false,
        }),
  component: DayCampDetail,
});

function DayCampDetail() {
  const { slug } = Route.useLoaderData();
  const { data: offer } = useSuspenseQuery(publishedOfferQueryOptions(slug, "day_camp"));
  if (offer === null || offer.offerKind !== "day_camp") throw notFound();
  const { content } = offer;
  const hasPriceDetails = content.included.length > 0 || content.excluded.length > 0;
  const hasTerms = content.terms.length > 0;
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <PublicJsonLd path={`/polkolonie/${offer.slug}`} label={offer.title} offer={offer} />
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
            <h1 className="mt-4 max-w-3xl text-5xl leading-[0.95] text-background sm:text-7xl">
              {offer.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-background/90">{offer.subtitle}</p>
            <p className="mt-3 max-w-2xl text-background/85">{offer.shortDescription}</p>
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
            {content.paragraphs.length > 0 || content.venueDescription ? (
              <section aria-labelledby="about-day-camp-title">
                <h2 id="about-day-camp-title" className="text-3xl sm:text-4xl">
                  O półkolonii
                </h2>
                {content.paragraphs.map((paragraph, index) => (
                  <p
                    key={`${index}-${paragraph.slice(0, 24)}`}
                    className="mt-4 text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
                {content.venueDescription ? (
                  <div className="mt-8 rounded-3xl border border-border bg-secondary/55 p-6 sm:p-8">
                    <h3 className="text-2xl">Miejsce zajęć</h3>
                    <p className="mt-3 text-muted-foreground">{content.venueDescription}</p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {content.highlights.length > 0 ? (
              <section
                className={
                  content.paragraphs.length > 0 || content.venueDescription ? "mt-12" : undefined
                }
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

            {content.dayProgram.length > 0 ? (
              <section
                className={
                  content.paragraphs.length > 0 ||
                  content.venueDescription ||
                  content.highlights.length > 0
                    ? "mt-12"
                    : undefined
                }
                aria-labelledby="day-program-title"
              >
                <h2 id="day-program-title" className="text-3xl sm:text-4xl">
                  Plan dnia
                </h2>
                <ol className="mt-4 space-y-4 border-l border-border pl-5">
                  {content.dayProgram.map((item) => (
                    <li key={item.time} className="relative">
                      <span className="absolute -left-[27px] top-1.5 size-3 rounded-full bg-sunset-gradient" />
                      <p className="font-display text-xl text-foreground">{item.time}</p>
                      <p className="text-sm text-muted-foreground">{item.text}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {hasPriceDetails ? (
              <section
                className={
                  content.paragraphs.length > 0 ||
                  content.venueDescription ||
                  content.highlights.length > 0 ||
                  content.dayProgram.length > 0
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

            {hasTerms ? (
              <section className="mt-12" id="turnusy" aria-labelledby="terms-title">
                <h2 id="terms-title" className="text-3xl sm:text-4xl">
                  Turnusy i ceny
                </h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  {content.terms.map((term) => (
                    <article
                      key={term.label}
                      className="rounded-3xl border border-border bg-card p-6 shadow-warm"
                    >
                      <h3 className="text-2xl">{term.label}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatTripDates(term.startDate, term.endDate)}
                      </p>
                      {term.priceOptions.map((option) => (
                        <div key={option.label} className="mt-4 border-t border-border pt-4">
                          <p className="font-medium">{option.label}</p>
                          <p className="mt-1 font-display text-2xl text-primary">
                            {formatPriceFrom(option.price, "PLN")}
                          </p>
                        </div>
                      ))}
                      <Button asChild className="mt-5 w-full rounded-full">
                        <a href={term.bookingUrl} target="_blank" rel="noopener noreferrer">
                          Przejdź do zapisów
                        </a>
                      </Button>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-12" aria-labelledby="parent-info-title">
              <h2 id="parent-info-title" className="text-3xl sm:text-4xl">
                Dla rodzica
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <dt className="font-medium">Wiek uczestników</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {content.parentInfo.ageRange}
                  </dd>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <dt className="font-medium">Opieka</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {content.parentInfo.supervision}
                  </dd>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <dt className="font-medium">Bezpieczeństwo</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {content.parentInfo.safety}
                  </dd>
                </div>
                {content.parentInfo.transport ? (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <dt className="font-medium">Transport</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {content.parentInfo.transport}
                    </dd>
                  </div>
                ) : null}
                {content.parentInfo.meals ? (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <dt className="font-medium">Wyżywienie</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {content.parentInfo.meals}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-warm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Twoja półkolonia
              </p>
              <OfferFacts offer={offer} showBookingCta={!hasTerms} />
              {hasTerms ? (
                <Button asChild variant="secondary" size="lg" className="mt-6 w-full rounded-full">
                  <a href="#turnusy">Wybierz turnus</a>
                </Button>
              ) : null}
            </div>
          </aside>
        </div>
        {offer.images.length > 0 ? (
          <OfferGallery images={offer.images} title="Zdjęcia z półkolonii" />
        ) : null}
      </main>
      <PublicFooter />
    </div>
  );
}
