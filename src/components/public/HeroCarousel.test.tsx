import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HeroCarouselImage } from "./HeroCarousel";
import { HOME_CAROUSEL_IMAGES } from "@/lib/images/home-carousel";
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

const images: readonly HeroCarouselImage[] = [
  {
    path: "carousel/surf.jpg",
    src: "/surf.jpg",
  },
  {
    path: "carousel/snow.jpg",
    src: "/snow.jpg",
  },
];

const stubReducedMotion = (matches: boolean) => {
  const media = Object.assign(new EventTarget(), {
    matches,
    media: "(prefers-reduced-motion: reduce)",
  });
  vi.spyOn(media, "addEventListener");
  vi.spyOn(media, "removeEventListener");
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
  return media;
};
beforeEach(() => vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible"));

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

  it("advances every 5.5 seconds and clears autoplay on unmount", () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const setInterval = vi.spyOn(globalThis, "setInterval");
    const clearInterval = vi.spyOn(globalThis, "clearInterval");

    const { unmount } = render(<HeroCarousel images={images} />);

    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 5_500);
    expect(embla.api.scrollNext).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5_500);
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(1);

    unmount();
    expect(clearInterval).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5_500);
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(1);
  });

  it("pairs each homepage desktop scene with its matching portrait crop", () => {
    stubReducedMotion(false);
    render(<HeroCarousel images={HOME_CAROUSEL_IMAGES} />);
    const scenes = ["1karuzela_snb", "2karuzela_oboz", "3karuzela_surf", "4karuzela_skim"];
    const slides = screen.getAllByTestId("hero-carousel-slide");
    expect(slides).toHaveLength(4);
    slides.forEach((slide, index) => {
      const sources = slide.closest("picture")?.querySelectorAll("source");
      expect(sources).toHaveLength(4);
      expect(sources?.[0]).toHaveAttribute("media", "(width < 1024px) and (orientation: portrait)");
      expect(sources?.[0]?.getAttribute("sizes")).toMatch(/^max\(100vw, \d+svh\)$/);
      expect(sources?.[0]?.getAttribute("srcset")).toContain(`${scenes[index]}_mobile_cut`);
      expect(sources?.[2]?.getAttribute("srcset")).toContain(scenes[index]);
      expect(slide).toHaveAttribute("loading", index === 0 ? "eager" : "lazy");
      expect(slide).toHaveAttribute("fetchpriority", index === 0 ? "high" : "auto");
    });
  });

  it("does not schedule autoplay for reduced-motion users", () => {
    stubReducedMotion(true);
    const setInterval = vi.spyOn(globalThis, "setInterval");

    render(<HeroCarousel images={images} />);

    expect(setInterval).not.toHaveBeenCalled();
  });

  it("stops and resumes a single timer when motion preference changes", () => {
    vi.useFakeTimers();
    const media = stubReducedMotion(false);
    render(<HeroCarousel images={images} />);
    vi.advanceTimersByTime(5500);
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(1);
    media.matches = true;
    media.dispatchEvent(new Event("change"));
    vi.advanceTimersByTime(11000);
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(1);
    media.matches = false;
    media.dispatchEvent(new Event("change"));
    media.dispatchEvent(new Event("change"));
    vi.advanceTimersByTime(11000);
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(1);
  });
  it("can start after initially reduced motion is disabled", () => {
    vi.useFakeTimers();
    const media = stubReducedMotion(true);
    render(<HeroCarousel images={images} />);
    media.matches = false;
    media.dispatchEvent(new Event("change"));
    vi.advanceTimersByTime(5500);
    expect(embla.api.scrollNext).toHaveBeenCalledOnce();
  });
  it("pauses in hidden documents and removes listeners on unmount", () => {
    vi.useFakeTimers();
    const media = stubReducedMotion(false);
    let visibility: DocumentVisibilityState = "hidden";
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
    const removeListener = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<HeroCarousel images={images} />);
    vi.advanceTimersByTime(5500);
    expect(embla.api.scrollNext).not.toHaveBeenCalled();
    visibility = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(5500);
    expect(embla.api.scrollNext).toHaveBeenCalledOnce();
    visibility = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(11000);
    expect(embla.api.scrollNext).toHaveBeenCalledOnce();
    visibility = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    media.dispatchEvent(new Event("change"));
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(5500);
    expect(embla.api.scrollNext).toHaveBeenCalledOnce();
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
