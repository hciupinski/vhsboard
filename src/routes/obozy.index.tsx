import { getLocalImage } from "@/lib/images/responsive";
import { ResponsiveImage } from "@/components/public/ResponsiveImage";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DayCampCard } from "@/components/offers/DayCampCard";
import { FaqSection } from "@/components/public/FaqSection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { campFaqItems } from "@/lib/faq";
import { selectCampListingOffers } from "@/lib/offers/camp-list";
import { getTodayInWarsaw } from "@/lib/offers/home-offers";
import { publishedOffersQueryOptions } from "@/lib/offers/query-options";
import { publicPortalThemeOptions } from "@/lib/portal-theme/query-options";
import { SOCIAL_IMAGES } from "@/lib/social-images";
import { createPageMetadata } from "@/lib/seo";

const summerHeroImage = getLocalImage("obozy/main-obozy-lato.jpg");
const winterHeroImage = getLocalImage("obozy/main-obozy-zima.png");
const summerCampImage = getLocalImage("obozy/obozy-lato-wakeboard.png");
const winterCampImage = getLocalImage("obozy/obozy-zima.jpg");

export const Route = createFileRoute("/obozy/")({
  head: () =>
    createPageMetadata({
      socialImage: SOCIAL_IMAGES.camps,
      path: "/obozy",
      title: "Obozy sportowe | VHSBOARD",
      description:
        "Obozy letnie i zimowe VHSBOARD: wakepark, skimboard, skateboarding i snowboard.",
    }),
  component: HalfDayCampsPage,
});

function HalfDayCampsPage() {
  const { data: theme = "original" } = useQuery({
    ...publicPortalThemeOptions(),
    enabled: typeof window !== "undefined",
  });
  const isWinter = theme === "winter";
  const {
    data: offers = [],
    isPending,
    isError,
    refetch,
  } = useQuery(publishedOffersQueryOptions("day_camp"));
  const visibleOffers = selectCampListingOffers(offers, getTodayInWarsaw());
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <PublicJsonLd path="/obozy" label="Obozy" />
      <main className="flex-1">
        <section
          className={`relative isolate flex min-h-[calc(100svh-73px-var(--development-banner-height,0px))] flex-col justify-end overflow-hidden lg:min-h-[36.5rem] lg:flex-row lg:items-center${isWinter ? " max-lg:portrait:bg-foreground max-sm:portrait:min-h-[max(calc(100svh-73px-var(--development-banner-height,0px)),calc(112vw+12rem))]" : ""}`}
        >
          <ResponsiveImage
            sizes={isWinter ? "(max-width: 767px) 1600px, 100vw" : "100vw"}
            image={isWinter ? winterHeroImage : summerHeroImage}
            alt={
              isWinter
                ? "Zimowy obóz snowboardowy VHSBOARD w górach"
                : "Letni obóz sportowy VHSBOARD nad wodą"
            }
            className={`absolute inset-0 -z-20 size-full object-cover ${isWinter ? "object-[70%_center] md:object-center max-lg:portrait:h-[min(145vw,calc(100%-9.5rem))] max-lg:portrait:object-[67%_center] max-lg:portrait:mask-b-from-82%" : "object-center"}`}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 hidden bg-foreground/20 lg:block"
          />
          <div className="relative w-full bg-linear-to-t from-foreground via-foreground/85 via-65% to-transparent px-5 pt-16 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:mx-auto lg:max-w-6xl lg:bg-none lg:py-36">
            <p className="inline-block rounded-full border border-background/40 bg-foreground/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-background lg:block lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:text-primary-foreground/80">
              Dla dzieci
            </p>
            <h1 className="mt-3 max-w-3xl text-5xl leading-[0.95] text-background text-shadow-md text-shadow-foreground/50 sm:text-7xl">
              ZAJAWKOWE OBOZY
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-background text-shadow-md text-shadow-foreground/50 sm:text-lg lg:mt-6 lg:text-background/85">
              Twoje dziecko nie usiedzi w miejscu? Mamy na to sposób! Gwarantujemy zero nudy,
              maksimum ruchu i świetną atmosferę pod okiem instruktorów.
            </p>
          </div>
        </section>
        <section className="bg-secondary/55 py-12 sm:py-14" aria-labelledby="current-camps-heading">
          <div className="mx-auto max-w-6xl px-5">
            <h2 id="current-camps-heading" className="text-3xl sm:text-4xl">
              NAJBLIŻSZE TERMINY
            </h2>
            {isPending ? <p className="mt-4 text-muted-foreground">Ładowanie obozów…</p> : null}
            {isError ? (
              <button type="button" className="mt-4 underline" onClick={() => void refetch()}>
                Nie udało się pobrać obozów. Spróbuj ponownie.
              </button>
            ) : null}
            {!isPending && !isError && visibleOffers.length === 0 ? (
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Nie mamy teraz otwartych obozów. Wróć do nas za chwilę.
              </p>
            ) : null}
            {!isPending && !isError && visibleOffers.length > 0 ? (
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {visibleOffers.map((offer) => (
                  <DayCampCard key={offer.id} offer={offer} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
        <section
          className="mx-auto max-w-6xl px-5 py-12 sm:py-14"
          aria-labelledby="program-heading"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            ŁAP ZAJAWKĘ PRZEZ CAŁY ROK
          </p>
          <h2 id="program-heading" className="mt-3 max-w-2xl text-4xl leading-[0.95] sm:text-6xl">
            RUCH, PROGRES, DOBRY VIBE
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="relative isolate min-h-[25rem] overflow-hidden rounded-3xl border border-border bg-foreground p-6 text-background shadow-warm sm:p-8 flex flex-col justify-end">
              <ResponsiveImage
                loading="lazy"
                sizes="(min-width: 1024px) 50vw, 100vw"
                image={summerCampImage}
                alt="Uczestnik obozu wakeboardowego na jeziorze podczas letnich zajęć"
                className="absolute inset-0 -z-20 size-full object-cover object-center"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground via-foreground/75 to-foreground/10" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                Lato
              </p>
              <h3 className="mt-3 text-3xl sm:text-4xl">WODA | WAKEBOARD</h3>
              <p className="mt-4 max-w-xl leading-relaxed text-background/90">
                Wakeboard, skimboard, deskorolka, SUP i masa aktywności, które dzieciaki kochają
                najbardziej! Małe grupy, 100% czasu na świeżym powietrzu i program, w którym jest
                miejsce zarówno na naukę, jak i dobrą zabawę.
              </p>
            </article>
            <article className="relative isolate min-h-[25rem] overflow-hidden rounded-3xl border border-border bg-foreground p-6 text-background shadow-warm sm:p-8 flex flex-col justify-end">
              <ResponsiveImage
                loading="lazy"
                sizes="(min-width: 1024px) 50vw, 100vw"
                image={winterCampImage}
                alt="Snowboardzista w czerwonej kurtce podczas zimowej jazdy w górach"
                className="absolute inset-0 -z-20 size-full object-cover object-center"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground/50 via-foreground/40 to-foreground/[0.075]" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                Zima
              </p>
              <h3 className="mt-3 text-3xl sm:text-4xl">ŚNIEG | SNOWBOARD</h3>
              <p className="mt-4 max-w-xl leading-relaxed text-background/90">
                Uczestnicy — od początkujących po zaawansowanych riderów — codziennie trenują pod
                okiem doświadczonych instruktorów. Kładziemy duży nacisk na freestyle, ale także
                doskonalimy technikę jazdy.
              </p>
            </article>
          </div>
        </section>
        <FaqSection
          headingId="camp-faq-heading"
          descriptionClassName="lg:max-w-none"
          items={campFaqItems}
          description="Zebraliśmy odpowiedzi na najczęstsze pytania rodziców dotyczące naszych obozów i półkolonii – od zapisów i szkolenia po opiekę, sprzęt i organizację."
        />
      </main>
      <PublicFooter />
    </div>
  );
}
