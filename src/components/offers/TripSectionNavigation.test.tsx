import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TripSectionNavigation } from "./TripSectionNavigation";
import { tripSections } from "@/lib/offers/trip-sections";

let headerHeight = 61;
let sectionTops: Record<string, number>;
let resize: () => void;

beforeEach(() => {
  vi.useFakeTimers();
  headerHeight = 61;
  sectionTops = { "o-wyjezdzie": 300, program: 600, "plan-wyjazdu": 900 };
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(0), 1),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    return {
      top: sectionTops[this.id] ?? 0,
      height: this.hasAttribute("data-public-header") ? headerHeight : 60,
      bottom: (sectionTops[this.id] ?? 0) + 60,
      left: 0,
      right: 600,
      width: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  });
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(3000);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
  Reflect.deleteProperty(document, "fonts");
});

function renderNavigation() {
  return render(
    <div data-trip-detail>
      <header data-public-header />
      <TripSectionNavigation sections={tripSections.slice(0, 3)} />
      {tripSections.slice(0, 3).map((section) => (
        <section key={section.id} id={section.id} tabIndex={-1} />
      ))}
    </div>,
  );
}

describe("TripSectionNavigation", () => {
  it("aligns a direct hash link after fonts settle and focuses its section", async () => {
    let finishFonts!: () => void;
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: {
        ready: new Promise<void>((resolve) => {
          finishFonts = resolve;
        }),
      },
    });
    window.history.replaceState(null, "", "/#program");
    renderNavigation();
    const target = document.getElementById("program")!;
    target.scrollIntoView = () => {
      sectionTops["program"] = 138;
    };
    await act(async () => {
      finishFonts();
    });
    act(() => vi.advanceTimersByTime(10));
    expect(target).toHaveFocus();
    expect(screen.getByRole("link", { name: "W programie" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("does not jump back to the hash after the visitor starts scrolling", async () => {
    let finishFonts!: () => void;
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: {
        ready: new Promise<void>((resolve) => {
          finishFonts = resolve;
        }),
      },
    });
    window.history.replaceState(null, "", "/#program");
    renderNavigation();
    const target = document.getElementById("program")!;
    target.scrollIntoView = () => {
      sectionTops["program"] = 138;
    };
    fireEvent.wheel(window);
    await act(async () => {
      finishFonts();
    });
    act(() => vi.advanceTimersByTime(10));
    expect(target).not.toHaveFocus();
    expect(target.getBoundingClientRect().top).toBe(600);
  });

  it("marks the section at the reading position while scrolling down and back up", () => {
    renderNavigation();
    expect(screen.getByRole("link", { name: "O wyjeździe" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    sectionTops = { "o-wyjezdzie": -400, program: 130, "plan-wyjazdu": 500 };
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(10));
    expect(screen.getByRole("link", { name: "W programie" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(screen.getByRole("link", { name: "O wyjeździe" })).not.toHaveAttribute("aria-current");
    sectionTops = { "o-wyjezdzie": 130, program: 600, "plan-wyjazdu": 900 };
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(10));
    expect(screen.getByRole("link", { name: "O wyjeździe" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("updates sticky offsets when the main header changes height", () => {
    const { container } = renderNavigation();
    const page = container.querySelector<HTMLElement>("[data-trip-detail]")!;
    expect(page.style.getPropertyValue("--trip-header-height")).toBe("61px");
    expect(page.style.getPropertyValue("--trip-nav-height")).toBe("60px");
    headerHeight = 100;
    act(() => resize());
    expect(page.style.getPropertyValue("--trip-header-height")).toBe("100px");
  });

  it("marks the last section at the bottom even when it cannot reach the reading position", () => {
    renderNavigation();
    vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(window.innerHeight);
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(10));
    expect(screen.getByRole("link", { name: "Plan wyjazdu" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("reveals the active link within its row when the viewport narrows", () => {
    renderNavigation();
    const link = screen.getByRole("link", { name: "O wyjeździe" });
    const scroller = link.parentElement!;
    const bounds = scroller.getBoundingClientRect();
    scroller.getBoundingClientRect = () => ({ ...bounds, right: 200, width: 200 });
    link.getBoundingClientRect = () => ({ ...bounds, left: 150, right: 260, width: 110 });
    scroller.scrollLeft = 0;
    fireEvent(window, new Event("resize"));
    expect(scroller.scrollLeft).toBe(80);
  });
});
