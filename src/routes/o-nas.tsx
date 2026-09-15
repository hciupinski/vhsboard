import { createFileRoute } from "@tanstack/react-router";

import marioSkate from "@/assets/about-us/mario-skate-web.jpg";
import marioSnow from "@/assets/about-us/mario-snow.jpg";
import marioTrip from "@/assets/about-us/mario-trip-web.jpg";
import marioVhs from "@/assets/about-us/mario-vhs.jpg";
import marioSkim from "@/assets/about-us/mario-skim.jpg";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicJsonLd } from "@/components/seo/PublicJsonLd";
import { createPageMetadata } from "@/lib/seo";
import { aboutUsFaqItems } from "@/lib/faq";
import { FaqSection } from "@/components/public/FaqSection";

export const Route = createFileRoute("/o-nas")({
  head: () =>
    createPageMetadata({
      path: "/o-nas",
      title: "O nas | VHSBOARD",
      description: "Poznaj VHSBOARD — ludzi i aktywności, które stoją za naszymi wyjazdami.",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <PublicJsonLd path="/o-nas" label="O nas" />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">O nas</p>
            <h1 className="mt-3 text-5xl leading-[0.92] text-balance sm:text-7xl">
              NIEWAŻNE GDZIE. WAŻNE, ŻE NA DESCE
            </h1>
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">
              VHS powstał w 2017 roku i jest doskonałym przykładem tego, jak pasja naturalnie
              przemieniła się w pracę. Od zawsze byliśmy związani ze sportami deskowymi — nieważne,
              czy na śniegu, czy na wodzie. Ważne, że na desce.
            </p>
            <p className="mt-4 max-w-prose leading-relaxed text-muted-foreground">
              Zajawka do sportów — surfingu, snowboardingu i deskorolki — naturalnie przerodziła się
              w organizację wyjazdów snowboardowych i surfingowych oraz eventów z torem
              skimboardowym w roli głównej. Z czasem przyszły także półkolonie i obozy dla dzieci i
              młodzieży.
            </p>
            <p className="mt-4 max-w-prose leading-relaxed text-muted-foreground">
              Od zawsze jesteśmy lokalnym biurem podróży i właśnie taki charakter chcemy zachować.
              Nie interesuje nas masówka, dlatego nasze wyjazdy pozostają kameralne, a każdy
              uczestnik jest częścią ekipy, a nie kolejnym numerem na liście.
            </p>
          </div>
          <figure className="relative">
            <img
              src={marioVhs}
              alt="Uczestnicy surf campu VHS ułożeni w znak VHS na plaży"
              width={1973}
              height={1315}
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-warm"
            />
          </figure>
        </section>

        <section
          className="border-y border-border bg-secondary/50"
          aria-labelledby="about-founder-heading"
        >
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-16">
            <figure className="overflow-hidden rounded-3xl shadow-warm">
              <img
                src={marioSkate}
                alt="Mariusz podczas jazdy na deskorolce na miejskim skateparku"
                width={4398}
                height={6597}
                className="aspect-[4/5] w-full object-cover object-center"
              />
            </figure>
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Za sterami VHS
              </p>
              <h2 id="about-founder-heading" className="mt-3 text-4xl leading-[0.92] sm:text-6xl">
                POZNAJ MARIUSZA
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-foreground">
                Mariusz Wójt — całe życie na desce, całe życie na zajawie.
              </p>
              <p className="mt-4 max-w-prose leading-relaxed text-muted-foreground">
                Certyfikowany instruktor snowboardu i surfingu, organizator wyjazdów oraz eventów,
                specjalista od wszystkich desek i głównodowodzący VHS-em. Swoją eventową ścieżkę
                rozpoczął w Red Bullu i kontynuuje ją do dzisiaj.
              </p>
              <p className="mt-6 border-l-2 border-primary pl-4 text-base font-medium leading-relaxed text-foreground">
                W centrum zawsze są ludzie, progres i czas spędzony razem — reszta ma po prostu
                dobrze działać.
              </p>
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-6xl px-5 py-16 sm:py-24"
          aria-labelledby="about-activities-heading"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              VHS w ruchu
            </p>
            <h2
              id="about-activities-heading"
              className="mt-3 text-4xl leading-[0.92] text-balance sm:text-6xl"
            >
              OD MIASTA PO GÓRY
            </h2>
            <p className="mt-5 max-w-prose text-lg leading-relaxed text-muted-foreground">
              Zmieniają się miejsca i warunki. Ta sama zostaje potrzeba ruchu, dobrego towarzystwa i
              kolejnego dnia na desce.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:grid-rows-2 md:gap-6">
            <figure className="order-first overflow-hidden rounded-3xl shadow-warm md:row-span-2">
              <img
                src={marioSnow}
                alt="Snowboardzista w locie nad śnieżnym skokiem"
                width={1365}
                height={2048}
                className="aspect-[3/4] w-full object-cover md:h-full md:aspect-auto"
              />
            </figure>
            <figure className="overflow-hidden rounded-3xl shadow-warm">
              <img
                src={marioSkim}
                alt="Mobilny tor skimboardowy VHS przygotowany do aktywności na świeżym powietrzu"
                width={5331}
                height={3000}
                className="aspect-[16/8] w-full object-cover"
              />
            </figure>
            <figure className="overflow-hidden rounded-3xl shadow-warm">
              <img
                src={marioTrip}
                alt="Mariusz w koszulce VHS podczas surfowego wyjazdu"
                width={5331}
                height={3000}
                className="aspect-[16/8] w-full object-cover"
              />
            </figure>
          </div>
        </section>
        <FaqSection
          headingId="about-us-faq-heading"
          items={aboutUsFaqItems}
          headerLabel="VHS od kuchni"
        />
      </main>
      <PublicFooter />
    </div>
  );
}
