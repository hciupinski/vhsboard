import { describe, expect, it } from "vitest";

import { mapOfferDetailRow, mapOfferListRow } from "./mapper";

const offerId = "a0f8e810-1df3-42d9-90df-2a1a69ad9a2c";

const completeOfferRow = {
  id: offerId,
  slug: "atlantic-surf-week",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "Siedem dni w Ericeirze.",
  short_description: "Poranne sesje, dobry surf house i kolacje po wodzie.",
  description: {
    paragraphs: ["Tekst o wyjeździe."],
    highlights: ["Dwie sesje dziennie"],
    included: ["Nocleg"],
    excluded: ["Lot"],
    schedule: [{ day: "Dzień 1", text: "Przyjazd." }],
  },
  location: "Ericeira, Portugalia",
  start_date: "2026-06-12",
  end_date: "2026-06-18",
  duration_days: 7,
  group_size_min: 12,
  group_size_max: 18,
  price_from: 3100,
  currency: "PLN",
  booking_url: "https://zapisy.example/atlantic-surf-week",
  hero_image: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/hero.jpg",
  status: "published",
};

const completeImageRows = [
  {
    id: "b1f8e810-1df3-42d9-90df-2a1a69ad9a2c",
    offer_id: offerId,
    storage_path: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/first.jpg",
    alt_text: "Surfer na fali w Ericeirze",
    position: 0,
  },
  {
    id: "c2f8e810-1df3-42d9-90df-2a1a69ad9a2c",
    offer_id: offerId,
    storage_path: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/second.jpg",
    alt_text: "Ekipa z deskami na plaży",
    position: 1,
  },
];

describe("offer row mappers", () => {
  it("maps a published day camp without exposing trip-only group limits", () => {
    const row = {
      ...completeOfferRow,
      slug: "wake-lato-2026",
      offer_kind: "day_camp",
      activity: "wake",
      group_size_min: null,
      group_size_max: null,
      description: {
        paragraphs: ["Półkolonie dla dzieci, które chcą spróbować wakeboardu."],
        highlights: ["Codzienna nauka wakeboardu"],
        included: ["Opieka instruktorów"],
        excluded: ["Dojazd we własnym zakresie"],
        dayProgram: [{ time: "09:00", text: "Rozgrzewka i odprawa." }],
        venueDescription: "Wakepark z zapleczem dla dzieci.",
        parentInfo: {
          ageRange: "7–12 lat",
          supervision: "Stała opieka instruktorów.",
          safety: "Zajęcia w kamizelkach i kaskach.",
        },
        terms: [
          {
            label: "Turnus 1",
            startDate: "2026-07-06",
            endDate: "2026-07-10",
            bookingUrl: "https://zapisy.example.test/wake-lato-2026-turnus-1",
            priceOptions: [
              {
                label: "Wariant podstawowy",
                price: 1200,
              },
            ],
          },
        ],
      },
    };

    expect(mapOfferDetailRow(row, [], new Map())).toMatchObject({
      offerKind: "day_camp",
      activity: "wake",
      content: { terms: [{ label: "Turnus 1" }] },
      groupSizeMin: null,
      groupSizeMax: null,
    });
  });

  it("maps a complete published SQL row to the public domain contract", () => {
    const signedUrls = new Map([
      [completeOfferRow.hero_image, "https://signed.example/hero.jpg"],
      [completeImageRows[0]!.storage_path, "https://signed.example/first.jpg"],
      [completeImageRows[1]!.storage_path, "https://signed.example/second.jpg"],
    ]);

    expect(mapOfferDetailRow(completeOfferRow, completeImageRows, signedUrls)).toEqual({
      id: offerId,
      slug: "atlantic-surf-week",
      offerKind: "trip",
      activity: "surf",
      title: "Atlantycki tydzień surfingu",
      subtitle: "Siedem dni w Ericeirze.",
      shortDescription: "Poranne sesje, dobry surf house i kolacje po wodzie.",
      content: completeOfferRow.description,
      location: "Ericeira, Portugalia",
      startDate: "2026-06-12",
      endDate: "2026-06-18",
      durationDays: 7,
      groupSizeMin: 12,
      groupSizeMax: 18,
      priceFrom: 3100,
      currency: "PLN",
      bookingUrl: "https://zapisy.example/atlantic-surf-week",
      heroImageUrl: "https://signed.example/hero.jpg",
      images: [
        {
          id: "b1f8e810-1df3-42d9-90df-2a1a69ad9a2c",
          path: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/first.jpg",
          alt: "Surfer na fali w Ericeirze",
          position: 0,
          signedUrl: "https://signed.example/first.jpg",
        },
        {
          id: "c2f8e810-1df3-42d9-90df-2a1a69ad9a2c",
          path: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/second.jpg",
          alt: "Ekipa z deskami na plaży",
          position: 1,
          signedUrl: "https://signed.example/second.jpg",
        },
      ],
    });
  });

  it("maps a list row without long description or gallery to empty detail-only fields", () => {
    const { description: _description, ...listRow } = completeOfferRow;

    expect(mapOfferListRow(listRow, new Map())).toMatchObject({
      slug: "atlantic-surf-week",
      content: {
        paragraphs: [],
        highlights: [],
        included: [],
        excluded: [],
        schedule: [],
      },
      images: [],
      heroImageUrl: null,
    });
  });

  it("maps a day camp list row without its detail content", () => {
    const { description: _description, ...listRow } = {
      ...completeOfferRow,
      slug: "wake-lato-2026",
      offer_kind: "day_camp",
      activity: "wake",
      group_size_min: null,
      group_size_max: null,
    };

    expect(mapOfferListRow(listRow, new Map())).toMatchObject({
      offerKind: "day_camp",
      activity: "wake",
      content: { paragraphs: [], terms: [] },
      images: [],
    });
  });

  it.each([
    ["a malformed description", { description: { paragraphs: "nie tablica" } }],
    ["a non-published status", { status: "draft" }],
    ["a non-HTTPS booking URL", { booking_url: "http://zapisy.example/offer" }],
  ])("rejects %s", (_reason, invalidFields) => {
    expect(() =>
      mapOfferDetailRow({ ...completeOfferRow, ...invalidFields }, completeImageRows, new Map()),
    ).toThrow();
  });

  it.each([
    ["out-of-order positions", [{ ...completeImageRows[1] }, { ...completeImageRows[0] }]],
    [
      "duplicate positions",
      [{ ...completeImageRows[0] }, { ...completeImageRows[1], position: 0 }],
    ],
  ])("rejects %s in the gallery", (_reason, imageRows) => {
    expect(() => mapOfferDetailRow(completeOfferRow, imageRows, new Map())).toThrow();
  });

  it("drops a malformed signed image URL instead of exposing it", () => {
    const signedUrls = new Map([[completeOfferRow.hero_image, "http://signed.example/hero.jpg"]]);

    expect(
      mapOfferDetailRow(completeOfferRow, completeImageRows, signedUrls).heroImageUrl,
    ).toBeNull();
  });
});
