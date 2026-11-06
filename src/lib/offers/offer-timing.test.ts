import { describe, expect, it } from "vitest";
import { getDateStatus, getOfferTiming, selectListingOffers } from "./offer-timing";
import type { PublicOffer } from "./types";

const today = "2026-11-06";
const offer = (id: string, startDate: string | null, endDate: string | null): PublicOffer => ({
  id,
  slug: id,
  title: id,
  offerKind: "trip",
  activity: "snow",
  startDate,
  endDate,
  subtitle: "",
  shortDescription: "",
  location: "",
  durationDays: 1,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 1,
  currency: "PLN",
  bookingUrl: "https://example.test",
  showLastPlacesBadge: true,
  heroImageUrl: null,
  images: [],
  accommodationImages: [],
  content: { paragraphs: [], highlights: [], included: [], excluded: [], schedule: [] },
});

describe("offer timing", () => {
  it("uses inclusive boundaries and does not guess ongoing with incomplete dates", () => {
    expect(getDateStatus("2026-11-07", "2026-11-08", today)).toBe("future");
    expect(getDateStatus(today, today, today)).toBe("ongoing");
    expect(getDateStatus("2026-11-01", today, today)).toBe("ongoing");
    expect(getDateStatus("2026-11-01", "2026-11-05", today)).toBe("finished");
    expect(getDateStatus("2026-11-01", null, today)).toBe("unknown");
  });
  it("orders future, ongoing and recent finished only to fill three, without mutation", () => {
    const items = [
      offer("old", "2026-01-01", "2026-01-02"),
      offer("ongoing", today, today),
      offer("future", "2026-12-01", "2026-12-02"),
      offer("recent", "2026-11-01", "2026-11-05"),
    ];
    expect(selectListingOffers(items, today).map((x) => x.id)).toEqual([
      "future",
      "ongoing",
      "recent",
    ]);
    expect(items.map((x) => x.id)).toEqual(["old", "ongoing", "future", "recent"]);
  });
  it("handles gaps and overlapping future and ongoing camp terms", () => {
    const base = offer("camp", "2026-11-01", "2026-12-05");
    const camp = {
      ...base,
      offerKind: "day_camp" as const,
      activity: "snow" as const,
      campTermDates: [
        { startDate: "2026-11-01", endDate: "2026-11-03" },
        { startDate: "2026-12-01", endDate: "2026-12-05" },
      ],
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
    expect(getOfferTiming(camp, today)).toMatchObject({ status: "future", sortDate: "2026-12-01" });
    camp.campTermDates[0]!.endDate = today;
    expect(getOfferTiming(camp, today).status).toBe("ongoing");
  });
});
