import { describe, expect, it } from "vitest";

import type { DayCampOffer, PublicOffer } from "./types";
import { selectCampListingOffers } from "./camp-list";

const today = "2026-11-06";
const camp = (id: string, startDate: string | null, endDate: string | null): DayCampOffer => ({
  id,
  slug: id,
  title: id,
  offerKind: "day_camp",
  activity: "snow",
  startDate,
  endDate,
  subtitle: "",
  shortDescription: "",
  location: "Krynica-Zdrój",
  durationDays: 7,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 2000,
  currency: "PLN",
  bookingUrl: "https://example.test/zapisy",
  showLastPlacesBadge: false,
  heroImageUrl: null,
  images: [],
  accommodationImages: [],
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
});

describe("selectCampListingOffers", () => {
  it.each([0, 1, 2, 3, 4])(
    "sorts %i active camps and fills only the shortage to three",
    (count) => {
      const active = Array.from({ length: count }, (_, i) =>
        camp(`active-${i + 1}`, `2026-11-${11 + i}`, `2026-11-${17 + i}`),
      );
      const ended = Array.from({ length: 4 }, (_, i) =>
        camp(`ended-${i + 1}`, `2026-10-0${i + 1}`, `2026-11-0${i + 1}`),
      );
      const offers = [...ended, ...[...active].reverse()];
      const originalIds = offers.map(({ id }) => id);

      expect(selectCampListingOffers(offers, today).map(({ id }) => id)).toEqual([
        ...active.map(({ id }) => id),
        ...["ended-4", "ended-3", "ended-2"].slice(0, Math.max(0, 3 - count)),
      ]);
      expect(offers.map(({ id }) => id)).toEqual(originalIds);
    },
  );

  it("keeps ongoing camps and camps ending today active, with undated camps last", () => {
    const offers = [
      camp("undated", null, null),
      camp("future", "2026-12-01", "2026-12-07"),
      camp("today", "2026-11-04", today),
      camp("ongoing", "2026-11-01", "2026-11-08"),
      camp("ended", "2026-10-01", "2026-11-05"),
    ];
    expect(selectCampListingOffers(offers, today).map(({ id }) => id)).toEqual([
      "future",
      "ongoing",
      "today",
      "undated",
    ]);
  });

  it("uses Polish titles and IDs to settle identical start dates", () => {
    const offers = [
      { ...camp("b", today, null), title: "Łeba" },
      { ...camp("c", today, null), title: "Zima" },
      { ...camp("a", today, null), title: "Łeba" },
    ];
    expect(selectCampListingOffers(offers, today).map(({ id }) => id)).toEqual(["a", "b", "c"]);
  });

  it("returns only available camps without filling slots with trips or duplicates", () => {
    const ended = camp("ended", "2026-10-01", "2026-10-07");
    const trip: PublicOffer = {
      ...ended,
      id: "trip",
      offerKind: "trip",
      activity: "surf",
      content: { paragraphs: [], highlights: [], included: [], excluded: [], schedule: [] },
    };
    expect(selectCampListingOffers([trip, ended], today)).toEqual([ended]);
    expect(selectCampListingOffers([], today)).toEqual([]);
  });
});
