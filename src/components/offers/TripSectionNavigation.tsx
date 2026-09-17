import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type OfferSection = { id: string; label: string };

export function TripSectionNavigation({
  sections,
  ariaLabel = "Sekcje wyjazdu",
}: {
  sections: readonly OfferSection[];
  ariaLabel?: string;
}) {
  const navigationRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const initialHashAligned = useRef(false);
  const [activeId, setActiveId] = useState<string | undefined>(sections[0]?.id);

  useEffect(() => {
    const navigation = navigationRef.current;
    const page = navigation?.closest<HTMLElement>("[data-trip-detail]");
    const firstSection = sections[0];
    const lastSection = sections.at(-1);
    if (!navigation || !page || !firstSection || !lastSection) return;

    const header = page.querySelector<HTMLElement>("[data-public-header]");
    let readingOffset = 0;
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      let current = firstSection.id;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= readingOffset + 24) {
          current = section.id;
        }
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        current = lastSection.id;
      }
      setActiveId(current);
    };

    const measure = () => {
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const navigationHeight = navigation.getBoundingClientRect().height;
      page.style.setProperty("--trip-header-height", `${headerHeight}px`);
      page.style.setProperty("--trip-nav-height", `${navigationHeight}px`);
      readingOffset = headerHeight + navigationHeight;
      updateActiveSection();
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };

    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (header) observer?.observe(header);
    observer?.observe(navigation);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("hashchange", scheduleUpdate);

    // Fonts can reflow the long description after the browser restores a hash.
    // Align once after that layout settles, unless the visitor has started navigating.
    let disposed = false;
    let alignmentFrame = 0;
    const initialHash = window.location.hash;
    const hashSection = sections.find(({ id }) => `#${id}` === initialHash);
    const cancelInitialAlignment = () => {
      initialHashAligned.current = true;
    };
    const inputEvents = ["pointerdown", "touchstart", "wheel", "keydown"] as const;
    const removeInputListeners = () => {
      for (const event of inputEvents) window.removeEventListener(event, cancelInitialAlignment);
    };
    if (!hashSection) initialHashAligned.current = true;
    if (hashSection && !initialHashAligned.current) {
      for (const event of inputEvents) {
        window.addEventListener(event, cancelInitialAlignment, { passive: true });
      }
      void (document.fonts?.ready ?? Promise.resolve()).then(() => {
        if (disposed || initialHashAligned.current) return;
        alignmentFrame = window.requestAnimationFrame(() => {
          if (disposed || initialHashAligned.current || window.location.hash !== initialHash)
            return;
          const target = document.getElementById(hashSection.id);
          measure();
          target?.scrollIntoView({ behavior: "instant", block: "start" });
          target?.focus({ preventScroll: true });
          updateActiveSection();
          initialHashAligned.current = true;
          removeInputListeners();
        });
      });
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(alignmentFrame);
      removeInputListeners();
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", measure);
      window.removeEventListener("hashchange", scheduleUpdate);
      page.style.removeProperty("--trip-header-height");
      page.style.removeProperty("--trip-nav-height");
    };
  }, [sections]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const revealActiveLink = () => {
      const link = scroller.querySelector<HTMLElement>('[aria-current="location"]');
      if (!link) return;
      const bounds = scroller.getBoundingClientRect();
      const linkBounds = link.getBoundingClientRect();
      // Reveal only the horizontal row: scrollIntoView would also move the page.
      if (linkBounds.left < bounds.left + 20) {
        scroller.scrollLeft += linkBounds.left - bounds.left - 20;
      } else if (linkBounds.right > bounds.right - 20) {
        scroller.scrollLeft += linkBounds.right - bounds.right + 20;
      }
    };
    revealActiveLink();
    window.addEventListener("resize", revealActiveLink);
    return () => window.removeEventListener("resize", revealActiveLink);
  }, [activeId]);

  if (sections.length === 0) return null;

  return (
    <nav
      ref={navigationRef}
      aria-label={ariaLabel}
      className="sticky top-[var(--trip-header-height,61px)] z-40 border-b border-border bg-background/95 backdrop-blur"
    >
      <div
        ref={scrollerRef}
        className="mx-auto flex max-w-6xl gap-2 overflow-x-auto overscroll-x-contain px-5 py-2 [scrollbar-width:thin]"
      >
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={activeId === id ? "location" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              activeId === id
                ? "bg-secondary text-foreground underline decoration-primary decoration-2 underline-offset-4"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
