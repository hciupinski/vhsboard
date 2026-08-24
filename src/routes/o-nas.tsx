import { createFileRoute } from "@tanstack/react-router";

import aboutCrew from "@/assets/about-crew.jpg";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";

export const Route = createFileRoute("/o-nas")({
  head: () => ({
    meta: [
      { title: "O VHSBOARD" },
      {
        name: "description",
        content: "Poznaj VHSBOARD — ludzi i aktywności, które stoją za naszymi wyjazdami.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">O nas</p>
            <h1 className="mt-3 text-5xl leading-[0.95] sm:text-7xl">Ruch, wyjazdy i ludzie</h1>
            <p className="mt-6 text-lg text-muted-foreground">
              VHSBOARD tworzy wyjazdy i aktywności dla osób, które chcą spędzać czas w dobrym ruchu
              i dobrym towarzystwie.
            </p>
            <p className="mt-4 text-muted-foreground">
              Nasze doświadczenie wyrasta z surfingu, snowboardingu i deskorolki oraz z działań
              wokół sportów deskowych. Dzisiaj skupiamy się na wyjazdach, eventach z torem
              skimboardowym oraz półkoloniach.
            </p>
          </div>
          <img
            src={aboutCrew}
            alt="Grupa znajomych odpoczywająca przy ognisku po dniu aktywności"
            width={1200}
            height={900}
            className="w-full rounded-3xl object-cover shadow-warm"
          />
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
