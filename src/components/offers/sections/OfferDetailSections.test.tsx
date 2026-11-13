import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OfferDetailSections } from "./OfferDetailSections";
import { sectionOffer } from "@/lib/offers/__fixtures__/sections";
import { getOfferSections } from "@/lib/offers/sections";

afterEach(cleanup);
describe("complete shared offer details", () => {
  it.each(["trip", "day_camp"] as const)(
    "justifies %s descriptions only below the desktop breakpoint",
    (kind) => {
      const offer = sectionOffer(kind);
      offer.content.priceNote = "Dopłaty rozliczamy na miejscu.";
      render(<OfferDetailSections offer={offer} sidebar={null} />);

      const programme =
        "schedule" in offer.content ? offer.content.schedule : offer.content.dayProgram;
      expect(screen.getByText(offer.content.paragraphs[0]!)).toHaveClass(
        "text-justify",
        "lg:text-start",
        "hyphens-auto",
      );
      expect(screen.getByText(programme[0]!.text)).toHaveClass("text-justify", "lg:text-start");
      expect(screen.getByText(offer.content.priceNote)).toHaveClass(
        "text-justify",
        "lg:text-start",
      );
      expect(screen.getByRole("heading", { name: "W cenie" })).not.toHaveClass("text-justify");
    },
  );
  it.each(["trip", "day_camp"] as const)(
    "shows selected %s photos after the story without removing the gallery",
    (kind) => {
      const offer = sectionOffer(kind);
      const photo = {
        id: "photo",
        path: "photo",
        alt: "Deska na śniegu",
        position: 0,
        category: "gallery" as const,
        signedUrl: "https://example.test/photo.webp",
      };
      offer.storyImages = [photo];
      offer.images = [photo];
      const { container } = render(<OfferDetailSections offer={offer} sidebar={null} />);
      const images = screen.getAllByRole("img", { name: photo.alt });
      expect(images).toHaveLength(2);
      expect(
        screen.getByText("Wspólny wyjazd na deskę w górach.").compareDocumentPosition(images[0]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(container.querySelectorAll('img[src="https://example.test/photo.webp"]')).toHaveLength(
        2,
      );
    },
  );
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
  it.each(["trip", "day_camp"] as const)(
    "marks each %s schedule entry with a decorative timeline dot",
    (kind) => {
      const offer = sectionOffer(kind);
      render(<OfferDetailSections offer={offer} sidebar={null} />);
      const schedule = document.getElementById(kind === "trip" ? "plan-wyjazdu" : "plan-dnia");
      const entries = schedule?.querySelectorAll("ol > li");
      expect(entries?.length).toBeGreaterThan(0);
      entries?.forEach((entry) =>
        expect(entry.querySelector('[aria-hidden="true"]')).toBeInTheDocument(),
      );
    },
  );
  it.each(["trip", "day_camp"] as const)(
    "shows the rental link only when enabled for %s",
    (kind) => {
      const offer = sectionOffer(kind);
      offer.content.included = [];
      offer.content.excluded = [];
      offer.content.priceNote = "";
      if (offer.offerKind === "day_camp") offer.content.terms = [];
      const { rerender } = render(<OfferDetailSections offer={offer} sidebar={null} />);
      expect(
        screen.queryByRole("link", { name: "Wypożyczalnia snowboardów" }),
      ).not.toBeInTheDocument();
      offer.content.showRentalLink = true;
      rerender(<OfferDetailSections offer={offer} sidebar={null} />);
      expect(screen.getByRole("link", { name: "Wypożyczalnia snowboardów" })).toHaveAttribute(
        "href",
        "/wypozyczalnia/",
      );
      offer.content.showRentalLink = false;
      rerender(<OfferDetailSections offer={offer} sidebar={null} />);
      expect(
        screen.queryByRole("link", { name: "Wypożyczalnia snowboardów" }),
      ).not.toBeInTheDocument();
    },
  );
  it("renders a training gallery without cards and hides it with the section disabled", () => {
    const offer = sectionOffer();
    offer.content.training!.items = [];
    Object.assign(offer, {
      trainingImages: [
        {
          id: "training-photo",
          path: "training-photo",
          alt: "Instruktorka na stoku",
          position: 0,
          category: "training_gallery",
          signedUrl: "https://example.test/training.webp",
        },
      ],
    });
    const { rerender } = render(<OfferDetailSections offer={offer} sidebar={null} />);
    expect(screen.getByRole("region", { name: "Szkolenia" })).toContainElement(
      screen.getByRole("img", { name: "Instruktorka na stoku" }),
    );
    expect(screen.getAllByRole("img", { name: "Instruktorka na stoku" })).toHaveLength(1);
    offer.content.training!.enabled = false;
    rerender(<OfferDetailSections offer={offer} sidebar={null} />);
    expect(screen.queryByRole("img", { name: "Instruktorka na stoku" })).not.toBeInTheDocument();
  });
  it("shows one public note under the price lists", () => {
    const offer = sectionOffer();
    Object.assign(offer.content, { priceNote: "Dopłaty rozliczamy na miejscu." });
    render(<OfferDetailSections offer={offer} sidebar={null} />);
    expect(screen.getByText("Dopłaty rozliczamy na miejscu.")).toHaveClass("text-xs");
    expect(screen.getByRole("region", { name: "Cena" })).toContainElement(
      screen.getByText("Dopłaty rozliczamy na miejscu."),
    );
  });
  it("shows both transport modes for one shared journey", () => {
    const offer = sectionOffer();
    Reflect.deleteProperty(offer.content.transport!, "type");
    Object.assign(offer.content.transport!, { types: ["own", "vhs_bus"] });
    render(<OfferDetailSections offer={offer} sidebar={null} />);
    const section = screen.getByRole("region", { name: "Transport" });
    expect(section).toHaveTextContent("Dojazd własny");
    expect(section).toHaveTextContent("Bus VHS");
    expect(section).toHaveTextContent("Wyjazd");
    expect(section).toHaveTextContent("Powrót");
  });
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
  it("keeps the legacy camp venue description in the resort section", () => {
    const offer = sectionOffer("day_camp");
    if (offer.offerKind !== "day_camp") throw new Error("expected camp");
    delete offer.content.resort;
    render(<OfferDetailSections offer={offer} sidebar={null} />);
    const resort = screen.getByRole("region", { name: "Resort" });
    expect(resort).toHaveTextContent(offer.content.venueDescription);
    expect(screen.getByRole("region", { name: "Dla rodzica" })).toHaveTextContent(
      "Wiek uczestników",
    );
    expect(screen.getByRole("region", { name: "O obozie" })).not.toHaveTextContent(
      offer.content.venueDescription,
    );
  });
  it("preserves distinct legacy venue text when a resort is also configured", () => {
    const offer = sectionOffer("day_camp");
    if (offer.offerKind !== "day_camp") throw new Error("expected camp");
    render(<OfferDetailSections offer={offer} sidebar={null} />);
    const resort = screen.getByRole("region", { name: "Resort" });
    expect(resort).toHaveTextContent(offer.content.venueDescription);
    expect(resort).toHaveTextContent(offer.content.resort!.description);
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
