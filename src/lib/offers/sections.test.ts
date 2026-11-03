import { describe, expect, it } from "vitest";
import { getOfferEditorSections } from "./sections";
import { emptyJourney, normalizeOfferContentV2 } from "./content-v2";
import type { DayCampContent } from "./types";

describe("offer sections and term transport", () => {
  it.each(["trip", "day_camp"] as const)("orders %s CMS sections like the offer", (kind) => {
    expect(getOfferEditorSections(kind).map((s) => s.label)).toEqual([
      kind === "trip" ? "O wyjeździe" : "O obozie",
      "W programie",
      "Cena",
      ...(kind === "day_camp" ? ["Dla rodzica"] : []),
      "Zakwaterowanie",
      "Resort",
      "Szkolenia",
      "Transport",
      "Ubezpieczenie",
      "Galeria",
    ]);
  });
  it("keeps term journeys after renaming/reordering and drops removed terms", () => {
    const content: DayCampContent = {
      paragraphs: [],
      highlights: [],
      included: [],
      excluded: [],
      dayProgram: [],
      venueDescription: "",
      parentInfo: { ageRange: "", supervision: "", safety: "" },
      terms: [],
    };
    const term = (id: string) => ({
      id,
      label: id,
      startDate: "2027-01-01",
      endDate: "2027-01-02",
      bookingUrl: "https://example.com",
      priceOptions: [],
    });
    const first = "10000000-0000-4000-8000-000000000001",
      second = "10000000-0000-4000-8000-000000000002";
    content.terms = [term(first), term(second)];
    content.transport = {
      enabled: true,
      type: "coach",
      description: "Opis",
      journeys: [
        { ...emptyJourney(first), departurePlace: "Warszawa" },
        { ...emptyJourney(second), departurePlace: "Kraków" },
      ],
    };
    content.terms = [{ ...term(second), label: "Nowa nazwa" }, term(first)];
    const reordered = normalizeOfferContentV2(content, "day_camp");
    expect(reordered.transport!.journeys.map((j) => j.departurePlace)).toEqual([
      "Kraków",
      "Warszawa",
    ]);
    reordered.terms = [reordered.terms[1]!];
    expect(normalizeOfferContentV2(reordered, "day_camp").transport!.journeys).toMatchObject([
      { termId: first, departurePlace: "Warszawa" },
    ]);
  });
});
