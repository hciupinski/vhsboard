import { z } from "zod";

import type { OfferActivity, OfferContent, OfferStatus, PublicOffer } from "./types";

export type EditableOfferInput = {
  slug: string;
  activity: OfferActivity;
  title: string;
  subtitle: string;
  shortDescription: string;
  content: OfferContent;
  location: string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  groupSizeMin: number | null;
  groupSizeMax: number | null;
  priceFrom: number;
  currency: "PLN";
  bookingUrl: string;
  heroImagePath: string | null;
};

export type EditableOffer = Omit<PublicOffer, "heroImageUrl" | "images"> & {
  status: OfferStatus;
  heroImagePath: string | null;
};

const trimmedText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

const nullableText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().min(1).nullable(),
);

const nonEmptyList = z.array(z.string().trim().min(1)).min(1);

const trimValue = (value: unknown) => (typeof value === "string" ? value.trim() : value);

const normalizeList = (value: unknown) =>
  Array.isArray(value)
    ? value.map(trimValue).filter((item): item is string => typeof item === "string" && item !== "")
    : value;

const normalizeNullableText = (value: unknown) => {
  const normalized = trimValue(value);
  return normalized === "" ? null : normalized;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeEditorOfferInput = (input: unknown): unknown => {
  if (!isRecord(input)) return input;

  const content = input.content;
  const schedule =
    isRecord(content) && Array.isArray(content.schedule) ? content.schedule : undefined;

  return {
    ...input,
    slug: trimValue(input.slug),
    title: trimValue(input.title),
    subtitle: trimValue(input.subtitle),
    shortDescription: trimValue(input.shortDescription),
    location: trimValue(input.location),
    startDate: normalizeNullableText(input.startDate),
    endDate: normalizeNullableText(input.endDate),
    bookingUrl: trimValue(input.bookingUrl),
    heroImagePath: normalizeNullableText(input.heroImagePath),
    content: isRecord(content)
      ? {
          ...content,
          paragraphs: normalizeList(content.paragraphs),
          highlights: normalizeList(content.highlights),
          included: normalizeList(content.included),
          excluded: normalizeList(content.excluded),
          schedule: schedule?.map((item) =>
            isRecord(item)
              ? { ...item, day: trimValue(item.day), text: trimValue(item.text) }
              : item,
          ),
        }
      : content,
  };
};

export function normalizeEditableOfferInput(input: EditableOfferInput): EditableOfferInput {
  return normalizeEditorOfferInput(input) as EditableOfferInput;
}

export const editorOfferInputSchema = z.preprocess(
  normalizeEditorOfferInput,
  z
    .object({
      slug: z
        .string()
        .trim()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      activity: z.enum(["surf", "snow", "combo"]),
      title: trimmedText(3, 120),
      subtitle: trimmedText(3, 280),
      shortDescription: trimmedText(20, 500),
      content: z.object({
        paragraphs: nonEmptyList,
        highlights: nonEmptyList,
        included: nonEmptyList,
        excluded: nonEmptyList,
        schedule: z
          .array(z.object({ day: z.string().trim().min(1), text: z.string().trim().min(1) }))
          .min(1),
      }),
      location: trimmedText(2, 120),
      startDate: nullableText.refine(
        (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
      ),
      endDate: nullableText.refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value)),
      durationDays: z.number().int().min(1).max(60),
      groupSizeMin: z.number().int().min(1).max(99).nullable(),
      groupSizeMax: z.number().int().min(1).max(99).nullable(),
      priceFrom: z.number().int().positive(),
      currency: z.literal("PLN"),
      bookingUrl: z
        .string()
        .url()
        .refine((value) => new URL(value).protocol === "https:"),
      heroImagePath: nullableText,
    })
    .superRefine((offer, ctx) => {
      if (offer.startDate && offer.endDate && offer.endDate < offer.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.",
        });
      }

      if (
        offer.groupSizeMin !== null &&
        offer.groupSizeMax !== null &&
        offer.groupSizeMin > offer.groupSizeMax
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["groupSizeMax"],
          message: "Maksymalna liczba uczestników nie może być mniejsza niż minimalna.",
        });
      }
    }),
);

export function getEditorFieldErrors(
  error: z.ZodError<unknown> | undefined,
): Record<string, string> {
  if (!error) return {};

  return error.issues.reduce<Record<string, string>>((errors, issue) => {
    const path = issue.path.join(".");
    if (path && !errors[path]) errors[path] = issue.message;
    return errors;
  }, {});
}

export function createEmptyEditableOfferInput(): EditableOfferInput {
  return {
    slug: "",
    activity: "surf",
    title: "",
    subtitle: "",
    shortDescription: "",
    content: {
      paragraphs: [""],
      highlights: [""],
      included: [""],
      excluded: [""],
      schedule: [{ day: "", text: "" }],
    },
    location: "",
    startDate: null,
    endDate: null,
    durationDays: 1,
    groupSizeMin: null,
    groupSizeMax: null,
    priceFrom: 0,
    currency: "PLN",
    bookingUrl: "",
    heroImagePath: null,
  };
}
