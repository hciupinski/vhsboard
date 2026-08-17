import { supabase } from "../supabase";
import {
  editorOfferInputSchema,
  type EditableOffer,
  type EditableOfferInput,
} from "./editor-schema";
import { OfferRepositoryError } from "./public-repository";
import type { OfferStatus } from "./types";

const ADMIN_COLUMNS =
  "id,slug,activity,title,subtitle,short_description,description,location,start_date,end_date,duration_days,group_size_min,group_size_max,price_from,currency,booking_url,hero_image,status";
const OFFER_IMAGES_BUCKET = "offer-images";
const SIGNED_URL_TTL_SECONDS = 3600;
const PUBLISH_READINESS_MESSAGE = "Dodaj obraz główny z opisem alternatywnym przed publikacją.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOfferStatus = (value: unknown): value is OfferStatus =>
  value === "draft" || value === "published" || value === "archived";

const isDuplicateSlugError = (error: unknown): boolean => isRecord(error) && error.code === "23505";

const throwRepositoryError = (error: unknown, message: string): never => {
  if (error instanceof OfferRepositoryError) {
    throw error;
  }

  throw new OfferRepositoryError(message, { cause: error });
};

const throwMutationError = (error: unknown, message: string): never => {
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

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const toEditableOfferInput = (row: Record<string, unknown>): EditableOfferInput =>
  editorOfferInputSchema.parse({
    slug: row.slug,
    activity: row.activity,
    title: row.title,
    subtitle: row.subtitle,
    shortDescription: row.short_description,
    content: row.description,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    durationDays: row.duration_days,
    groupSizeMin: row.group_size_min,
    groupSizeMax: row.group_size_max,
    priceFrom: row.price_from,
    currency: row.currency,
    bookingUrl: row.booking_url,
    heroImagePath: row.hero_image,
  });

const toEditableOffer = (value: unknown): EditableOffer => {
  if (!isRecord(value) || typeof value.id !== "string" || !isOfferStatus(value.status)) {
    throw new OfferRepositoryError("Nie udało się odczytać danych oferty.");
  }

  return {
    id: value.id,
    ...toEditableOfferInput(value),
    status: value.status,
  };
};

const toOfferRow = (input: EditableOfferInput) => ({
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
  hero_image: input.heroImagePath,
});

export const listAdminOffers = async (): Promise<EditableOffer[]> => {
  try {
    const { data, error } = await supabase.from("offers").select(ADMIN_COLUMNS);

    if (error) {
      throw new OfferRepositoryError("Nie udało się pobrać ofert.", { cause: error });
    }

    return ensureRows(data, "Nie udało się odczytać ofert.").map(toEditableOffer);
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

export const canPublishOffer = async (id: string): Promise<boolean> => {
  try {
    const { data: offerData, error: offerError } = await supabase
      .from("offers")
      .select(ADMIN_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (offerError) {
      throw new OfferRepositoryError("Nie udało się sprawdzić gotowości oferty.", {
        cause: offerError,
      });
    }

    if (offerData === null || !isRecord(offerData)) {
      return false;
    }

    const { heroImagePath } = toEditableOfferInput(offerData);
    if (heroImagePath === null) {
      return false;
    }

    const { data: imageData, error: imageError } = await supabase
      .from("offer_images")
      .select("alt_text")
      .eq("offer_id", id)
      .eq("storage_path", heroImagePath)
      .maybeSingle();

    if (imageError) {
      throw new OfferRepositoryError("Nie udało się sprawdzić gotowości oferty.", {
        cause: imageError,
      });
    }

    const altText = getStringField(imageData, "alt_text")?.trim();
    return (
      altText !== undefined && altText !== null && altText.length >= 5 && altText.length <= 180
    );
  } catch (error) {
    return throwRepositoryError(error, "Nie udało się sprawdzić gotowości oferty.");
  }
};

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

    if (error) {
      throw new OfferRepositoryError(errorMessage, { cause: error });
    }

    return toEditableOffer(data);
  } catch (error) {
    return throwRepositoryError(error, errorMessage);
  }
};

export const setOfferStatus = async (
  id: string,
  status: "draft" | "published",
): Promise<EditableOffer> => {
  if (status === "published" && !(await canPublishOffer(id))) {
    throw new OfferRepositoryError(PUBLISH_READINESS_MESSAGE);
  }

  return updateOfferStatus(id, status, "Nie udało się zmienić statusu oferty.");
};

export const archiveOffer = async (id: string): Promise<EditableOffer> =>
  updateOfferStatus(id, "archived", "Nie udało się zarchiwizować oferty.");

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
