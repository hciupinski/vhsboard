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

const fieldErrorsFor = (input: EditableOfferInput) => {
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
});
