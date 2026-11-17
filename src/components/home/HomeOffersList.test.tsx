import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeOffersList } from "./HomeOffersList";
import type { PublicOffer } from "@/lib/offers/types";
import { tripOffer } from "@/test/offer-fixtures";
vi.mock("./HomeOfferCard", () => ({
  HomeOfferCard: ({ offer }: { offer: PublicOffer }) => (
    <a href={`/wyjazdy/${offer.slug}`}>{offer.title}</a>
  ),
}));
describe("HomeOffersList", () => {
  it("shows six offers in a responsive grid without carousel controls", () => {
    const offers = Array.from({ length: 6 }, (_, i) => ({
      ...tripOffer,
      id: `${i}`,
      slug: `trip-${i}`,
    }));
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    render(<HomeOffersList offers={offers} />);
    expect(screen.getAllByRole("link")).toHaveLength(6);
    expect(screen.getByRole("list")).toHaveClass("grid", "md:grid-cols-2", "lg:grid-cols-3");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
