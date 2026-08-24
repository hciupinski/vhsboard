import { createFileRoute } from "@tanstack/react-router";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";

export const Route = createFileRoute("/polkolonie")({
  head: () => ({
    meta: [
      { title: "Półkolonie sportowe | VHSBOARD" },
      {
        name: "description",
        content: "Ogólne informacje o półkoloniach wakeowych i snowboardowych VHSBOARD.",
      },
    ],
  }),
  component: HalfDayCampsPage,
});

function HalfDayCampsPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-secondary/55 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Dla dzieci
            </p>
            <h1 className="mt-3 text-5xl leading-[0.95] sm:text-7xl">Półkolonie aktywnie</h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Organizujemy półkolonie, które dają dzieciom czas na ruch, naukę i bycie razem.
              Zależnie od sezonu skupiamy się na aktywnościach wakeowych albo snowboardowych.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Informacje o aktualnych ofertach</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Aktualne półkolonie pojawią się tutaj, gdy ogłosimy dany sezon. Ta strona opisuje ogólny
            charakter naszych programów; szczegóły konkretnych terminów będą publikowane osobno.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
