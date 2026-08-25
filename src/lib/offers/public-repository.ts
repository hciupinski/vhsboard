import { supabase } from "../supabase";
import { mapOfferDetailRow, mapOfferListRow } from "./mapper";
import { publishedOfferSeoRowSchema } from "./schema";
import type { OfferKind, PublicOffer, PublishedOfferSeoRecord } from "./types";

const PUBLISHED_STATUS = "published";
const OFFER_IMAGES_BUCKET = "offer-images";
const SIGNED_URL_TTL_SECONDS = 3600;
const LIST_COLUMNS =
  "id,slug,offer_kind,activity,title,subtitle,short_description,location,start_date,end_date,duration_days,group_size_min,group_size_max,price_from,currency,booking_url,hero_image,status";
const DETAIL_COLUMNS = `${LIST_COLUMNS},description`;
const IMAGE_COLUMNS = "id,offer_id,storage_path,alt_text,position";
const SEO_COLUMNS = "slug,updated_at,offer_kind";

export class OfferRepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OfferRepositoryError";
  }
}

const rethrowAsRepositoryError = (error: unknown, message: string): never => {
  if (error instanceof OfferRepositoryError) {
    throw error;
  }

  throw new OfferRepositoryError(message, { cause: error });
};

const ensureRows = (data: unknown, message: string): unknown[] => {
  if (!Array.isArray(data)) {
    throw new OfferRepositoryError(message);
  }

  return data;
};

const getStringField = (value: unknown, field: string): string | null => {
  if (typeof value !== "object" || value === null || !(field in value)) {
    return null;
  }

  const fieldValue = Object.entries(value).find(([key]) => key === field)?.[1];
  return typeof fieldValue === "string" && fieldValue.length > 0 ? fieldValue : null;
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

export const resolvePublishedImageUrls = async (paths: string[]): Promise<Map<string, string>> => {
  if (typeof window === "undefined") {
    return new Map();
  }

  const uniquePaths = [...new Set(paths)];
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

    if (!Array.isArray(data)) {
      throw new OfferRepositoryError("Nie udało się pobrać obrazów oferty.");
    }

    const signedUrls = new Map<string, string>();
    for (const signedImage of data) {
      const path = getStringField(signedImage, "path");
      const signedUrl = getStringField(signedImage, "signedUrl");
      if (path !== null && signedUrl !== null && isHttpsUrl(signedUrl)) {
        signedUrls.set(path, signedUrl);
      }
    }

    return signedUrls;
  } catch (error) {
    return rethrowAsRepositoryError(error, "Nie udało się pobrać obrazów oferty.");
  }
};

export const listPublishedOffers = async (kind: OfferKind = "trip"): Promise<PublicOffer[]> => {
  try {
    const { data, error } = await supabase
      .from("offers")
      .select(LIST_COLUMNS)
      .eq("status", PUBLISHED_STATUS)
      .eq("offer_kind", kind);

    if (error) {
      throw new OfferRepositoryError("Nie udało się pobrać opublikowanych ofert.", {
        cause: error,
      });
    }

    const rows = ensureRows(data, "Nie udało się odczytać opublikowanych ofert.");
    const signedUrls = await resolvePublishedImageUrls(extractImagePaths(rows, "hero_image"));

    return rows.map((row) => mapOfferListRow(row, signedUrls));
  } catch (error) {
    return rethrowAsRepositoryError(error, "Nie udało się pobrać opublikowanych ofert.");
  }
};

export const listPublishedOfferSeoRecords = async (): Promise<PublishedOfferSeoRecord[]> => {
  try {
    const { data, error } = await supabase
      .from("offers")
      .select(SEO_COLUMNS)
      .eq("status", PUBLISHED_STATUS);

    if (error) {
      throw new OfferRepositoryError("Nie udało się pobrać danych SEO ofert.", { cause: error });
    }

    return ensureRows(data, "Nie udało się odczytać danych SEO ofert.").map((row) => {
      const parsed = publishedOfferSeoRowSchema.parse(row);
      return { slug: parsed.slug, updatedAt: parsed.updated_at, offerKind: parsed.offer_kind };
    });
  } catch (error) {
    return rethrowAsRepositoryError(error, "Nie udało się pobrać danych SEO ofert.");
  }
};

export const getPublishedOfferBySlug = async (
  slug: string,
  kind: OfferKind = "trip",
): Promise<PublicOffer | null> => {
  try {
    const { data: offerData, error: offerError } = await supabase
      .from("offers")
      .select(DETAIL_COLUMNS)
      .eq("slug", slug)
      .eq("status", PUBLISHED_STATUS)
      .eq("offer_kind", kind)
      .maybeSingle();

    if (offerError) {
      throw new OfferRepositoryError("Nie udało się pobrać oferty.", { cause: offerError });
    }

    if (offerData === null) {
      return null;
    }

    const { data: imageData, error: imageError } = await supabase
      .from("offer_images")
      .select(IMAGE_COLUMNS)
      .eq("offer_id", getStringField(offerData, "id") ?? "")
      .order("position", { ascending: true });

    if (imageError) {
      throw new OfferRepositoryError("Nie udało się pobrać obrazów oferty.", { cause: imageError });
    }

    const imageRows = ensureRows(imageData, "Nie udało się odczytać obrazów oferty.");
    const paths = [
      ...extractImagePaths([offerData], "hero_image"),
      ...extractImagePaths(imageRows, "storage_path"),
    ];
    const signedUrls = await resolvePublishedImageUrls(paths);

    return mapOfferDetailRow(offerData, imageRows, signedUrls);
  } catch (error) {
    return rethrowAsRepositoryError(error, "Nie udało się pobrać oferty.");
  }
};
