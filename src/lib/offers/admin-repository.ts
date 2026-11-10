import { sectionIsEnabled } from "./content-v2";
import { supabase } from "../supabase";
import { z } from "zod";
import { mapAdminPreviewOfferDetailRow } from "./mapper";
import {
  editorOfferInputSchema,
  storedEditorOfferInputSchema,
  validateOfferForPublication,
  type EditableOffer,
  type EditableOfferInput,
} from "./editor-schema";
import { OfferRepositoryError } from "./offer-repository-error";
import type { OfferKind, OfferStatus, PublicOffer } from "./types";
import { readOfferImageRows } from "./image-rows";
import {
  accommodationPhotoRequired,
  heroRequired,
  publicationContentRequired,
  type OfferImageReadiness,
} from "./publication-readiness";

const ADMIN_COLUMNS =
  "id,slug,offer_kind,activity,title,subtitle,short_description,description,location,start_date,end_date,duration_days,group_size_min,group_size_max,price_from,currency,booking_url,show_last_places_badge,hero_image,status";
const ADMIN_LIST_COLUMNS = `${ADMIN_COLUMNS},updated_at`;
const OFFER_IMAGES_BUCKET = "offer-images";
const SIGNED_URL_TTL_SECONDS = 3600;
const updatedAtSchema = z.string().datetime({ offset: true });

export type AdminOfferListItem = EditableOffer & { updatedAt: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOfferStatus = (value: unknown): value is OfferStatus =>
  value === "draft" || value === "published" || value === "archived";

const isDuplicateSlugError = (error: unknown): boolean =>
  isRecord(error) && error["code"] === "23505";

const throwRepositoryError = (error: unknown, message: string): never => {
  if (error instanceof OfferRepositoryError) {
    throw error;
  }

  throw new OfferRepositoryError(message, { cause: error });
};

const publicationMessages = new Map([
  ["Opublikowana oferta wymaga obrazu głównego z poprawnym opisem alternatywnym.", heroRequired],
  [
    "Opublikowana oferta z zakwaterowaniem wymaga co najmniej jednego zdjęcia.",
    accommodationPhotoRequired,
  ],
  [
    "Opublikowana oferta wymaga kompletnej treści właściwej dla rodzaju.",
    publicationContentRequired,
  ],
  [
    "Opublikowana oferta wymaga poprawnego HTTPS URL-a zapisów.",
    "Wpisz poprawny adres zapisów HTTPS.",
  ],
]);

const throwMutationError = (error: unknown, message: string): never => {
  if (
    isRecord(error) &&
    typeof error["message"] === "string" &&
    error["message"].includes("Odśwież CMS")
  )
    throw new OfferRepositoryError("Odśwież CMS przed zapisaniem oferty.", { cause: error });
  if (isRecord(error) && error["code"] === "23514" && typeof error["message"] === "string") {
    const publicationMessage = publicationMessages.get(error["message"]);
    if (publicationMessage) throw new OfferRepositoryError(publicationMessage, { cause: error });
  }
  if (isDuplicateSlugError(error)) {
    throw new OfferRepositoryError("Taki adres oferty już istnieje", { cause: error });
  }

  return throwRepositoryError(error, message);
};

const ensureRows = (data: unknown, message: string): unknown[] => {
  if (!Array.isArray(data)) {
    throw new OfferRepositoryError(message);
  }

  return data;
};

const getStringField = (value: unknown, field: string): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  const fieldValue = value[field];
  return typeof fieldValue === "string" ? fieldValue : null;
};

const extractImagePaths = (rows: unknown[], field: string): string[] =>
  rows.flatMap((row) => {
    const path = getStringField(row, field);
    return path === null ? [] : [path];
  });

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const toEditableOfferInput = (row: Record<string, unknown>): EditableOfferInput =>
  storedEditorOfferInputSchema.parse({
    offerKind: row["offer_kind"],
    slug: row["slug"],
    activity:
      row["offer_kind"] !== "day_camp" && row["activity"] !== "surf" && row["activity"] !== "snow"
        ? ""
        : row["activity"],
    title: row["title"],
    subtitle: row["subtitle"],
    shortDescription: row["short_description"],
    content: row["description"],
    location: row["location"],
    startDate: row["start_date"],
    endDate: row["end_date"],
    durationDays: row["duration_days"],
    groupSizeMin: row["group_size_min"],
    groupSizeMax: row["group_size_max"],
    priceFrom: row["price_from"],
    currency: row["currency"],
    bookingUrl: row["booking_url"],
    showLastPlacesBadge: row["show_last_places_badge"],
    heroImagePath: row["hero_image"],
  });

const toEditableOffer = (value: unknown): EditableOffer => {
  if (!isRecord(value) || typeof value["id"] !== "string" || !isOfferStatus(value["status"])) {
    throw new OfferRepositoryError("Nie udało się odczytać danych oferty.");
  }

  return {
    id: value["id"],
    ...toEditableOfferInput(value),
    status: value["status"],
  };
};

const toAdminOfferListItem = (value: unknown): AdminOfferListItem => {
  const offer = toEditableOffer(value);
  const parsedUpdatedAt = updatedAtSchema.safeParse(
    isRecord(value) ? value["updated_at"] : undefined,
  );

  if (!parsedUpdatedAt.success) {
    throw new OfferRepositoryError("Nie udało się odczytać danych oferty.", {
      cause: parsedUpdatedAt.error,
    });
  }

  return { ...offer, updatedAt: parsedUpdatedAt.data };
};

const toOfferRow = (input: EditableOfferInput) => ({
  offer_kind: input.offerKind ?? "trip",
  slug: input.slug,
  activity: input.activity,
  title: input.title,
  subtitle: input.subtitle,
  short_description: input.shortDescription,
  description: input.content,
  location: input.location,
  start_date: input.startDate,
  end_date: input.endDate,
  duration_days: input.durationDays,
  group_size_min: input.groupSizeMin,
  group_size_max: input.groupSizeMax,
  price_from: input.priceFrom,
  currency: input.currency,
  booking_url: input.bookingUrl,
  show_last_places_badge: input.showLastPlacesBadge,
  hero_image: input.heroImagePath,
});

export const listAdminOffers = async (): Promise<AdminOfferListItem[]> => {
  try {
    const { data, error } = await supabase.from("offers").select(ADMIN_LIST_COLUMNS);

    if (error) {
      throw new OfferRepositoryError("Nie udało się pobrać ofert.", { cause: error });
    }

    return ensureRows(data, "Nie udało się odczytać ofert.").map(toAdminOfferListItem);
  } catch (error) {
    return throwRepositoryError(error, "Nie udało się pobrać ofert.");
  }
};

export const getAdminOffer = async (slug: string): Promise<EditableOffer | null> => {
  try {
    const { data, error } = await supabase
      .from("offers")
      .select(ADMIN_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new OfferRepositoryError("Nie udało się pobrać oferty.", { cause: error });
    }

    return data === null ? null : toEditableOffer(data);
  } catch (error) {
    return throwRepositoryError(error, "Nie udało się pobrać oferty.");
  }
};

export const getAdminPreviewOfferBySlug = async (
  slug: string,
  kind: OfferKind,
): Promise<PublicOffer | null> => {
  try {
    const { data: offerData, error: offerError } = await supabase
      .from("offers")
      .select(ADMIN_COLUMNS)
      .eq("slug", slug)
      .eq("offer_kind", kind)
      .maybeSingle();

    if (offerError) {
      throw new OfferRepositoryError("Nie udało się pobrać oferty.", { cause: offerError });
    }

    if (offerData === null) {
      return null;
    }

    const { data: imageData, error: imageError } = await readOfferImageRows(
      getStringField(offerData, "id") ?? "",
    );

    if (imageError) {
      throw new OfferRepositoryError("Nie udało się pobrać obrazów oferty.", { cause: imageError });
    }

    const imageRows = ensureRows(imageData, "Nie udało się odczytać obrazów oferty.");
    const signedUrls = await resolveAdminImageUrls([
      ...extractImagePaths([offerData], "hero_image"),
      ...extractImagePaths(imageRows, "storage_path"),
    ]);

    return mapAdminPreviewOfferDetailRow(offerData, imageRows, signedUrls);
  } catch (error) {
    return throwRepositoryError(error, "Nie udało się pobrać oferty.");
  }
};

export const createOffer = async (input: EditableOfferInput): Promise<EditableOffer> => {
  try {
    const parsedInput = editorOfferInputSchema.parse(input);
    const { data, error } = await supabase
      .from("offers")
      .insert({ ...toOfferRow(parsedInput), status: "draft" })
      .select(ADMIN_COLUMNS)
      .single();

    if (error) {
      return throwMutationError(error, "Nie udało się zapisać oferty.");
    }

    return toEditableOffer(data);
  } catch (error) {
    return throwMutationError(error, "Nie udało się zapisać oferty.");
  }
};

export const updateOffer = async (
  id: string,
  input: EditableOfferInput,
): Promise<EditableOffer> => {
  try {
    const parsedInput = editorOfferInputSchema.parse(input);
    const { data, error } = await supabase
      .from("offers")
      .update(toOfferRow(parsedInput))
      .eq("id", id)
      .select(ADMIN_COLUMNS)
      .single();

    if (error) {
      return throwMutationError(error, "Nie udało się zapisać oferty.");
    }

    return toEditableOffer(data);
  } catch (error) {
    return throwMutationError(error, "Nie udało się zapisać oferty.");
  }
};

const readinessError = "Nie udało się sprawdzić gotowości oferty.";

const hasReadyHero = async (id: string, heroImagePath: string | null): Promise<boolean> => {
  if (!heroImagePath) return false;
  const { data, error } = await supabase
    .from("offer_images")
    .select("alt_text")
    .eq("offer_id", id)
    .eq("storage_path", heroImagePath)
    .eq("category", "gallery")
    .maybeSingle();

  if (error) return throwRepositoryError(error, readinessError);
  const altLength = getStringField(data, "alt_text")?.trim().length ?? 0;
  return altLength >= 5 && altLength <= 180;
};

const hasAccommodationPhoto = async (id: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("offer_images")
    .select("id")
    .eq("offer_id", id)
    .eq("category", "accommodation")
    .limit(1)
    .maybeSingle();
  if (error) return throwRepositoryError(error, readinessError);
  return data !== null;
};

export const getOfferImageReadiness = async (
  id: string,
  heroImagePath: string | null,
): Promise<OfferImageReadiness> => {
  const [heroReady, accommodationReady] = await Promise.all([
    hasReadyHero(id, heroImagePath),
    hasAccommodationPhoto(id),
  ]);
  return { heroReady, accommodationReady };
};

const getPublicationIssue = async (id: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("offers")
      .select(ADMIN_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) return throwRepositoryError(error, readinessError);
    if (!isRecord(data)) return "Nie znaleziono oferty. Odśwież listę ofert.";

    const editable = toEditableOfferInput(data);
    if (!validateOfferForPublication(editable).success) return publicationContentRequired;
    if (!(await hasReadyHero(id, editable.heroImagePath))) return heroRequired;
    if (sectionIsEnabled(editable.content.accommodation) && !(await hasAccommodationPhoto(id))) {
      return accommodationPhotoRequired;
    }
    return null;
  } catch (error) {
    return throwRepositoryError(error, readinessError);
  }
};

export const canPublishOffer = async (id: string): Promise<boolean> =>
  (await getPublicationIssue(id)) === null;

const updateOfferStatus = async (
  id: string,
  status: OfferStatus,
  errorMessage: string,
): Promise<EditableOffer> => {
  try {
    const { data, error } = await supabase
      .from("offers")
      .update({ status })
      .eq("id", id)
      .select(ADMIN_COLUMNS)
      .single();

    if (error) return throwMutationError(error, errorMessage);

    return toEditableOffer(data);
  } catch (error) {
    return throwRepositoryError(error, errorMessage);
  }
};

export const setOfferStatus = async (
  id: string,
  status: "draft" | "published",
): Promise<EditableOffer> => {
  if (status === "published") {
    const issue = await getPublicationIssue(id);
    if (issue) throw new OfferRepositoryError(issue);
  }

  return updateOfferStatus(id, status, "Nie udało się zmienić statusu oferty.");
};

export const archiveOffer = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("offers").update({ status: "archived" }).eq("id", id);

    if (error) {
      throw new OfferRepositoryError("Nie udało się zarchiwizować oferty.", { cause: error });
    }
  } catch (error) {
    return throwRepositoryError(error, "Nie udało się zarchiwizować oferty.");
  }
};

export const resolveAdminImageUrls = async (paths: string[]): Promise<Map<string, string>> => {
  if (typeof window === "undefined") {
    return new Map();
  }

  const uniquePaths = [...new Set(paths.map((path) => path.trim()).filter(Boolean))];
  if (uniquePaths.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await supabase.storage
      .from(OFFER_IMAGES_BUCKET)
      .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);

    if (error) {
      throw new OfferRepositoryError("Nie udało się pobrać obrazów oferty.", { cause: error });
    }

    const rows = ensureRows(data, "Nie udało się odczytać obrazów oferty.");
    const requestedPaths = new Set(uniquePaths);
    const signedUrls = new Map<string, string>();

    for (const row of rows) {
      const path = getStringField(row, "path");
      const signedUrl = getStringField(row, "signedUrl");
      if (
        path !== null &&
        requestedPaths.has(path) &&
        signedUrl !== null &&
        isHttpsUrl(signedUrl)
      ) {
        signedUrls.set(path, signedUrl);
      }
    }

    return signedUrls;
  } catch (error) {
    return throwRepositoryError(error, "Nie udało się pobrać obrazów oferty.");
  }
};
