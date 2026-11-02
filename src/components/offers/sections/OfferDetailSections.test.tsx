import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OfferDetailSections } from "./OfferDetailSections";
import { sectionOffer } from "@/lib/offers/__fixtures__/sections";
import { getOfferSections } from "@/lib/offers/sections";

afterEach(cleanup);
describe("complete shared offer details", () => {
  it.each(["trip", "day_camp"] as const)(
    "renders %s in the canonical menu and H2 order",
    (kind) => {
      const offer = sectionOffer(kind);
      render(
        <OfferDetailSections offer={offer} sidebar={<a href={offer.bookingUrl}>Zapisz się</a>} />,
      );
      expect(screen.getAllByRole("heading", { level: 2 }).map((e) => e.textContent)).toEqual(
        getOfferSections(offer).map((s) => s.label),
      );
      const anchors =
        kind === "trip"
          ? ["plan-wyjazdu", "w-cenie"]
          : ["plan-dnia", "turnusy", "dla-rodzica", "w-cenie"];
      anchors.forEach((id) => expect(document.getElementById(id)).not.toBeNull());
      expect(screen.getByText("20 000 EUR")).toBeInTheDocument();
      expect(screen.getByText("Szczegóły rozszerzenia widoczne bez hover.")).toBeVisible();
      expect(
        screen
          .getAllByRole("link", { name: "Zapisz się" })
          .every((e) => e.getAttribute("href") === offer.bookingUrl),
      ).toBe(true);
    },
  );
  it("keeps legacy parent transport until the new section is enabled", () => {
    const offer = sectionOffer("day_camp");
    if (offer.offerKind !== "day_camp") throw new Error("expected camp");
    offer.content.parentInfo.transport = "Stary opis transportu dla rodzica";
    offer.content.transport!.enabled = false;
    const { rerender } = render(<OfferDetailSections offer={offer} sidebar={null} />);
    expect(screen.getByText("Stary opis transportu dla rodzica")).toBeVisible();
    offer.content.transport!.enabled = true;
    rerender(<OfferDetailSections offer={offer} sidebar={null} />);
    expect(screen.queryByText("Stary opis transportu dla rodzica")).not.toBeInTheDocument();
  });
  it("keeps optional sections hidden for every switch combination", () => {
    const keys = ["accommodation", "resort", "training", "transport", "insurance"] as const;
    for (let mask = 0; mask < 32; mask++) {
      const offer = sectionOffer();
      keys.forEach((key, i) => {
        offer.content[key]!.enabled = !!(mask & (1 << i));
      });
      const sections = getOfferSections(offer);
      keys.forEach((key, i) =>
        expect(sections.some((s) => s.editorTab === key)).toBe(!!(mask & (1 << i))),
      );
    }
  });
});
