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

const textField = (requiredMessage: string) =>
  z.string({ required_error: requiredMessage, invalid_type_error: requiredMessage });

const trimmedText = (label: string, minimum: number, maximum: number) =>
  textField(`${label} jest wymagany.`)
    .trim()
    .min(minimum, `${label} musi mieć od ${minimum} do ${maximum} znaków.`)
    .max(maximum, `${label} musi mieć od ${minimum} do ${maximum} znaków.`);

const nullableText = (message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    textField(message).trim().min(1, message).nullable(),
  );

const dateSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  textField("Data musi mieć format RRRR-MM-DD.")
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi mieć format RRRR-MM-DD.")
    .nullable(),
);

const listItemSchema = textField("Pozycja listy musi być tekstem.")
  .trim()
  .min(1, "Pozycja listy nie może być pusta.");

const nonEmptyList = z
  .array(listItemSchema, {
    required_error: "Dodaj co najmniej jedną pozycję.",
    invalid_type_error: "Lista musi zawierać pozycje tekstowe.",
  })
  .min(1, "Dodaj co najmniej jedną pozycję.");

const scheduleSchema = z
  .array(
    z.object(
      {
        day: textField("Nazwa dnia jest wymagana.").trim().min(1, "Nazwa dnia jest wymagana."),
        text: textField("Opis dnia jest wymagany.").trim().min(1, "Opis dnia jest wymagany."),
      },
      {
        required_error: "Uzupełnij harmonogram wyjazdu.",
        invalid_type_error: "Uzupełnij harmonogram wyjazdu.",
      },
    ),
    {
      required_error: "Dodaj co najmniej jeden dzień harmonogramu.",
      invalid_type_error: "Harmonogram musi zawierać dni wyjazdu.",
    },
  )
  .min(1, "Dodaj co najmniej jeden dzień harmonogramu.");

const groupSizeSchema = (label: string) =>
  z
    .number({
      required_error: `${label} jest wymagana.`,
      invalid_type_error: `${label} musi być liczbą.`,
    })
    .int(`${label} musi być liczbą całkowitą.`)
    .min(1, `${label} musi wynosić co najmniej 1.`)
    .max(99, `${label} nie może być większa niż 99.`)
    .nullable();

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const trimValue = (value: unknown) => (typeof value === "string" ? value.trim() : value);

const normalizeList = (value: unknown) =>
  Array.isArray(value)
    ? value.map(trimValue).filter((item) => typeof item !== "string" || item !== "")
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
    .object(
      {
        slug: textField("Adres oferty jest wymagany.")
          .trim()
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Adres oferty może zawierać małe litery, cyfry i łączniki.",
          ),
        activity: z.enum(["surf", "snow", "combo"], {
          errorMap: () => ({ message: "Wybierz rodzaj wyjazdu." }),
        }),
        title: trimmedText("Tytuł", 3, 120),
        subtitle: trimmedText("Podtytuł", 3, 280),
        shortDescription: trimmedText("Krótki opis", 20, 500),
        content: z.object(
          {
            paragraphs: nonEmptyList,
            highlights: nonEmptyList,
            included: nonEmptyList,
            excluded: nonEmptyList,
            schedule: scheduleSchema,
          },
          {
            required_error: "Uzupełnij opis oferty.",
            invalid_type_error: "Uzupełnij opis oferty.",
          },
        ),
        location: trimmedText("Lokalizacja", 2, 120),
        startDate: dateSchema,
        endDate: dateSchema,
        durationDays: z
          .number({
            required_error: "Czas trwania jest wymagany.",
            invalid_type_error: "Czas trwania musi być liczbą.",
          })
          .int("Czas trwania musi być liczbą całkowitą.")
          .min(1, "Czas trwania musi wynosić co najmniej 1 dzień.")
          .max(60, "Czas trwania nie może być dłuższy niż 60 dni."),
        groupSizeMin: groupSizeSchema("Minimalna liczba uczestników"),
        groupSizeMax: groupSizeSchema("Maksymalna liczba uczestników"),
        priceFrom: z
          .number({
            required_error: "Cena od jest wymagana.",
            invalid_type_error: "Cena od musi być liczbą.",
          })
          .int("Cena od musi być liczbą całkowitą.")
          .positive("Cena od musi być większa od zera."),
        currency: z.literal("PLN", {
          errorMap: () => ({ message: "Waluta musi być ustawiona na PLN." }),
        }),
        bookingUrl: textField("Wpisz poprawny adres rezerwacji.")
          .trim()
          .url("Wpisz poprawny adres rezerwacji.")
          .refine(isHttpsUrl, { message: "Adres rezerwacji musi używać HTTPS." }),
        heroImagePath: nullableText("Ścieżka obrazu głównego musi być tekstem."),
      },
      {
        required_error: "Uzupełnij dane oferty.",
        invalid_type_error: "Uzupełnij dane oferty.",
      },
    )
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
