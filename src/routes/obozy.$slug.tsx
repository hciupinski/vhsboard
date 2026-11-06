import { OfferDetailSections } from "@/components/offers/sections/OfferDetailSections";
import { getOfferSections } from "@/lib/offers/sections";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { CalendarDays, MapPin, Wallet } from "lucide-react";
import { z } from "zod";

import { OfferFacts } from "@/components/offers/OfferFacts";
import { TripSectionNavigation } from "@/components/offers/TripSectionNavigation";
import { DeferredYouTubeEmbed } from "@/components/public/DeferredYouTubeEmbed";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { BookingButton } from "@/components/offers/BookingButton";
import { getTodayInWarsaw } from "@/lib/offers/home-offers";
import { hasFutureBooking } from "@/lib/offers/offer-timing";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { formatPriceFrom, formatTripDates } from "@/lib/offers/formatters";
import { offerDetailQueryOptions } from "@/lib/offers/query-options";
import { createPageMetadata } from "@/lib/seo";

const activityLabels = {
  wake: "Wakeboard",
  snow: "Snowboard",
} as const;

export const Route = createFileRoute("/obozy/$slug")({
  validateSearch: z.object({
    preview: z
      .union([z.boolean(), z.literal("true"), z.literal("false")])
      .optional()
      .transform((value) => value === true || value === "true"),
  }),
  loaderDeps: ({ search }) => ({ preview: search.preview }),
  loader: async ({ context, params, deps }) => {
    const preview = deps.preview;
    const offer = await context.queryClient.ensureQueryData(
      offerDetailQueryOptions(params.slug, "day_camp", preview),
    );
    if (offer === null || offer.offerKind !== "day_camp") throw notFound();
    return { offer, slug: params.slug, preview };
  },
  head: ({ loaderData }) =>
    loaderData
      ? createPageMetadata({
          path: `/obozy/${loaderData.offer.slug}`,
          title: `${loaderData.preview ? "Podgląd: " : ""}${loaderData.offer.title} | VHSBOARD`,
          description: loaderData.offer.shortDescription,
          ogType: "article",
          indexable: !loaderData.preview,
        })
      : createPageMetadata({
          path: "/obozy",
          title: "Nie znaleziono obozów — VHSBOARD",
          description: "Nie znaleziono wskazanego obozów.",
          indexable: false,
        }),
  component: DayCampDetail,
});

function DayCampDetail() {
  const { slug, preview } = Route.useLoaderData();
  const { data: offer } = useSuspenseQuery(offerDetailQueryOptions(slug, "day_camp", preview));
  if (offer === null || offer.offerKind !== "day_camp") throw notFound();
  const sections = getOfferSections(offer);
  const hasTerms = offer.content.terms.length > 0;
  return (
    <div data-trip-detail className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      {!preview ? (
        <PublicJsonLd path={`/obozy/${offer.slug}`} label={offer.title} offer={offer} />
      ) : null}
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
            <span className="inline-block rounded-full bg-sunset-gradient px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sunset-foreground">
              {activityLabels[offer.activity]}
            </span>
            <h1 className="mt-4 max-w-3xl text-5xl leading-[0.95] text-background sm:text-7xl">
              {offer.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-background/90">{offer.subtitle}</p>
            <p className="mt-3 max-w-2xl text-background/85">{offer.shortDescription}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-background/90">
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
        <TripSectionNavigation key={offer.slug} sections={sections} ariaLabel="Sekcje obozu" />
        <OfferDetailSections
          offer={offer}
          sidebar={
            <div className="rounded-3xl border border-border bg-card p-6 shadow-warm">
              <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                Twój obóz
              </p>
              <OfferFacts offer={offer} showBookingCta={!hasTerms} />
              {hasTerms ? (
                <BookingButton
                  href="#turnusy"
                  disabled={!hasFutureBooking(offer, getTodayInWarsaw())}
                  className="mt-6 w-full rounded-full"
                >
                  Przejdź do zapisów
                </BookingButton>
              ) : null}
            </div>
          }
        />
        <DeferredYouTubeEmbed
          className="mx-auto max-w-6xl px-5 py-12 sm:py-14"
          title="Obozy VHSBOARD"
          videoId="wff_iv8QJ4c"
        />
      </main>
      <PublicFooter />
    </div>
  );
}
