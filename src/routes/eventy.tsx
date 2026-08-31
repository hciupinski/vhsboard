import { createFileRoute, Link } from "@tanstack/react-router";

import skimboardingLessonImage from "@/assets/eventy-nauka-skimboardingu.jpg";
import skimboardingTrackImage from "@/assets/eventy-tor-skimboardowy.jpg";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { Button } from "@/components/ui/button";
import { createPageMetadata } from "@/lib/seo";

export const Route = createFileRoute("/eventy")({
  head: () =>
    createPageMetadata({
      path: "/eventy",
      title: "Eventy z torem skimboardowym | VHSBOARD",
      description: "Eventy z mobilnym torem skimboardowym organizowane przez VHSBOARD.",
    }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <PublicJsonLd path="/eventy" label="Eventy" />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-foreground text-background">
          <img
            src={skimboardingTrackImage}
            alt="Uczestnik ślizgający się po mobilnym torze skimboardowym podczas plenerowego eventu"
            className="absolute inset-0 -z-20 size-full object-cover object-[65%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-foreground/75 sm:bg-gradient-to-r sm:from-foreground sm:via-foreground/80 sm:to-foreground/20" />
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28 lg:py-32">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Eventy
              </p>
              <h1 className="mt-4 text-5xl leading-[0.9] sm:text-7xl lg:text-8xl">
                Tor skimboardowy
                <span className="mt-2 block text-background/85">
                  wynajem na eventy w całej Polsce
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-background/85 sm:text-xl">
                Szukasz atrakcji na event firmowy, piknik rodzinny albo imprezę miejską, której nikt
                wcześniej nie widział?
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full">
                <Link to="/kontakt">Zapytaj o event</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Ruch dla każdego
            </p>
            <h2 className="mt-3 text-4xl leading-[0.95] sm:text-6xl">
              Ty zajmujesz się imprezą, my robimy show.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Mobilny tor skimboardowy przyciąga uczestników w każdym wieku, od 6-latków po
              dorosłych. Przywozimy go, montujemy i prowadzimy całość z instruktorami.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Każdy zaczyna od prostych wskazówek, a pierwsze ślizgi pojawiają się już po kilku
              minutach.
            </p>
          </div>
          <img
            src={skimboardingLessonImage}
            alt="Dziecko uczące się skimboardingu pod opieką instruktora na mobilnym torze"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-warm"
          />
        </section>

        <section className="bg-secondary/55 py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Na czym polega
              </p>
              <h2 className="mt-3 text-4xl leading-[0.95] sm:text-6xl">
                Czym jest <span className="text-primary">skimboarding?</span>
              </h2>
            </div>
            <div className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              <p>
                Skimboarding to ślizganie się na desce po płytkiej tafli wody, trochę jak surfing,
                tylko bez oceanu. Na naszych mobilnych torach każdy uczestnik już po kilku minutach
                nauki robi pierwsze ślizgi.
              </p>
              <p className="mt-5">
                Dmuchane bandy i antypoślizgowe dno sprawiają, że atrakcja jest w pełni bezpieczna,
                także dla dzieci. Zobacz, jak wygląda{" "}
                <a
                  href="https://www.youtube.com/watch?v=85_CDXNlPmg&t=1s"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                >
                  skimboarding
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Dopasowany do okazji
          </p>
          <div className="mt-3 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <h2 className="text-4xl leading-[0.95] sm:text-6xl">Atrakcja na każdy event</h2>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Mobilny tor skimboardowy sprawdzi się jako główna atrakcja wszędzie tam, gdzie liczy
              się ruch, energia i wspólne kibicowanie.
            </p>
          </div>
          <ul className="mt-10 grid gap-x-12 gap-y-5 border-y border-border py-8 text-lg sm:grid-cols-2">
            {[
              "integracjach firmowych i piknikach pracowniczych",
              "piknikach rodzinnych i festynach",
              "dniach miasta i imprezach plenerowych",
              "eventach w galeriach handlowych",
              "obozach i obozach dla dzieci i młodzieży",
              "wydarzeniach sportowych, juwenaliach i targach",
            ].map((event) => (
              <li key={event} className="flex gap-3 text-foreground">
                <span
                  aria-hidden="true"
                  className="mt-3 size-1.5 shrink-0 rounded-full bg-primary"
                />
                <span>{event}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-foreground py-16 text-background sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Sprzęt i bezpieczeństwo
              </p>
              <h2 className="mt-3 text-4xl leading-[0.95] sm:text-6xl">
                Tor skrojony pod Twój event.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-background/75">
                Dysponujemy mobilnymi torami o długości 15, 20 i 30 metrów oraz torem stacjonarnym.
                Dmuchane bandy są w pełni bezpieczne, a antypoślizgowe dno pozwala swobodnie
                korzystać z toru i szybko złapać rytm.
              </p>
            </div>
            <Button asChild size="lg" className="rounded-full">
              <Link to="/kontakt">Porozmawiajmy o terminie</Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
