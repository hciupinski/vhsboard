import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function HomeContactCta() {
  return (
    <section
      className="bg-foreground py-16 text-background sm:py-24"
      aria-labelledby="home-contact-heading"
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Masz pytanie?
          </p>
          <h2 id="home-contact-heading" className="mt-3 text-4xl leading-[0.92] sm:text-6xl">
            GOTOWY NA COŚ POZA PLANEM?
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/80">
            Nie wiesz jeszcze, który kierunek jest dla Ciebie? Napisz do nas — pomożemy wybrać
            wyjazd, obóz albo aktywność na Twój event.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/kontakt">Napisz do nas</Link>
            </Button>
            <Link
              to="/wyjazdy"
              className="rounded-sm font-semibold text-background underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Zobacz wyjazdy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
