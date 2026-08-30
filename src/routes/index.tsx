import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import wakeparkCampImage from "@/assets/obozy-wakepark.png";
import skimboardingTrackImage from "@/assets/eventy-tor-skimboardowy.jpg";
import heroSurf from "@/assets/hero-surf.jpg";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { Button } from "@/components/ui/button";
import { createPageMetadata } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    createPageMetadata({
      path: "/",
      title: "VHSBOARD — wyjazdy, eventy i obozy",
      description: "VHSBOARD organizuje wyjazdy, eventy z torem skimboardowym i obozy.",
    }),
  component: HomePage,
});

const entryPoints = [
  {
    to: "/wyjazdy",
    title: "Wyjazdy",
    eyebrow: "01 / W podróż",
    text: "Surf, snowboard i dobra ekipa — wyjazdy, do których chce się wracać.",
    action: "Zobacz wyjazdy",
    image: heroSurf,
    imageAlt: "Uczestnicy wyjazdu VHSBOARD z deskami surfingowymi na plaży",
  },
  {
    to: "/eventy",
    title: "Eventy",
    eyebrow: "02 / Ruch",
    text: "Sport, dobra energia i aktywności, które przyciągają ludzi i rozkręcają wydarzenia.",
    action: "Sprawdź eventy",
    image: skimboardingTrackImage,
    imageAlt: "Uczestnik eventu na mobilnym torze skimboardowym VHSBOARD",
  },
  {
    to: "/obozy",
    title: "Obozy",
    eyebrow: "03 / Dla młodych",
    text: "Wakacje po naszemu? Aktywne dni pełne sportu, zabawy i nowych doświadczeń.",
    action: "Poznaj obozy",
    image: wakeparkCampImage,
    imageAlt:
      "Dziecko płynące na wakeboardzie podczas obozu VHSBOARD, obserwowane przez instruktora i grupę dzieci",
  },
] as const;

function HomePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <PublicJsonLd path="/" label="VHSBOARD" includeSite />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden">
          <img
            src={heroSurf}
            alt="Grupa znajomych idąca na plażę z deskami surfingowymi o zachodzie słońca"
            width={1600}
            height={1104}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/55" />
          <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-24 sm:pb-28 sm:pt-36">
            <p className="mb-4 inline-block rounded-full border border-background/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-background">
              Wyjazdy · Eventy · Obozy
            </p>
            <h1 className="max-w-3xl text-5xl leading-[0.95] text-background sm:text-7xl">
              Dobre rzeczy dzieją się poza codziennym planem
            </h1>
            <p className="mt-5 max-w-xl text-base text-background/85 sm:text-lg">
              Żyjemy deską przez cały rok. Łączymy ludzi, sport i dobrą energię — na wyjazdach,
              eventach i podczas aktywności dla dzieci.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full shadow-warm">
              <Link to="/wyjazdy">Zobacz wyjazdy</Link>
            </Button>
          </div>
        </section>
        <section className="py-16 sm:py-24" aria-labelledby="entry-points-heading">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Wybierz swój kierunek
            </p>
            <h2 id="entry-points-heading" className="mt-3 text-4xl leading-[0.95] sm:text-6xl">
              ZACZNIJ NOWĄ PRZYGODĘ
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Trzy sposoby na czas poza codziennym planem. Wybierz ten, który najbardziej Cię kręci.
            </p>
          </div>
          <div
            data-testid="topic-selector"
            className="topic-selector mt-8 overflow-hidden bg-background sm:mt-10"
          >
            {entryPoints.map(({ to, title, eyebrow, text, action, image, imageAlt }, index) => (
              <Link
                key={to}
                to={to}
                className={`topic-selector__item topic-selector__item--${index + 1} topic-selector__item--mobile-stack group isolate flex overflow-hidden py-8 text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:py-10`}
              >
                <img
                  src={image}
                  alt={imageAlt}
                  className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-105"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground/90 via-foreground/25 to-foreground/5" />
                <div
                  className={`topic-selector__content topic-selector__content--contrast topic-selector__content--flush-left topic-selector__content--safe-text-inset topic-selector__content--${index + 1}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
                    {eyebrow}
                  </p>
                  <h3 className="mt-3 text-4xl leading-[0.9] sm:text-5xl">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-background/85 sm:text-base">
                    {text}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                    {action}
                    <span className="grid size-7 place-items-center rounded-full bg-background/15 transition duration-200 motion-reduce:transition-none group-hover:translate-x-1 group-hover:bg-primary">
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
