import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EventsComingSoon() {
  return (
    <main className="fixed inset-x-0 bottom-0 top-[calc(73px+var(--development-banner-height,0px))] z-40 grid overflow-y-auto bg-foreground/55 px-5 py-6">
      <section
        aria-labelledby="events-coming-soon-title"
        className="m-auto w-full max-w-lg rounded-3xl border border-border bg-background/95 px-6 py-7 text-center shadow-2xl backdrop-blur-md sm:px-10 sm:py-9"
      >
        <div
          className="events-coming-soon-art relative mx-auto mb-2 h-36 w-40 text-primary"
          aria-hidden="true"
        >
          <div className="absolute left-6 top-0 size-28 rounded-full border border-primary/15 bg-primary/10" />
          <img
            src="/logo-80.png"
            alt=""
            width={80}
            height={80}
            className="events-coming-soon-logo absolute left-10 top-4 size-20 object-contain"
          />
          <svg
            className="events-coming-soon-board absolute left-8 top-[102px] h-5 w-24"
            viewBox="0 0 100 20"
            fill="none"
          >
            <ellipse
              cx="50"
              cy="10"
              rx="43"
              ry="5"
              transform="rotate(-7 50 10)"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
          <span className="events-coming-soon-snow absolute left-2 top-6 text-sm">✦</span>
          <span className="events-coming-soon-snow absolute right-2 top-12 text-sm [animation-delay:600ms]">
            ✳
          </span>
          <span className="events-coming-soon-snow absolute left-5 top-24 text-xs [animation-delay:1100ms]">
            ✦
          </span>
          <span className="events-coming-soon-snow absolute right-5 top-2 text-sm [animation-delay:1800ms]">
            ✳
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Eventy VHSBOARD
        </p>
        <h1 id="events-coming-soon-title" className="mt-3 text-4xl leading-[0.95] sm:text-5xl">
          Szykujemy coś dobrego
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
          Pracujemy nad nową odsłoną naszych eventów. Wkrótce wrócimy z całą energią!
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="rounded-full">
            <Link to="/wyjazdy">
              Zobacz wyjazdy <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/kontakt">Zapytaj o event</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
