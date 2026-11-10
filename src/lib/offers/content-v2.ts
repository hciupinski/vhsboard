import { z } from "zod";
import { isValidIsoDate } from "./date-input";
import type { OfferContent, OfferKind } from "./types";

const text = (max: number) =>
  z
    .string({ invalid_type_error: "Wpisz tekst." })
    .trim()
    .max(max, `Wpisz maksymalnie ${max} znaków.`);
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
  amount: z
    .number()
    .finite("Wpisz poprawną kwotę.")
    .min(0, "Dopłata nie może być ujemna.")
    .max(500000, "Dopłata nie może przekraczać 500 000 zł.")
    .multipleOf(0.01, "Wpisz kwotę z maksymalnie dwoma miejscami po przecinku."),
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
const legacyTransportType = z.enum(["coach", "plane", "train", "own", "other"]);
const transportType = z.enum(["coach", "plane", "train", "own", "other", "vhs_bus"]);
export type TransportType = z.infer<typeof transportType>;
export const transportLabels: Record<TransportType, string> = {
  coach: "Autokar",
  plane: "Samolot",
  train: "Pociąg",
  own: "Dojazd własny",
  other: "Inny",
  vhs_bus: "Bus VHS",
};

const transportSchema = z
  .object({
    enabled: z.boolean(),
    type: legacyTransportType.optional(),
    types: z
      .array(transportType)
      .refine((types) => new Set(types).size === types.length)
      .optional(),
    customType: text(120).optional(),
    description: text(3000),
    journeys: z.array(journeySchema).max(2),
  })
  .refine((transport) => (transport.type === undefined) !== (transport.types === undefined), {
    path: ["types"],
    message: "Nieprawidłowy wybór rodzaju transportu.",
  });

type Transport = z.infer<typeof transportSchema>;
export const getTransportTypes = (transport: Transport): readonly TransportType[] =>
  transport.types ?? (transport.type ? [transport.type] : []);

export const hasOrganizedTransport = (transport: Transport) =>
  getTransportTypes(transport).some((type) => type !== "own");

export const PRICE_NOTE_MAX_LENGTH = 1000;

export const contentSectionsShape = {
  schemaVersion: z.literal(2).optional(),
  priceNote: text(PRICE_NOTE_MAX_LENGTH).optional(),
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
  transport: transportSchema.optional(),
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
      return { enabled: true, types: [], customType: "", description: "", journeys: [] };
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
  if (!result.success && (typeof input !== "object" || input === null || Array.isArray(input))) {
    return result.error.issues;
  }
  const structureIssues = result.success ? [] : result.error.issues;
  const invalidSections = new Set(structureIssues.map((issue) => issue.path[0]));
  const content = result.success
    ? result.data
    : contentSectionsSchema.parse(
        Object.fromEntries(
          Object.entries(input as Record<string, unknown>).filter(
            ([key]) => !invalidSections.has(key),
          ),
        ),
      );
  const issues = [...structureIssues, ...getContentIdentityIssues(input, kind)];
  const error = (path: (string | number)[], message: string) =>
    issues.push({ code: "custom", path, message });
  const required = (value: string, path: (string | number)[], message: string) => {
    if (value.trim().length < 3) error(path, message);
  };
  const price = (value: ExtraPrice, path: (string | number)[]) => {
    if (value.kind === "included" && value.amount !== 0)
      error([...path, "amount"], "W cenie nie może zawierać dopłaty.");
    if (value.kind === "extra")
      required(value.unit, [...path, "unit"], "Wpisz jednostkę dopłaty, np. za osobę.");
  };
  if (sectionIsEnabled(content.accommodation))
    required(
      content.accommodation!.description,
      ["accommodation", "description"],
      "Wpisz opis zakwaterowania (co najmniej 3 znaki).",
    );
  if (sectionIsEnabled(content.resort)) {
    required(
      content.resort!.name,
      ["resort", "name"],
      "Wpisz nazwę resortu (co najmniej 3 znaki).",
    );
    required(
      content.resort!.description,
      ["resort", "description"],
      "Wpisz opis resortu (co najmniej 3 znaki).",
    );
  }
  for (const key of ["training", "insurance"] as const) {
    const section = content[key];
    if (!sectionIsEnabled(section)) continue;
    required(
      section!.description,
      [key, "description"],
      key === "training"
        ? "Wpisz wstęp do sekcji Szkolenia (co najmniej 3 znaki)."
        : "Wpisz wstęp do sekcji Ubezpieczenie (co najmniej 3 znaki).",
    );
    const cards = key === "training" ? content.training!.items : content.insurance!.packages;
    const collection = key === "training" ? "items" : "packages";
    if (key === "insurance" && !cards.length)
      error([key, collection], "Dodaj co najmniej jedną kartę.");
    cards.forEach((item, index) => {
      const path = [key, collection, index];
      required(item.title, [...path, "title"], "Wpisz nagłówek karty (co najmniej 3 znaki).");
      required(
        item.description,
        [...path, "description"],
        "Wpisz opis karty (co najmniej 3 znaki).",
      );
      price(item.price, [...path, "price"]);
      if ("risks" in item) {
        if (!item.risks.length)
          error([...path, "risks"], "Dodaj co najmniej jeden zakres ochrony.");
        item.risks.forEach((risk, i) => {
          required(
            risk.label,
            [...path, "risks", i, "label"],
            "Wpisz nazwę zakresu ochrony (co najmniej 3 znaki).",
          );
          if (!risk.value.trim())
            error([...path, "risks", i, "value"], "Wpisz limit lub opis ochrony.");
        });
      }
    });
    if (key === "insurance")
      content.insurance!.extensions.forEach((item, i) => {
        required(
          item.title,
          [key, "extensions", i, "title"],
          "Wpisz nazwę rozszerzenia (co najmniej 3 znaki).",
        );
        price(item.price, [key, "extensions", i, "price"]);
      });
  }
  if (sectionIsEnabled(content.transport)) {
    const transport = content.transport!;
    required(
      transport.description,
      ["transport", "description"],
      "Wpisz opis organizacyjny transportu (co najmniej 3 znaki).",
    );
    const types = getTransportTypes(transport);
    if (!types.length)
      error(["transport", "types"], "Wybierz co najmniej jeden rodzaj transportu.");
    if (types.includes("other"))
      required(
        transport.customType ?? "",
        ["transport", "customType"],
        "Wpisz nazwę wybranego rodzaju transportu.",
      );
    if (hasOrganizedTransport(transport)) {
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
        error(
          ["transport", "journeys"],
          kind === "trip"
            ? "Uzupełnij dane wyjazdu i powrotu."
            : "Uzupełnij transport każdego turnusu.",
        );
      if (
        kind === "day_camp" &&
        (new Set(transport.journeys.map((j) => j.termId)).size !== transport.journeys.length ||
          terms.some((term) => !term.id || !transport.journeys.some((j) => j.termId === term.id)))
      )
        error(["transport", "journeys"], "Transport musi być przypisany do właściwych turnusów.");
      transport.journeys.forEach((journey, i) => {
        const path = ["transport", "journeys", i];
        for (const field of ["departureDate", "returnDate"] as const)
          if (!isValidIsoDate(journey[field])) error([...path, field], "Wpisz poprawną datę.");
        for (const field of ["departureTime", "returnTime"] as const)
          if (journey[field] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(journey[field]))
            error([...path, field], "Wpisz poprawną godzinę.");
        required(
          journey.departurePlace,
          [...path, "departurePlace"],
          "Wpisz miejsce zbiórki (co najmniej 3 znaki).",
        );
        required(
          journey.returnPlace,
          [...path, "returnPlace"],
          "Wpisz miejsce powrotu (co najmniej 3 znaki).",
        );
        if (isValidIsoDate(journey.departureDate) && isValidIsoDate(journey.returnDate)) {
          if (journey.returnDate < journey.departureDate) {
            error(
              [...path, "returnDate"],
              "Data powrotu nie może być wcześniejsza niż data wyjazdu.",
            );
          } else if (
            journey.returnDate === journey.departureDate &&
            journey.departureTime &&
            journey.returnTime &&
            journey.returnTime < journey.departureTime
          ) {
            error(
              [...path, "returnTime"],
              "Godzina powrotu nie może być wcześniejsza niż godzina wyjazdu.",
            );
          }
        }
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
