import { describe, expect, it } from "vitest";

import type { DayCampOffer, TripOffer } from "./types";
import * as homeOffers from "./home-offers";

const { selectUpcomingHomeOffers } = homeOffers;

const trip = (title: string, startDate: string | null): TripOffer => ({
  id: `trip-${title}`,
  slug: `trip-${title.toLowerCase()}`,
  offerKind: "trip",
  activity: "surf",
  title,
  subtitle: "",
  shortDescription: "",
  location: "Lizbona",
  startDate,
  endDate: null,
  durationDays: 7,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 1000,
  currency: "PLN",
  bookingUrl: "https://example.test/zapisy",
  showLastPlacesBadge: false,
  heroImageUrl: null,
  images: [],
  accommodationImages: [],
  content: { paragraphs: [], highlights: [], included: [], excluded: [], schedule: [] },
});

const camp = (title: string, startDate: string): DayCampOffer => ({
  id: `camp-${title}`,
  slug: `camp-${title.toLowerCase()}`,
  offerKind: "day_camp",
  activity: "wake",
  title,
  subtitle: "",
  shortDescription: "",
  location: "Warszawa",
  startDate,
  endDate: null,
  durationDays: 5,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 1000,
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

describe("selectUpcomingHomeOffers", () => {
  it("fills remaining home slots only with recently finished offers", () => {
    const upcoming = { ...trip("Nowy", "2026-12-01"), endDate: "2026-12-05" };
    const recent = { ...trip("Niedawny", "2026-09-01"), endDate: "2026-10-06" };
    const old = { ...trip("Archiwum", "2026-09-01"), endDate: "2026-10-05" };
    expect(
      selectUpcomingHomeOffers([old, recent, upcoming], "2026-11-06").map((o) => o.title),
    ).toEqual(["Nowy", "Niedawny"]);
  });
  it("caps the home list at three even when ten future offers exist", () => {
    const offers = Array.from({ length: 10 }, (_, i) => trip(`Wyjazd ${i}`, "2026-12-01"));
    expect(selectUpcomingHomeOffers(offers, "2026-11-06")).toHaveLength(3);
  });
  it("selects the three nearest upcoming offers in date and Polish title order", () => {
    const offers = [
      trip("Później", "2026-10-01"),
      trip("Zeta", "2026-09-28"),
      camp("Obóz wake", "2026-09-29"),
      trip("Alfa", "2026-09-28"),
      trip("Dzisiaj", "2026-09-27"),
      trip("Miniony", "2026-09-26"),
      trip("Termin wkrótce", null),
    ];

    expect(selectUpcomingHomeOffers(offers, "2026-09-27").map((offer) => offer.title)).toEqual([
      "Alfa",
      "Zeta",
      "Obóz wake",
    ]);
    expect(offers.map((offer) => offer.title)).toEqual([
      "Później",
      "Zeta",
      "Obóz wake",
      "Alfa",
      "Dzisiaj",
      "Miniony",
      "Termin wkrótce",
    ]);
  });

  it("uses the current Warsaw calendar day after midnight", () => {
    const getTodayInWarsaw = (
      homeOffers as typeof homeOffers & { getTodayInWarsaw?: (now: Date) => string }
    ).getTodayInWarsaw;

    expect(getTodayInWarsaw).toBeTypeOf("function");
    expect(getTodayInWarsaw!(new Date("2026-09-26T22:30:00.000Z"))).toBe("2026-09-27");
  });
});
