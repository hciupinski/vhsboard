import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function OfferHighlights({ highlights }: { highlights: readonly string[] }) {
  if (highlights.length === 0) return null;

  return (
    <ul aria-label="Najważniejsze atrakcje" className="mt-6 grid gap-3 sm:grid-cols-2">
      {highlights.map((highlight, index) => {
        const featured = index === 0;

        return (
          <li
            key={index}
            className={cn(
              "relative isolate flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl p-3 sm:p-4",
              featured
                ? "min-h-18 bg-primary text-primary-foreground sm:col-span-2 sm:min-h-20 sm:p-4"
                : "border border-primary/20 bg-card text-card-foreground",
            )}
          >
            {featured ? (
              <Sparkles
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 -top-6 -z-10 size-32 rotate-12 text-primary-foreground/10"
                strokeWidth={1}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-xl",
                featured ? "bg-primary-foreground/15" : "bg-primary/10 text-primary",
              )}
            >
              <Sparkles className="size-4" strokeWidth={1.75} />
            </span>
            <p
              className={cn(
                "min-w-0 font-display leading-tight [overflow-wrap:anywhere]",
                featured ? "text-xl" : "text-lg",
              )}
            >
              {highlight}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
