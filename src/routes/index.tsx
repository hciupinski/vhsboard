import { createFileRoute, Link } from "@tanstack/react-router";

import heroSurf from "@/assets/hero-surf.jpg";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VHSBOARD — wyjazdy, eventy i półkolonie" },
      {
        name: "description",
        content: "VHSBOARD organizuje wyjazdy, eventy z torem skimboardowym i półkolonie.",
      },
      { property: "og:title", content: "VHSBOARD — wyjazdy, eventy i półkolonie" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const entryPoints = [
  {
    to: "/wyjazdy",
    title: "Wyjazdy",
    text: "Zobacz aktualne wyjazdy organizowane przez VHSBOARD.",
    action: "Zobacz wyjazdy",
  },
  {
    to: "/eventy",
    title: "Eventy",
    text: "Sprawdź, jak może wyglądać event z mobilnym torem skimboardowym.",
    action: "Poznaj eventy",
  },
  {
    to: "/polkolonie",
    title: "Półkolonie",
    text: "Dowiedz się więcej o sezonowych programach aktywnych dla dzieci.",
    action: "Poznaj półkolonie",
  },
] as const;

function HomePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
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
              Wyjazdy · Eventy · Półkolonie
            </p>
            <h1 className="max-w-3xl text-5xl leading-[0.95] text-background sm:text-7xl">
              Dobre rzeczy dzieją się poza codziennym planem
            </h1>
            <p className="mt-5 max-w-xl text-base text-background/85 sm:text-lg">
              Tworzymy aktywności wokół sportów deskowych — od wyjazdów przez eventy po programy dla
              dzieci.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full shadow-warm">
              <Link to="/wyjazdy">Zobacz wyjazdy</Link>
            </Button>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <h2 className="text-4xl sm:text-5xl">Wybierz, od czego zaczynasz</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {entryPoints.map(({ to, title, text, action }) => (
              <article
                key={to}
                className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-warm"
              >
                <h3 className="text-3xl">{title}</h3>
                <p className="mt-3 flex-1 text-muted-foreground">{text}</p>
                <Button asChild variant="secondary" className="mt-6 w-full rounded-full">
                  <Link to={to}>{action}</Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
