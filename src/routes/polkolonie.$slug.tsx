import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { CalendarDays, MapPin, Wallet } from "lucide-react";

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
        <div className="mx-auto max-w-6xl px-5 py-16">
          <section>
            <h2 className="text-3xl">O półkolonii</h2>
            {content.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 max-w-3xl text-muted-foreground">
                {paragraph}
              </p>
            ))}
            <h3 className="mt-8 text-2xl">Miejsce zajęć</h3>
            <p className="mt-3 max-w-3xl text-muted-foreground">{content.venueDescription}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-2xl">Najważniejsze momenty</h3>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  {content.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-2xl">W cenie</h3>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  {content.included.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <h3 className="mt-5 text-xl text-muted-foreground">Poza ceną</h3>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  {content.excluded.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
          <section className="mt-12">
            <h2 className="text-3xl">Plan dnia</h2>
            <ol className="mt-4 space-y-3">
              {content.dayProgram.map((item) => (
                <li key={item.time} className="rounded-2xl border border-border bg-card p-4">
                  <strong>{item.time}</strong>
                  <p className="mt-1 text-muted-foreground">{item.text}</p>
                </li>
              ))}
            </ol>
          </section>
          <section className="mt-12">
            <h2 className="text-3xl">Turnusy i ceny</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {content.terms.map((term) => (
                <article key={term.label} className="rounded-3xl border border-border bg-card p-6">
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
          <section className="mt-12">
            <h2 className="text-3xl">Dla rodzica</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="font-medium">Wiek uczestników</dt>
                <dd className="text-muted-foreground">{content.parentInfo.ageRange}</dd>
              </div>
              <div>
                <dt className="font-medium">Opieka</dt>
                <dd className="text-muted-foreground">{content.parentInfo.supervision}</dd>
              </div>
              <div>
                <dt className="font-medium">Bezpieczeństwo</dt>
                <dd className="text-muted-foreground">{content.parentInfo.safety}</dd>
              </div>
              {content.parentInfo.transport ? (
                <div>
                  <dt className="font-medium">Transport</dt>
                  <dd className="text-muted-foreground">{content.parentInfo.transport}</dd>
                </div>
              ) : null}
              {content.parentInfo.meals ? (
                <div>
                  <dt className="font-medium">Wyżywienie</dt>
                  <dd className="text-muted-foreground">{content.parentInfo.meals}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>
        {offer.images.length > 0 ? <OfferGallery images={offer.images} /> : null}
      </main>
      <PublicFooter />
    </div>
  );
}
