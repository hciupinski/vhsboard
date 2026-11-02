import { z } from "zod";
import type { OfferContent, OfferKind } from "./types";

const text = (max: number) => z.string().trim().max(max);
const id = z.string().uuid();
const url = text(2048).refine(
  (value) =>
    !value ||
    (() => {
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    })(),
  "Wpisz poprawny adres HTTPS.",
);
export const extraPriceSchema = z.object({
  kind: z.enum(["included", "extra"]),
  amount: z.number().finite().min(0).max(500000).multipleOf(0.01),
  from: z.boolean(),
  unit: text(120),
});
const uniqueIds = (items: { id: string }[]) =>
  new Set(items.map((item) => item.id)).size === items.length;
const identityError = "Każdy element musi mieć unikalny identyfikator.";
const card = { id, title: text(120), description: text(1500), price: extraPriceSchema };
export const journeySchema = z.object({
  termId: id.optional(),
  departureDate: text(10),
  departureTime: text(5),
  departurePlace: text(120),
  returnDate: text(10),
  returnTime: text(5),
  returnPlace: text(120),
  note: text(500),
});
export const contentSectionsShape = {
  schemaVersion: z.literal(2).optional(),
  accommodation: z.object({ enabled: z.boolean().optional(), description: text(1000) }).optional(),
  resort: z
    .object({ enabled: z.boolean(), name: text(120), description: text(3000), mapUrl: url })
    .optional(),
  training: z
    .object({
      enabled: z.boolean(),
      description: text(3000),
      items: z
        .array(z.object({ ...card, level: text(120), scope: text(500) }))
        .max(12)
        .refine(uniqueIds, identityError),
    })
    .optional(),
  transport: z
    .object({
      enabled: z.boolean(),
      type: z.enum(["coach", "plane", "train", "own", "other"]),
      customType: text(120).optional(),
      description: text(3000),
      journeys: z.array(journeySchema).max(2),
    })
    .optional(),
  insurance: z
    .object({
      enabled: z.boolean(),
      description: text(3000),
      provider: text(120),
      informationUrl: url,
      packages: z
        .array(
          z.object({
            ...card,
            risks: z
              .array(z.object({ id, label: text(120), value: text(240) }))
              .max(12)
              .refine(uniqueIds, identityError),
          }),
        )
        .max(6)
        .refine(uniqueIds, identityError),
      extensions: z.array(z.object(card)).max(12).refine(uniqueIds, identityError),
    })
    .optional(),
};
export const contentSectionsSchema = z.object(contentSectionsShape);
export type ContentSections = z.infer<typeof contentSectionsSchema>;
export type ExtraPrice = z.infer<typeof extraPriceSchema>;
export type Journey = z.infer<typeof journeySchema>;
export type OptionalSectionKey =
  "accommodation" | "resort" | "training" | "transport" | "insurance";
export const sectionIsEnabled = (value: { enabled?: boolean | undefined } | undefined): boolean =>
  !!value && value.enabled !== false;
export const emptyPrice = (): ExtraPrice => ({
  kind: "included",
  amount: 0,
  from: false,
  unit: "osoba / wyjazd",
});
export const emptyJourney = (termId?: string): Journey => ({
  ...(termId ? { termId } : {}),
  departureDate: "",
  departureTime: "",
  departurePlace: "",
  returnDate: "",
  returnTime: "",
  returnPlace: "",
  note: "",
});
export function createOptionalSection(
  key: OptionalSectionKey,
): NonNullable<ContentSections[OptionalSectionKey]> {
  switch (key) {
    case "accommodation":
      return { enabled: true, description: "" };
    case "resort":
      return { enabled: true, name: "", description: "", mapUrl: "" };
    case "training":
      return { enabled: true, description: "", items: [] };
    case "transport":
      return { enabled: true, type: "coach", customType: "", description: "", journeys: [] };
    case "insurance":
      return {
        enabled: true,
        description: "",
        provider: "",
        informationUrl: "",
        packages: [],
        extensions: [],
      };
  }
}
const realDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export function getContentIdentityIssues(input: unknown, kind: OfferKind): z.ZodIssue[] {
  if (
    kind !== "day_camp" ||
    typeof input !== "object" ||
    input === null ||
    !("schemaVersion" in input) ||
    input.schemaVersion !== 2 ||
    !("terms" in input) ||
    !Array.isArray(input.terms)
  )
    return [];
  const seen = new Set<string>();
  return input.terms.flatMap((term, i) => {
    if (!term || typeof term.id !== "string" || !id.safeParse(term.id).success || seen.has(term.id))
      return [
        {
          code: "custom" as const,
          path: ["terms", i, "id"],
          message: "Turnus musi mieć unikalny identyfikator. Odśwież CMS.",
        },
      ];
    seen.add(term.id);
    return [];
  });
}
export function getSectionIssues(input: unknown, kind: OfferKind = "trip"): z.ZodIssue[] {
  const result = contentSectionsSchema.safeParse(input);
  if (!result.success) return result.error.issues;
  const content = result.data;
  const issues: z.ZodIssue[] = getContentIdentityIssues(input, kind);
  const error = (path: (string | number)[], message = "Uzupełnij to pole przed publikacją.") =>
    issues.push({ code: "custom", path, message });
  const required = (value: string, path: (string | number)[]) => {
    if (value.trim().length < 3) error(path);
  };
  const price = (value: ExtraPrice, path: (string | number)[]) => {
    if (value.kind === "included" && value.amount !== 0)
      error([...path, "amount"], "W cenie nie może zawierać dopłaty.");
    if (value.kind === "extra") required(value.unit, [...path, "unit"]);
  };
  if (sectionIsEnabled(content.accommodation))
    required(content.accommodation!.description, ["accommodation", "description"]);
  if (sectionIsEnabled(content.resort)) {
    required(content.resort!.name, ["resort", "name"]);
    required(content.resort!.description, ["resort", "description"]);
  }
  for (const key of ["training", "insurance"] as const) {
    const section = content[key];
    if (!sectionIsEnabled(section)) continue;
    required(section!.description, [key, "description"]);
    const cards = key === "training" ? content.training!.items : content.insurance!.packages;
    const collection = key === "training" ? "items" : "packages";
    if (!cards.length) error([key, collection], "Dodaj co najmniej jedną kartę.");
    cards.forEach((item, index) => {
      const path = [key, collection, index];
      required(item.title, [...path, "title"]);
      required(item.description, [...path, "description"]);
      price(item.price, [...path, "price"]);
      if ("risks" in item) {
        if (!item.risks.length)
          error([...path, "risks"], "Dodaj co najmniej jeden zakres ochrony.");
        item.risks.forEach((risk, i) => {
          required(risk.label, [...path, "risks", i, "label"]);
          if (!risk.value.trim()) error([...path, "risks", i, "value"]);
        });
      }
    });
    if (key === "insurance")
      content.insurance!.extensions.forEach((item, i) => {
        required(item.title, [key, "extensions", i, "title"]);
        price(item.price, [key, "extensions", i, "price"]);
      });
  }
  if (sectionIsEnabled(content.transport)) {
    const transport = content.transport!;
    required(transport.description, ["transport", "description"]);
    if (transport.type === "other")
      required(transport.customType ?? "", ["transport", "customType"]);
    if (transport.type !== "own") {
      const terms =
        kind === "day_camp" &&
        typeof input === "object" &&
        input !== null &&
        "terms" in input &&
        Array.isArray(input.terms)
          ? (input as { terms: { id?: string }[] }).terms
          : [];
      const expected = kind === "trip" ? 1 : terms.length;
      if (!expected || transport.journeys.length !== expected)
        error(["transport", "journeys"], "Uzupełnij transport każdego turnusu.");
      if (
        kind === "day_camp" &&
        (new Set(transport.journeys.map((j) => j.termId)).size !== transport.journeys.length ||
          terms.some((term) => !term.id || !transport.journeys.some((j) => j.termId === term.id)))
      )
        error(["transport", "journeys"], "Transport musi być przypisany do właściwych turnusów.");
      transport.journeys.forEach((journey, i) => {
        const path = ["transport", "journeys", i];
        for (const field of ["departureDate", "returnDate"] as const)
          if (!realDate(journey[field])) error([...path, field], "Wpisz poprawną datę.");
        for (const field of ["departureTime", "returnTime"] as const)
          if (journey[field] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(journey[field]))
            error([...path, field], "Wpisz poprawną godzinę.");
        required(journey.departurePlace, [...path, "departurePlace"]);
        required(journey.returnPlace, [...path, "returnPlace"]);
        if (
          journey.returnDate < journey.departureDate ||
          (journey.returnDate === journey.departureDate &&
            journey.departureTime &&
            journey.returnTime &&
            journey.returnTime < journey.departureTime)
        )
          error([...path, "returnDate"], "Powrót nie może poprzedzać wyjazdu.");
      });
    }
  }
  return issues;
}
export function normalizeOfferContentV2<T extends OfferContent>(content: T, kind: OfferKind): T {
  const next = structuredClone(content);
  next.schemaVersion = 2;
  if (next.accommodation && next.accommodation.enabled === undefined)
    next.accommodation.enabled = true;
  if (kind === "day_camp" && "terms" in next) {
    next.terms = next.terms.map((term) => ({ ...term, id: term.id ?? crypto.randomUUID() }));
    if (!next.transport && next.parentInfo.transport)
      next.transport = {
        enabled: false,
        type: "coach",
        description: next.parentInfo.transport,
        journeys: [],
        customType: "",
      };
    if (next.transport)
      next.transport.journeys = next.terms.map(
        (term) =>
          next.transport!.journeys.find((j) => j.termId === term.id) ?? emptyJourney(term.id),
      );
  } else if (next.transport && !next.transport.journeys.length)
    next.transport.journeys = [emptyJourney()];
  return next;
}
