import { describe, expect, it } from "vitest";

import {
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
  bookingUrl: "https://tripahead.example/atlantic-surf-week",
  heroImagePath: "offers/atlantic-surf-week/hero.jpg",
};

const mergeInput = (patch: Partial<EditableOfferInput>): EditableOfferInput => ({
  ...completeInput,
  ...patch,
  content: { ...completeInput.content, ...patch.content },
});

const fieldErrorsFor = (input: unknown) => {
  const result = editorOfferInputSchema.safeParse(input);
  expect(result.success).toBe(false);
  return getEditorFieldErrors(result.success ? undefined : result.error);
};

describe("editor offer input schema", () => {
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
    ["http booking URL", { bookingUrl: "http://tripahead.example/oferta" }, "bookingUrl"],
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
