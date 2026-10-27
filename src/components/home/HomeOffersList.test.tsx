import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeOffersList } from "./HomeOffersList";
import type { PublicOffer } from "@/lib/offers/types";
import { tripOffer } from "@/test/offer-fixtures";

vi.mock("./HomeOfferCard", () => ({
  HomeOfferCard: ({ offer }: { offer: PublicOffer }) => (
    <a href={`/wyjazdy/${offer.slug}`}>{offer.title}</a>
  ),
}));
const offers = Array.from({ length: 6 }, (_, i) => ({
  ...tripOffer,
  id: `${i}`,
  slug: `trip-${i}`,
  title: `Wyjazd ${i}`,
}));
let scrollLeft = 0;
let resize: () => void;
const scrollBy = vi.fn();
let reduced = false;
beforeEach(() => {
  scrollLeft = 0;
  reduced = false;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduced })),
  );
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
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1024);
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(2072);
  vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(() => scrollLeft);
  vi.spyOn(HTMLElement.prototype, "scrollLeft", "set").mockImplementation((value) => {
    scrollLeft = value;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 325.33,
    left: 0,
    right: 325.33,
  } as DOMRect);
  HTMLElement.prototype.scrollBy = scrollBy;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  scrollBy.mockClear();
});

describe("HomeOffersList", () => {
  it("keeps all six destinations reachable and disables controls at each end", () => {
    render(<HomeOffersList offers={offers} />);
    expect(screen.getAllByRole("link")).toHaveLength(6);
    const previous = screen.getByRole("button", { name: "Pokaż poprzednie oferty" });
    const next = screen.getByRole("button", { name: "Pokaż następne oferty" });
    expect(previous).toBeDisabled();
    fireEvent.click(next, { detail: 1 });
    expect(scrollBy).toHaveBeenCalledWith({ left: 349.33, behavior: "smooth" });
    scrollLeft = 1048;
    fireEvent.scroll(screen.getByRole("list"));
    expect(next).toBeDisabled();
    expect(previous).toBeEnabled();
    fireEvent.click(previous);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -349.33, behavior: "auto" });
    scrollLeft = 0;
    act(() => resize());
    expect(previous).toBeDisabled();
  });
  it("respects reduced motion for pointer activation", () => {
    reduced = true;
    render(<HomeOffersList offers={offers} />);
    fireEvent.click(screen.getByRole("button", { name: "Pokaż następne oferty" }), { detail: 1 });
    expect(scrollBy).toHaveBeenCalledWith({ left: 349.33, behavior: "auto" });
  });
  it.each([0, 1, 3])("shows %i offers without carousel controls", (count) => {
    render(<HomeOffersList offers={offers.slice(0, count)} />);
    expect(screen.queryAllByRole("link")).toHaveLength(count);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
