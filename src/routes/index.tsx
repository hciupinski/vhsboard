import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { OfferListState } from "@/components/offers/OfferListState";
import { publishedOffersQueryOptions } from "@/lib/offers/query-options";
import heroSurf from "@/assets/hero-surf.jpg";
import aboutCrew from "@/assets/about-crew.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VHSBOARD — Wyjazdy surfingowe i snowboardowe dla grup" },
      {
        name: "description",
        content:
          "Kameralne wyjazdy surfingowe i snowboardowe dla grup 10-20 osób. Dobre fale, głęboki puch, luźny klimat i ludzie, którzy zostają przyjaciółmi.",
      },
      { property: "og:title", content: "VHSBOARD — Wyjazdy surfingowe i snowboardowe dla grup" },
      {
        property: "og:description",
        content:
          "Wyjazdy na surf i snowboard dla ekip 10-20 osób. Sport, zachody słońca i ogniska, organizowane przez jeżdżących.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const values = [
  {
    title: "Jeździmy, nie sprzedajemy",
    text: "Rezerwujemy wyjazdy, na których sami chcemy być. Jeśli sami byśmy nie pojechali, nie ma tego na liście.",
  },
  {
    title: "Małe ekipy",
    text: "Od 10 do 20 osób. Wystarczy na dobrą energię, mało na tyle, żeby każdy znał twoje imię.",
  },
  {
    title: "Każdy poziom mile widziany",
    text: "Pierwszy raz i stare wygi jadą tym samym busem. Szkolenie w cenie, ego nie.",
  },
  {
    title: "Nic nie musisz organizować",
    text: "Noclegi, transfery, sprzęt, przewodnicy, jedzenie. Ty bierzesz chęci i paszport.",
  },
];

function Index() {
  const {
    data: offers = [],
    isPending,
    isError,
    refetch,
  } = useQuery(publishedOffersQueryOptions());

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#top" className="text-foreground">
            <Brand />
          </a>
          <div className="hidden gap-7 text-sm font-medium text-muted-foreground sm:flex">
            <a href="#about" className="transition-colors hover:text-primary">
              O nas
            </a>
            <a href="#offers" className="transition-colors hover:text-primary">
              Oferty
            </a>
            <a href="#contact" className="transition-colors hover:text-primary">
              Kontakt
            </a>
          </div>
          <Button asChild size="sm" className="rounded-full">
            <a href="#contact">Zaplanuj wyjazd</a>
          </Button>
        </nav>
      </header>

      <main id="top">
        {/* Hero */}
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
              Surf · Snowboard · Wyjazdy grupowe
            </p>
            <h1 className="max-w-3xl text-5xl leading-[0.95] text-background sm:text-7xl">
              Wyjazdy zbudowane wokół fal, puchu i ludzi, których poznajesz po drodze
            </h1>
            <p className="mt-5 max-w-xl text-base text-background/85 sm:text-lg">
              Zabieramy ekipy od 10 do 20 osób w dobre miejsca, ogarniamy każdy szczegół i
              zostawiamy sporo miejsca na to, czego nie da się zaplanować — zwykle to najlepsza
              część.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full shadow-warm">
                <a href="#offers">Zobacz wyjazdy</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-background/60 bg-transparent text-background hover:bg-background hover:text-foreground"
              >
                <a href="#contact">Przyjedź z własną ekipą</a>
              </Button>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">O nas</p>
              <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">
                Mała agencja prowadzona przez ludzi, którzy wolą być na zewnątrz
              </h2>
              <p className="mt-5 text-muted-foreground">
                VHSBOARD zaczęło się od jednego wynajętego busa, szóstki znajomych i bardzo
                optymistycznej prognozy falowania. Dziesięć lat później robimy dokładnie to samo —
                tylko z lepszą kawą, porządnymi przewodnikami i wyjazdami, które faktycznie trzymają
                się planu.
              </p>
              <p className="mt-4 text-muted-foreground">
                Nie robimy resortów, wycieczek autokarowych ani planów dnia, które trzeba przetrwać.
                Robimy poranne sesje, wspólne posiłki, ogniska i taką grupę, w której po drugim dniu
                nikt nie jest obcy.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {values.map((v) => (
                  <div key={v.title} className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="text-xl">{v.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{v.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src={aboutCrew}
                alt="Ekipa śmiejąca się przy ognisku obok kampera o zmierzchu"
                loading="lazy"
                width={1200}
                height={900}
                className="w-full rounded-3xl object-cover shadow-warm"
              />
              <div className="absolute -bottom-6 left-6 rounded-2xl bg-sunset-gradient px-6 py-4 text-primary-foreground shadow-warm">
                <p className="font-display text-3xl leading-none">120+</p>
                <p className="text-xs uppercase tracking-widest">wyjazdów od 2016 roku</p>
              </div>
            </div>
          </div>
        </section>

        {/* Offers */}
        <section id="offers" className="bg-secondary/60 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Oferty</p>
            <h2 className="mt-3 max-w-xl text-4xl leading-tight sm:text-5xl">
              Wybierz sezon, resztą zajmiemy się my
            </h2>
            <OfferListState
              offers={offers}
              isPending={isPending}
              isError={isError}
              onRetry={() => void refetch()}
            />
            <p className="mt-8 text-sm text-muted-foreground">
              Masz własną ekipę, klub albo drużynę? Budujemy prywatne wyjazdy od zera — napisz nam
              terminy i klimat.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="overflow-hidden rounded-3xl bg-sunset-gradient p-8 text-primary-foreground shadow-warm sm:p-12">
            <div className="max-w-2xl">
              <h2 className="text-4xl leading-tight sm:text-5xl">
                Napisz do nas, odpowiadamy szybko
              </h2>
              <p className="mt-4 text-primary-foreground/90">
                Masz własną ekipę, klub albo drużynę? Daj znać, jaki termin i klimat macie w głowie.
                Wrócimy z konkretną odpowiedzią.
              </p>
              <div className="mt-8 space-y-2 text-primary-foreground/95">
                <p>
                  <span className="font-semibold">E-mail</span> ·{" "}
                  <a href="mailto:czesc@vhsboard.pl" className="underline-offset-4 hover:underline">
                    czesc@vhsboard.pl
                  </a>
                </p>
                <p>
                  <span className="font-semibold">WhatsApp</span> ·{" "}
                  <a href="tel:+48512448010" className="underline-offset-4 hover:underline">
                    +48 512 448 010
                  </a>
                </p>
                <p>
                  <span className="font-semibold">Baza</span> · ul. Nadmorska 14, Gdynia
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <Brand className="text-foreground" />
          <p>© 2026 · Robione między falami a opadami śniegu.</p>
        </div>
      </footer>
    </div>
  );
}
