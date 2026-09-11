import { ArrowLeft, ArrowRight, MoveHorizontal } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

type EventUseCasesScrollerProps = {
  items: readonly string[];
};

export function EventUseCasesScroller({ items }: EventUseCasesScrollerProps) {
  const listRef = useRef<HTMLUListElement>(null);

  const scroll = (direction: 1 | -1) => {
    listRef.current?.scrollBy({
      left: direction * listRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  const cardStyles = [
    "border-foreground bg-foreground text-background",
    "border-primary/30 bg-primary text-primary-foreground",
    "border-border bg-card text-foreground",
  ];

  return (
    <div className="relative mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p
          id="event-use-case-scroll-hint"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
        >
          <MoveHorizontal aria-hidden="true" className="size-4 text-primary" />
          Przesuń w bok, żeby zobaczyć więcej
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-background"
            aria-label="Pokaż poprzednie zastosowania"
            onClick={() => scroll(-1)}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="rounded-full"
            aria-label="Pokaż następne zastosowania"
            onClick={() => scroll(1)}
          >
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
      <ul
        ref={listRef}
        aria-label="Zastosowania toru skimboardowego"
        aria-describedby="event-use-case-scroll-hint"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pr-16 outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        {items.map((item, index) => (
          <li
            key={item}
            className={`min-w-[min(82vw,22rem)] snap-start rounded-3xl border p-6 shadow-warm sm:min-w-80 sm:p-7 ${cardStyles[index % cardStyles.length]}`}
          >
            <span className="text-xs font-semibold tracking-[0.22em] opacity-70">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-12 text-2xl leading-tight sm:text-3xl">{item}</p>
          </li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[calc(100%-3.5rem)] w-20 bg-gradient-to-l from-background via-background/80 to-transparent"
      />
    </div>
  );
}
