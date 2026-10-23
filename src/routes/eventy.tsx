import { getLocalImage } from "@/lib/images/responsive";
import { ResponsiveImage } from "@/components/public/ResponsiveImage";
import { createFileRoute, Link } from "@tanstack/react-router";

import { EventPlaceholderFigure } from "@/components/events/EventPlaceholderFigure";
import { EventUseCasesScroller } from "@/components/events/EventUseCasesScroller";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { Button } from "@/components/ui/button";
import { SOCIAL_IMAGES } from "@/lib/social-images";
import { createPageMetadata } from "@/lib/seo";
import { eventsFaqItems } from "@/lib/faq";
import { FaqSection } from "@/components/public/FaqSection";

const skimboardingLessonImage = getLocalImage("skim-laczy.jpg");
const skimboardingShoppingCenterImage = getLocalImage("strefa-letnia.jpg");
const skimboardingTrackImage = getLocalImage("skim-tor.jpg");

export const Route = createFileRoute("/eventy")({
  head: () =>
    createPageMetadata({
      socialImage: SOCIAL_IMAGES.events,
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
            <ResponsiveImage
              sizes="100vw"
              image={skimboardingTrackImage}
              alt="Uczestnik ślizgający się po mobilnym torze skimboardowym podczas plenerowego eventu"
              className="size-full object-cover object-[65%_center] brightness-[0.45]"
            />
          </figure>
          <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Eventy
              </p>
              <h1 className="mt-4 text-5xl leading-[0.9] sm:text-7xl">
                TOR SKIMBOARDOWY – PRZYCIĄGA LUDZI, WCIĄGA DO ZABAWY.
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

        <section className="mx-auto max-w-6xl px-5 py-12 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            IDEALNY NA LATO
          </p>
          <div className="mt-3 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <h2 className="text-4xl leading-[0.95] sm:text-6xl">Atrakcja na każdy event</h2>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Mobilny tor skimboardowy sprawdzi się w sezonie letnim na wielu imprezach plenerowych.
              To świetna atrakcja, która angażuje ludzi, promuje aktywne spędzanie czasu i świetnie
              wygląda na zdjęciach.
            </p>
          </div>
          <EventUseCasesScroller
            items={[
              "Integracje i pikniki firmowe",
              "obchody miast, gmin",
              "imprezy plenerowe, festiwale, juwenalia",
              "pikniki rodzinne, festyny",
              "obozy dla dzieci i młodzieży",
              "eventy w galeriach handlowych",
              "wydarzenia sportowe, targi",
            ]}
          />
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              SURFING W MIEŚCIE
            </p>
            <h2 className="mt-3 text-4xl leading-[0.95] sm:text-6xl">
              Strefa letnia w centrum handlowym
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Tor skimboardowy może stać się głównym punktem letniej strefy w galerii lub parku
              handlowym. To świetny element kampanii sezonowej, który zachęca do odwiedzin obiektu i
              tworzy wakacyjny klimat w miejskiej przestrzeni.
            </p>
          </div>
          <EventPlaceholderFigure
            image={skimboardingShoppingCenterImage}
            alt="Uczestnik ślizgający się po mobilnym torze skimboardowym podczas plenerowego eventu"
          />
        </section>

        <section className="bg-foreground py-12 text-background sm:py-14">
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
              image={skimboardingTrackImage}
              alt="Dziecko uczące się skimboardingu pod opieką instruktora na mobilnym torze"
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Strefa Skate
            </p>
            <h2 className="mt-3 text-4xl leading-[0.95] sm:text-6xl">
              MIEJSKIE SPORTY, KTÓRE ŁĄCZĄ
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Deskorolka, rolki, warsztaty i otwarta strefa dla każdego. Tworzymy przestrzeń, która
              zachęca do ruchu, próbowania nowych rzeczy i wspólnej zajawki.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full">
              <Link to="/kontakt">Zapytaj o event</Link>
            </Button>
          </div>
          <EventPlaceholderFigure
            image={skimboardingLessonImage}
            alt="Dziecko uczące się skimboardingu pod opieką instruktora na mobilnym torze"
          />
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Galeria</p>
          <h2 className="mt-3 text-4xl leading-[0.95] sm:text-6xl">Zobacz nas w akcji</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <EventPlaceholderFigure
              image={skimboardingTrackImage}
              alt="Uczestnik korzystający z mobilnego toru skimboardowego podczas eventu"
            />
            <EventPlaceholderFigure
              image={skimboardingLessonImage}
              alt="Dziecko uczące się skimboardingu pod opieką instruktora"
            />
          </div>
        </section>
        <FaqSection
          headingId="events-faq-heading"
          items={eventsFaqItems}
          description="Zebraliśmy najważniejsze informacje dotyczące organizacji naszych stref eventowych – od wyboru atrakcji i miejsca po montaż, sprzęt i obsługę."
        />
      </main>
      <PublicFooter />
    </div>
  );
}
