import { describe, expect, it } from "vitest";

import {
  changeEditableOfferKind,
  createEmptyEditableOfferInput,
  editorOfferInputSchema,
  getEditorFieldErrors,
  normalizeEditableOfferInput,
  type EditableOfferInput,
} from "./editor-schema";

const completeInput: EditableOfferInput = {
  slug: "atlantic-surf-week",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "Siedem dni w Ericeirze.",
  shortDescription: "Poranne sesje, dobry surf house i kolacje po wodzie.",
  content: {
    paragraphs: ["Tekst o wyjeździe."],
    highlights: ["Dwie sesje dziennie"],
    included: ["Nocleg"],
    excluded: ["Lot"],
    schedule: [{ day: "Dzień 1", text: "Przyjazd." }],
  },
  location: "Ericeira, Portugalia",
  startDate: "2026-06-12",
  endDate: "2026-06-18",
  durationDays: 7,
  groupSizeMin: 12,
  groupSizeMax: 18,
  priceFrom: 3100,
  currency: "PLN",
  bookingUrl: "https://zapisy.example/atlantic-surf-week",
  heroImagePath: "offers/atlantic-surf-week/hero.jpg",
};

const mergeInput = (patch: Partial<EditableOfferInput>): EditableOfferInput => ({
  ...completeInput,
  ...patch,
  content: { ...completeInput.content, ...patch.content },
});

const completeDayCamp = {
  offerKind: "day_camp",
  slug: "wake-lato-2026",
  activity: "wake",
  title: "Wakeboardowe półkolonie lato 2026",
  subtitle: "Pięć aktywnych dni na wodzie.",
  shortDescription: "Wakeboard, ruch i opieka instruktorów przez pięć wakacyjnych dni.",
  content: {
    paragraphs: ["Półkolonie dla dzieci, które chcą spróbować wakeboardu."],
    highlights: ["Codzienna nauka wakeboardu"],
    included: ["Opieka instruktorów"],
    excluded: ["Dojazd we własnym zakresie"],
    dayProgram: [{ time: "09:00", text: "Rozgrzewka i odprawa." }],
    venueDescription: "Wakepark z zapleczem dla dzieci i strefą odpoczynku.",
    parentInfo: {
      ageRange: "7–12 lat",
      supervision: "Stała opieka instruktorów.",
      safety: "Zajęcia w kamizelkach i kaskach.",
      transport: "Dojazd we własnym zakresie.",
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
      {
        label: "Turnus 2",
        startDate: "2026-07-20",
        endDate: "2026-07-24",
        bookingUrl: "https://zapisy.example.test/wake-lato-2026-turnus-2",
        priceOptions: [
          {
            label: "Wariant rozszerzony",
            price: 1400,
          },
        ],
      },
    ],
  },
  location: "Wrocław",
  startDate: null,
  endDate: null,
  durationDays: 1,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 0,
  currency: "PLN",
  bookingUrl: "",
  heroImagePath: "offers/wake-lato-2026/hero.webp",
};

const fieldErrorsFor = (input: unknown) => {
  const result = editorOfferInputSchema.safeParse(input);
  expect(result.success).toBe(false);
  return getEditorFieldErrors(result.success ? undefined : result.error);
};

describe("editor offer input schema", () => {
  it("replaces fields that belong only to the previously selected offer kind", () => {
    const dayCamp = changeEditableOfferKind(completeInput, "day_camp");

    expect(dayCamp).toMatchObject({
      offerKind: "day_camp",
      activity: "wake",
      groupSizeMin: null,
      groupSizeMax: null,
      priceFrom: 0,
      bookingUrl: "",
    });
    expect(dayCamp.content).not.toHaveProperty("schedule");
    expect(dayCamp.content).toHaveProperty("terms");

    const trip = changeEditableOfferKind(dayCamp, "trip");
    expect(trip).toMatchObject({ offerKind: "trip", activity: "surf" });
    expect(trip.content).toHaveProperty("schedule");
    expect(trip.content).not.toHaveProperty("terms");
  });

  it("accepts a complete day camp and derives its public summary from terms", () => {
    expect(editorOfferInputSchema.parse(completeDayCamp)).toMatchObject({
      offerKind: "day_camp",
      activity: "wake",
      startDate: "2026-07-06",
      endDate: "2026-07-24",
      durationDays: 5,
      priceFrom: 1200,
      bookingUrl: "https://zapisy.example.test/wake-lato-2026-turnus-1",
      groupSizeMin: null,
      groupSizeMax: null,
    });
  });

  it.each([
    ["an activity reserved for trips", { activity: "surf" }],
    [
      "a third term",
      {
        content: {
          ...completeDayCamp.content,
          terms: [...completeDayCamp.content.terms, completeDayCamp.content.terms[0]],
        },
      },
    ],
    [
      "an insecure term URL",
      {
        content: {
          ...completeDayCamp.content,
          terms: [
            {
              ...completeDayCamp.content.terms[0],
              bookingUrl: "http://zapisy.example.test/wake",
              priceOptions: [
                {
                  ...completeDayCamp.content.terms[0].priceOptions[0],
                },
              ],
            },
          ],
        },
      },
    ],
  ])("rejects a day camp with %s", (_reason, patch) => {
    expect(editorOfferInputSchema.safeParse({ ...completeDayCamp, ...patch }).success).toBe(false);
  });

  it("accepts a free-form time label in the day programme", () => {
    const result = editorOfferInputSchema.parse({
      ...completeDayCamp,
      content: {
        ...completeDayCamp.content,
        dayProgram: [{ time: "09:00–10:00", text: "Zajęcia na wodzie." }],
      },
    });

    expect(result.content).toMatchObject({ dayProgram: [{ time: "09:00–10:00" }] });
  });

  it("accepts blank optional transport and meal details", () => {
    const result = editorOfferInputSchema.parse({
      ...completeDayCamp,
      content: {
        ...completeDayCamp.content,
        parentInfo: {
          ...completeDayCamp.content.parentInfo,
          transport: "",
          meals: "   ",
        },
      },
    });

    expect(result.content).toMatchObject({
      parentInfo: { transport: undefined, meals: undefined },
    });
  });

  it("accepts a complete editor offer and removes blank list entries", () => {
    const result = editorOfferInputSchema.parse({
      ...completeInput,
      content: { ...completeInput.content, highlights: ["  Poranna sesja  ", ""] },
    });

    expect(result.content.highlights).toEqual(["Poranna sesja"]);
  });

  it("normalizes text without changing the caller input", () => {
    const input = mergeInput({
      title: "  Atlantycki tydzień surfingu  ",
      startDate: "  ",
      heroImagePath: "  ",
      content: { ...completeInput.content, paragraphs: ["  Tekst o wyjeździe.  ", ""] },
    });

    expect(normalizeEditableOfferInput(input)).toMatchObject({
      title: "Atlantycki tydzień surfingu",
      startDate: null,
      heroImagePath: null,
      content: { paragraphs: ["Tekst o wyjeździe."] },
    });
    expect(input).toMatchObject({
      title: "  Atlantycki tydzień surfingu  ",
      startDate: "  ",
      heroImagePath: "  ",
      content: { paragraphs: ["  Tekst o wyjeździe.  ", ""] },
    });
  });

  it.each([
    ["http booking URL", { bookingUrl: "http://zapisy.example/oferta" }, "bookingUrl"],
    ["non-kebab slug", { slug: "Zła Oferta" }, "slug"],
    ["reversed dates", { startDate: "2026-09-12", endDate: "2026-09-10" }, "endDate"],
    [
      "empty paragraphs",
      { content: { ...completeInput.content, paragraphs: ["  "] } },
      "content.paragraphs",
    ],
    [
      "empty schedule description",
      { content: { ...completeInput.content, schedule: [{ day: "Dzień 1", text: "" }] } },
      "content.schedule.0.text",
    ],
    ["invalid ISO date", { startDate: "12-09-2026" }, "startDate"],
    ["nonpositive price", { priceFrom: 0 }, "priceFrom"],
    ["minimum group above maximum", { groupSizeMin: 18, groupSizeMax: 12 }, "groupSizeMax"],
    [
      "empty highlights",
      { content: { ...completeInput.content, highlights: ["  "] } },
      "content.highlights",
    ],
    [
      "empty included list",
      { content: { ...completeInput.content, included: ["  "] } },
      "content.included",
    ],
    [
      "empty excluded list",
      { content: { ...completeInput.content, excluded: ["  "] } },
      "content.excluded",
    ],
    [
      "empty schedule day",
      { content: { ...completeInput.content, schedule: [{ day: "", text: "Przyjazd." }] } },
      "content.schedule.0.day",
    ],
  ] satisfies Array<[string, Partial<EditableOfferInput>, string]>)(
    "rejects %s",
    (_name, patch, path) => {
      expect(fieldErrorsFor(mergeInput(patch))).toHaveProperty(path);
    },
  );

  it.each([
    ["title", { title: "a".repeat(121) }],
    ["subtitle", { subtitle: "a".repeat(281) }],
    ["short description", { shortDescription: "a".repeat(501) }],
    ["location", { location: "a".repeat(121) }],
    ["duration", { durationDays: 61 }],
    ["minimum group size", { groupSizeMin: 100 }],
    ["maximum group size", { groupSizeMax: 100 }],
  ] satisfies Array<[string, Partial<EditableOfferInput>]>)(
    "rejects a %s above its maximum",
    (_name, patch) => {
      expect(editorOfferInputSchema.safeParse(mergeInput(patch)).success).toBe(false);
    },
  );

  it("creates a blank editable input with one row for every required list", () => {
    expect(createEmptyEditableOfferInput()).toMatchObject({
      activity: "surf",
      currency: "PLN",
      startDate: null,
      endDate: null,
      groupSizeMin: null,
      groupSizeMax: null,
      content: {
        paragraphs: [""],
        highlights: [""],
        included: [""],
        excluded: [""],
        schedule: [{ day: "", text: "" }],
      },
    });
  });

  it.each([
    ["malformed", "nie jest adresem"],
    ["blank", "   "],
  ])(
    "returns a Polish validation error for a %s booking URL without throwing",
    (_name, bookingUrl) => {
      expect(() => editorOfferInputSchema.safeParse(mergeInput({ bookingUrl }))).not.toThrow();
      expect(fieldErrorsFor(mergeInput({ bookingUrl }))).toMatchObject({
        bookingUrl: "Wpisz poprawny adres rezerwacji.",
      });
    },
  );

  it.each([
    ["title", { title: "aa" }, "title", "Tytuł musi mieć od 3 do 120 znaków."],
    ["subtitle", { subtitle: "aa" }, "subtitle", "Podtytuł musi mieć od 3 do 280 znaków."],
    [
      "short description",
      { shortDescription: "Za krótko" },
      "shortDescription",
      "Krótki opis musi mieć od 20 do 500 znaków.",
    ],
    ["location", { location: "A" }, "location", "Lokalizacja musi mieć od 2 do 120 znaków."],
    [
      "slug",
      { slug: "Zła Oferta" },
      "slug",
      "Adres oferty może zawierać małe litery, cyfry i łączniki.",
    ],
    ["date format", { startDate: "12-09-2026" }, "startDate", "Data musi mieć format RRRR-MM-DD."],
    [
      "blank list",
      { content: { ...completeInput.content, highlights: ["  "] } },
      "content.highlights",
      "Dodaj co najmniej jedną pozycję.",
    ],
  ] satisfies Array<[string, Partial<EditableOfferInput>, string, string]>)(
    "returns a Polish message for %s validation",
    (_name, patch, path, message) => {
      expect(fieldErrorsFor(mergeInput(patch))).toMatchObject({ [path]: message });
    },
  );

  it.each([
    ["duration lower bound", { durationDays: 0 }, "durationDays"],
    ["minimum group lower bound", { groupSizeMin: 0 }, "groupSizeMin"],
    ["maximum group lower bound", { groupSizeMax: 0 }, "groupSizeMax"],
    ["fractional duration", { durationDays: 1.5 }, "durationDays"],
    ["fractional minimum group", { groupSizeMin: 1.5 }, "groupSizeMin"],
    ["fractional maximum group", { groupSizeMax: 1.5 }, "groupSizeMax"],
    ["fractional price", { priceFrom: 1.5 }, "priceFrom"],
    ["malformed end date", { endDate: "18/06/2026" }, "endDate"],
  ] satisfies Array<[string, Partial<EditableOfferInput>, string]>)(
    "rejects %s with a Polish field error",
    (_name, patch, path) => {
      const errors = fieldErrorsFor(mergeInput(patch));
      expect(errors).toHaveProperty(path);
      expect(errors[path]).toMatch(/[ąćęłńóśźż]/i);
    },
  );

  it("rejects non-string list items instead of silently dropping them", () => {
    const errors = fieldErrorsFor({
      ...completeInput,
      content: { ...completeInput.content, highlights: ["Dwie sesje dziennie", 123] },
    });

    expect(errors).toHaveProperty("content.highlights.1");
  });
});
