import { getHighlightIcon } from "@/lib/offers/highlight-icons";
import { cn } from "@/lib/utils";

export function OfferHighlights({
  highlights,
  icons,
}: {
  highlights: readonly string[];
  icons?: readonly string[] | undefined;
}) {
  if (highlights.length === 0) return null;

  return (
    <ul aria-label="Najważniejsze atrakcje" className="mt-6 grid gap-3 sm:grid-cols-2">
      {highlights.map((highlight, index) => {
        const featured = index === 0;
        const Icon = getHighlightIcon(icons?.[index]).icon;
        return (
          <li
            key={index}
            className={cn(
              "relative isolate flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-primary/20 bg-card p-3 text-card-foreground transition-colors hover:bg-primary/10 sm:p-4",
              featured && "min-h-18 sm:col-span-2 sm:min-h-20",
            )}
          >
            {Icon ? (
              <>
                <Icon
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-4 -top-6 -z-10 size-32 rotate-12 text-primary/10"
                  strokeWidth={1}
                />
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
              </>
            ) : null}
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
