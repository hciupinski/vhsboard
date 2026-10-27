import { describe, expect, it } from "vitest";
import { tripOffer } from "@/test/offer-fixtures";
import type { DayCampOffer, TripOffer } from "./types";
import { selectRelatedTrips } from "./related-trips";
const trip = (id: string, startDate: string | null, title = id): TripOffer => ({
  ...tripOffer,
  id,
  title,
  startDate,
});
const camp: DayCampOffer = {
  ...tripOffer,
  id: "camp",
  offerKind: "day_camp",
  activity: "wake",
  startDate: "2026-10-27",
  content: {
    paragraphs: [],
    highlights: [],
    included: [],
    excluded: [],
    dayProgram: [],
    venueDescription: "",
    parentInfo: { ageRange: "", supervision: "", safety: "" },
    terms: [],
  },
};
describe("selectRelatedTrips", () => {
  it("excludes the current trip, camps, past and undated offers before taking three nearest dates", () => {
    const offers = [
      trip("later", "2026-11-02"),
      trip("current", "2026-10-27"),
      camp,
      trip("z", "2026-10-29", "Zeta"),
      trip("past", "2026-10-26"),
      trip("none", null),
      trip("a", "2026-10-29", "Alfa"),
      trip("today", "2026-10-27"),
    ];
    expect(selectRelatedTrips(offers, "current", "2026-10-27").map((o) => o.id)).toEqual([
      "today",
      "a",
      "z",
    ]);
    expect(offers.map((o) => o.id)).toEqual([
      "later",
      "current",
      "camp",
      "z",
      "past",
      "none",
      "a",
      "today",
    ]);
  });
  it.each([0, 1, 2])("keeps %i available alternatives without filling missing cards", (count) => {
    const offers = Array.from({ length: count }, (_, i) => trip(`other-${i}`, "2026-10-28"));
    expect(selectRelatedTrips(offers, "current", "2026-10-27")).toHaveLength(count);
  });
});
