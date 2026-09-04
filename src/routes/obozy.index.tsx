import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import wakeparkCampImage from "@/assets/obozy-wakepark.png";
import { DayCampCard } from "@/components/offers/DayCampCard";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { publishedOffersQueryOptions } from "@/lib/offers/query-options";
import { createPageMetadata } from "@/lib/seo";

export const Route = createFileRoute("/obozy/")({
  head: () =>
    createPageMetadata({
      path: "/obozy",
      title: "Obozy sportowe | VHSBOARD",
      description:
        "Obozy letnie i zimowe VHSBOARD: wakepark, skimboard, skateboarding i snowboard.",
    }),
  component: HalfDayCampsPage,
});

function HalfDayCampsPage() {
  const {
    data: offers = [],
    isPending,
    isError,
    refetch,
  } = useQuery(publishedOffersQueryOptions("day_camp"));
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <PublicJsonLd path="/obozy" label="Obozy" />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden">
          <img
            src={wakeparkCampImage}
            alt="Dziecko płynące na wakeboardzie podczas obozów VHSBOARD, obserwowane przez instruktora i grupę dzieci"
            width={1536}
            height={1024}
            className="absolute inset-0 -z-20 size-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-foreground/65" />
          <div className="mx-auto max-w-6xl px-5 py-24 sm:py-36">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
              Dla dzieci
            </p>
            <h1 className="mt-3 max-w-3xl text-5xl leading-[0.95] text-background sm:text-7xl">
              ZAJAWKOWE OBOZY
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/85">
              Twoje dziecko nie usiedzi w miejscu? Mamy na to sposób! Oferujemy zero nudy, maksimum
              ruchu i świetną atmosferę pod okiem instruktorów.
            </p>
          </div>
        </section>
        <section
          className="mx-auto max-w-6xl px-5 py-16 sm:py-24"
          aria-labelledby="program-heading"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Przez cały rok → złap zajawkę
          </p>
          <h2 id="program-heading" className="mt-3 max-w-2xl text-4xl leading-[0.95] sm:text-6xl">
            RUCH, PROGRES, DOBRY VIBE
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-border bg-card p-6 shadow-warm sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Lato</p>
              <h3 className="mt-3 text-3xl sm:text-4xl">WODA | WAKEBOARD</h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Wakeboard, skimboard, deskorolka, SUP i masa aktywności, które dzieciaki kochają
                najbardziej! Małe grupy, 100% czasu na świeżym powietrzu i program, w którym jest
                miejsce zarówno na naukę, jak i dobrą zabawę.
              </p>
            </article>
            <article className="rounded-3xl border border-border bg-secondary/55 p-6 shadow-warm sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Zima</p>
              <h3 className="mt-3 text-3xl sm:text-4xl">ŚNIEG | SNOWBOARD</h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Uczestnicy — od początkujących po zaawansowanych riderów — codziennie trenują pod
                okiem doświadczonych instruktorów. Kładziemy duży nacisk na freestyle, ale także
                doskonalimy technikę jazdy.
              </p>
            </article>
          </div>
        </section>
        <section className="bg-secondary/55 py-16 sm:py-20" aria-labelledby="current-camps-heading">
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
            {!isPending && !isError && offers.length === 0 ? (
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Nie mamy teraz otwartych obozów. Wróć do nas za chwilę.
              </p>
            ) : null}
            {!isPending && !isError && offers.length > 0 ? (
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {offers.map((offer) =>
                  offer.offerKind === "day_camp" ? (
                    <DayCampCard key={offer.id} offer={offer} />
                  ) : null,
                )}
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
