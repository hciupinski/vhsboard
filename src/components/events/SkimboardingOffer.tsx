import { ResponsiveImage } from "@/components/public/ResponsiveImage";
import { getLocalImage } from "@/lib/images/responsive";

const trackImage = getLocalImage("skim-tor.jpg");

export function SkimboardingOffer() {
  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden bg-foreground text-background">
        <ResponsiveImage
          image={trackImage}
          alt="Uczestnik na mobilnym torze skimboardowym podczas eventu"
          sizes="100vw"
          className="absolute inset-0 -z-10 size-full object-cover brightness-[0.4]"
        />
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest">Skimboarding</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-none sm:text-7xl">
            Tor skimboardowy — wynajem na eventy w całej Polsce
          </h1>
          <p className="mt-6 max-w-2xl text-lg">
            Mobilny tor skimboardowy to wodna atrakcja dla uczestników od 6 lat po dorosłych.
            Przywozimy, montujemy i prowadzimy całość z instruktorami.
          </p>
          <a
            href="/kontakt"
            className="mt-8 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Napisz do nas
          </a>
        </div>
      </section>
      <div className="mx-auto max-w-5xl space-y-14 px-5 py-14">
        <section id="dlaczego-skim">
          <h2 className="text-4xl">Czym jest skimboarding?</h2>
          <p className="mt-4 text-lg leading-relaxed">
            Skimboarding to ślizganie się na desce po płytkiej tafli wody. Na mobilnym torze można
            nauczyć się pierwszych ślizgów pod opieką instruktorów. Dmuchane bandy i antypoślizgowe
            dno pomagają korzystać z atrakcji.
          </p>
        </section>
        <section>
          <h2 className="text-4xl">Atrakcja na każdy event</h2>
          <p className="mt-4 text-lg leading-relaxed">
            Tor sprawdzi się na integracjach firmowych, piknikach rodzinnych, dniach miasta, w
            galeriach handlowych, na obozach, wydarzeniach sportowych, juwenaliach i targach.
          </p>
        </section>
        <section id="wypozycz-tor">
          <h2 className="text-4xl">Dostępne tory</h2>
          <p className="mt-4 text-lg leading-relaxed">
            Dysponujemy mobilnymi torami o długości 15, 20 i 30 metrów oraz torem stacjonarnym o
            dowolnym rozmiarze. Tor 30-metrowy sprawdzi się na dużych eventach, pokazach i zawodach;
            20-metrowy na jednodniowych eventach, a 15-metrowy nie wymaga dużego terenu.
          </p>
        </section>
        <section id="zorganizuj-event">
          <h2 className="text-4xl">Jak organizujemy event?</h2>
          <p className="mt-4 text-lg leading-relaxed">
            Poznajemy potrzeby klienta, sprawdzamy i mierzymy teren, ustalamy kwestie techniczne,
            przygotowujemy strefę oraz zapewniamy montaż i demontaż. Strefa jest gotowa 1–2 godziny
            przed startem imprezy. Przed startem prowadzimy szkolenie teoretyczne; zależnie od
            wariantu organizujemy szkółkę, pokazy lub zawody.
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            Dostępne są trzy warianty wynajmu: podstawowy, standard i premium. Skontaktuj się z
            nami, aby ustalić zakres usługi.
          </p>
        </section>
        <section id="nasze-imprezy">
          <h2 className="text-4xl">Nasze imprezy</h2>
          <p className="mt-4 text-lg leading-relaxed">
            Organizowaliśmy strefy i wydarzenia m.in. podczas Dni Torunia, Ironman Gdynia, Red Bull
            Skim It oraz w Silesia City Center. Dojeżdżamy na eventy w całej Polsce.
          </p>
        </section>
      </div>
    </main>
  );
}
