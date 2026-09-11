import { createFileRoute, Link } from "@tanstack/react-router";

import skimboardingLessonImage from "@/assets/skim-laczy.jpg";
import skimboardingShoppingCenterImage from "@/assets/strefa-letnia.jpg";
import skimboardingTrackImage from "@/assets/skim-tor.jpg";
import { EventPlaceholderFigure } from "@/components/events/EventPlaceholderFigure";
import { EventUseCasesScroller } from "@/components/events/EventUseCasesScroller";
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
          <figure className="absolute inset-0 bg-foreground">
            <img
              src={skimboardingTrackImage}
              alt="Uczestnik ślizgający się po mobilnym torze skimboardowym podczas plenerowego eventu"
              className="size-full object-cover object-[65%_center] brightness-[0.45]"
            />
          </figure>
          <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28 lg:py-32">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Eventy
              </p>
              <h1 className="mt-4 text-5xl leading-[0.9] sm:text-7xl lg:text-8xl">
                TOR SKIMBOARDOWY — PRZYCIĄGA LUDZI. SURFING DLA KAŻDEGO
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-background/85 sm:text-xl">
                Atrakcja na event firmowy, piknik, imprezę miejską czy wydarzenie sportowe. Tworzymy
                kompleksową strefę, która angażuje, dostarcza emocji i świetnie wygląda na
                zdjęciach.
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full">
                <Link to="/kontakt">Zapytaj o event</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Strefa Skate
            </h2>
            <h3 className="mt-3 text-4xl leading-[0.95] sm:text-6xl">
              MIEJSKIE SPORTY, KTÓRE ŁĄCZĄ
            </h3>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Deskorolka, rolki, warsztaty i otwarta strefa dla każdego. Tworzymy przestrzeń, która
              zachęca do ruchu, próbowania nowych rzeczy i wspólnej zajawki.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full">
              <Link to="/kontakt">Zapytaj o event</Link>
            </Button>
          </div>
          <EventPlaceholderFigure
            src={skimboardingLessonImage}
            alt="Dziecko uczące się skimboardingu pod opieką instruktora na mobilnym torze"
          />
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
          <EventUseCasesScroller
            items={[
              "integracjach firmowych i piknikach pracowniczych",
              "piknikach rodzinnych i festynach",
              "dniach miasta i imprezach plenerowych",
              "eventach w galeriach handlowych",
              "obozach dla dzieci i młodzieży",
              "wydarzeniach sportowych, juwenaliach i targach",
              "eventach miejskich, festiwalach i wydarzeniach w galeriach handlowych",
            ]}
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
                Tor skimboardowy to idealna atrakcja w okresie od maja do września. Pozwala
                uczestnikom imprezy spędzić aktywnie czas i spróbować czegoś nowego. Przyciąga
                dzieci, młodzież i dorosłych. W 2h montujemy strefę, a nasi instruktorzy czuwają nad
                bezpieczeństwem i szkolą uczestników.
              </p>
              <p className="mt-5">
                Nie trzeba umieć jeździć. Wystarczy kilka wskazówek, żeby złapać pierwsze ślizgi.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Dłuższa chwila na ruch
            </p>
            <h2 className="mt-3 text-4xl leading-[0.95] sm:text-6xl">
              Strefa letnia w centrum handlowym
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Tor skimboardowy może stać się głównym punktem letniej strefy w galerii lub parku
              handlowym. Generuje naturalny ruch i daje powód, żeby zatrzymać się na dłużej oraz
              dołączyć do wspólnej zabawy. To świetny element kampanii sezonowej, który zachęca do
              odwiedzin obiektu.
            </p>
          </div>
          <EventPlaceholderFigure
            src={skimboardingShoppingCenterImage}
            alt="Uczestnik ślizgający się po mobilnym torze skimboardowym podczas plenerowego eventu"
          />
        </section>

        <section className="bg-foreground py-16 text-background sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Sprzęt i bezpieczeństwo
              </p>
              <h2 className="mt-3 text-4xl leading-[0.95] sm:text-6xl">
                Tor skrojony pod Twój event.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-background/75">
                Dysponujemy torami w kilku rozmiarach i kolorach, dzięki czemu możemy dopasować
                strefę do przestrzeni, charakteru wydarzenia i liczby uczestników. Każdy tor ma
                dmuchane bandy oraz antypoślizgowe dno.
              </p>
              <p className="mt-5 text-lg font-semibold text-background">15 m, 20 m, 22 m, 30 m</p>
              <Button asChild size="lg" className="mt-8 rounded-full">
                <Link to="/kontakt">Zapytaj o event</Link>
              </Button>
            </div>
            <EventPlaceholderFigure
              src={skimboardingTrackImage}
              alt="Dziecko uczące się skimboardingu pod opieką instruktora na mobilnym torze"
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Galeria</p>
          <h2 className="mt-3 text-4xl leading-[0.95] sm:text-6xl">Zobacz nas w akcji</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <EventPlaceholderFigure
              src={skimboardingTrackImage}
              alt="Uczestnik korzystający z mobilnego toru skimboardowego podczas eventu"
            />
            <EventPlaceholderFigure
              src={skimboardingLessonImage}
              alt="Dziecko uczące się skimboardingu pod opieką instruktora"
            />
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
