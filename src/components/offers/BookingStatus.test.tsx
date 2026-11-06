import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { sectionOffer } from "@/lib/offers/__fixtures__/sections";
import { OfferFacts } from "./OfferFacts";
import { MobileTripBookingCta } from "./MobileTripBookingCta";
import { OfferDetailSections } from "./sections/OfferDetailSections";

afterEach(cleanup);
describe("registration availability", () => {
  it("renders native disabled controls for a started trip without an href", async () => {
    const offer = sectionOffer("trip");
    offer.startDate = "2000-01-01";
    offer.endDate = "2099-01-01";
    render(
      <>
        <OfferFacts offer={offer} />
        <MobileTripBookingCta bookingUrl={offer.bookingUrl} disabled />
      </>,
    );
    const controls = [
      screen.getByRole("button", { name: "Przejdź do zapisów" }),
      screen.getByRole("button", { name: "Zapisz się" }),
    ];
    for (const button of controls) {
      expect(button).toBeDisabled();
      expect(button).not.toHaveAttribute("href");
      await userEvent.click(button);
    }
    expect(screen.queryByRole("link", { name: /zapis/i })).not.toBeInTheDocument();
  });
  it("allows a future camp term while disabling an already started term", () => {
    const offer = sectionOffer("day_camp");
    if (offer.offerKind !== "day_camp") throw new Error("Expected camp");
    const term = offer.content.terms[0]!;
    offer.content.terms = [
      { ...term, label: "Trwający", startDate: "2000-01-01", endDate: "2099-01-01" },
      { ...term, label: "Przyszły", startDate: "2099-02-01", endDate: "2099-02-05" },
    ];
    render(<OfferDetailSections offer={offer} sidebar={null} />);
    expect(screen.getByRole("button", { name: "Zapisz się" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Zapisz się" })).toHaveAttribute(
      "href",
      term.bookingUrl,
    );
  });
});
