import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/eventy")({
  head: () => ({
    meta: [
      { title: "Eventy z torem skimboardowym | VHSBOARD" },
      {
        name: "description",
        content: "Eventy z mobilnym torem skimboardowym organizowane przez VHSBOARD.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="bg-secondary/55 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Eventy</p>
            <h1 className="mt-3 text-5xl leading-[0.95] sm:text-7xl">
              Eventy z torem skimboardowym
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Mobilny tor skimboardowy jest pretekstem do ruchu, śmiechu i wspólnego kibicowania.
              Przygotowujemy go na wydarzenia firmowe, miejskie i plenerowe.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full">
              <Link to="/kontakt">Zapytaj o event</Link>
            </Button>
          </div>
        </section>
        <section className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Jak możemy pomóc</h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-3">
            {[
              ["Tor i obsługa", "Przywozimy tor, sprzęt oraz osoby prowadzące aktywność."],
              [
                "Format dla ludzi",
                "Dobieramy tempo i zasady do miejsca oraz charakteru wydarzenia.",
              ],
              [
                "Prosty start",
                "Napisz, kiedy i gdzie planujesz event — wrócimy z możliwym zakresem.",
              ],
            ].map(([title, description]) => (
              <article key={title} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
