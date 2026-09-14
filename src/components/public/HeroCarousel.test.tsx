import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PortalCarouselImage } from "@/lib/portal-carousel/types";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { HeroCarousel } from "./HeroCarousel";

const embla = vi.hoisted(() => {
  const api = {
    canScrollNext: vi.fn(() => true),
    canScrollPrev: vi.fn(() => true),
    off: vi.fn(),
    on: vi.fn(),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
  };

  return {
    api,
    useEmblaCarousel: vi.fn(() => [vi.fn(), api]),
  };
});

vi.mock("embla-carousel-react", () => ({
  default: embla.useEmblaCarousel,
}));

const images: readonly PortalCarouselImage[] = [
  {
    path: "carousel/surf.jpg",
    src: "/surf.jpg",
    label: "surf",
  },
  {
    path: "carousel/snow.jpg",
    src: "/snow.jpg",
    label: "snow",
  },
];

const stubReducedMotion = (matches: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  embla.useEmblaCarousel.mockClear();
  embla.api.scrollNext.mockClear();
  embla.api.scrollPrev.mockClear();
});

describe("HeroCarousel", () => {
  it("renders decorative slides without visitor navigation", () => {
    stubReducedMotion(false);

    render(<HeroCarousel images={images} />);

    const slides = screen.getAllByTestId("hero-carousel-slide");
    expect(slides).toHaveLength(2);
    slides.forEach((slide) => expect(slide).toHaveAttribute("alt", ""));
    expect(
      screen.queryByRole("button", { name: /poprzed|następ|wstrzymaj/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-carousel")).not.toHaveAttribute("tabindex");
  });

  it("advances every seven seconds and clears autoplay on unmount", () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const setInterval = vi.spyOn(globalThis, "setInterval");
    const clearInterval = vi.spyOn(globalThis, "clearInterval");

    const { unmount } = render(<HeroCarousel images={images} />);

    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 7_000);
    expect(embla.api.scrollNext).not.toHaveBeenCalled();
    vi.advanceTimersByTime(7_000);
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(1);

    unmount();
    expect(clearInterval).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(7_000);
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(1);
  });

  it("does not schedule autoplay for reduced-motion users", () => {
    stubReducedMotion(true);
    const setInterval = vi.spyOn(globalThis, "setInterval");

    render(<HeroCarousel images={images} />);

    expect(setInterval).not.toHaveBeenCalled();
  });

  it("does not schedule autoplay for a single slide", () => {
    stubReducedMotion(false);
    const setInterval = vi.spyOn(globalThis, "setInterval");

    render(<HeroCarousel images={images.slice(0, 1)} />);

    expect(setInterval).not.toHaveBeenCalled();
  });
});

describe("Carousel interaction mode", () => {
  it("disables drag and ignores arrow keys from a focusable child when non-interactive", () => {
    render(
      <Carousel interactive={false}>
        <CarouselContent>
          <CarouselItem>
            <button type="button">Focusable child</button>
          </CarouselItem>
        </CarouselContent>
      </Carousel>,
    );

    expect(embla.useEmblaCarousel).toHaveBeenCalledWith(
      expect.objectContaining({ axis: "x", watchDrag: false }),
      undefined,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Focusable child" }), {
      key: "ArrowRight",
    });

    expect(embla.api.scrollNext).not.toHaveBeenCalled();
  });

  it("keeps keyboard navigation enabled by default", () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>
            <button type="button">Focusable child</button>
          </CarouselItem>
        </CarouselContent>
      </Carousel>,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Focusable child" }), {
      key: "ArrowRight",
    });

    expect(embla.api.scrollNext).toHaveBeenCalledTimes(1);
  });
});
