import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { PublicOffer } from "@/lib/offers/types";
import { cn } from "@/lib/utils";
import { HomeOfferCard } from "./HomeOfferCard";

export function HomeOffersList({ offers }: { offers: PublicOffer[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const isCarousel = offers.length > 3;

  useEffect(() => {
    const list = listRef.current;
    if (!list || !isCarousel) return;
    const measure = () => {
      if (list.scrollWidth <= list.clientWidth) list.scrollLeft = 0;
      setEdges({
        start: list.scrollLeft <= 1,
        end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 1,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    list.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", measure);
    };
  }, [isCarousel, offers]);

  const scroll = (direction: 1 | -1, instant: boolean) => {
    const list = listRef.current;
    const card = list?.firstElementChild;
    if (!list || !card) return;
    list.scrollBy({
      left: direction * (card.getBoundingClientRect().width + 24),
      behavior:
        instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
    });
  };

  return (
    <div className="mt-10">
      {isCarousel && (
        <div className="mb-4 hidden justify-end gap-2 lg:flex">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 rounded-full"
            aria-label="Pokaż poprzednie oferty"
            disabled={edges.start}
            onClick={(event) => scroll(-1, event.detail === 0)}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="size-11 rounded-full"
            aria-label="Pokaż następne oferty"
            disabled={edges.end}
            onClick={(event) => scroll(1, event.detail === 0)}
          >
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      )}
      <ul
        ref={listRef}
        aria-label="Najbliższe wyjazdy i obozy"
        className={cn(
          "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
          isCarousel &&
            "lg:flex lg:snap-x lg:snap-mandatory lg:overflow-x-auto lg:overscroll-x-contain lg:pb-3",
        )}
        onFocusCapture={(event) => {
          const list = listRef.current;
          const card = event.target.closest("li");
          if (!isCarousel || !list || !card || list.scrollWidth <= list.clientWidth) return;
          const bounds = list.getBoundingClientRect();
          const target = card.getBoundingClientRect();
          if (target.left < bounds.left) list.scrollLeft += target.left - bounds.left;
          else if (target.right > bounds.right) list.scrollLeft += target.right - bounds.right;
        }}
      >
        {offers.map((offer) => (
          <li
            key={offer.id}
            className={cn(
              "min-w-0",
              isCarousel && "lg:shrink-0 lg:grow-0 lg:basis-[calc((100%-3rem)/3)] lg:snap-start",
            )}
          >
            <HomeOfferCard offer={offer} />
          </li>
        ))}
      </ul>
    </div>
  );
}
