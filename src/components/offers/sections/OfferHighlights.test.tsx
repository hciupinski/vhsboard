import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfferHighlights } from "./OfferHighlights";

describe("OfferHighlights", () => {
  it("renders each chosen icon, allows no icon, and falls back safely for legacy offers", () => {
    render(
      <OfferHighlights
        highlights={["Posiłek", "Zachód", "Odpoczynek", "Stara oferta"]}
        icons={["utensils", "sun", "none", "unknown"]}
      />,
    );
    const cards = within(screen.getByRole("list", { name: "Najważniejsze atrakcje" })).getAllByRole(
      "listitem",
    );
    expect(cards[0]!.querySelectorAll(".lucide-utensils")).toHaveLength(2);
    expect(cards[1]!.querySelectorAll(".lucide-sun")).toHaveLength(2);
    expect(cards[2]!.querySelector("svg")).toBeNull();
    expect(cards[3]!.querySelectorAll(".lucide-sparkles")).toHaveLength(2);
    expect(cards[0]).not.toHaveClass("bg-primary");
  });
});
