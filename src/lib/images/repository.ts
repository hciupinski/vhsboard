import { resolveAdminImageUrls } from "../offers/admin-repository";
import { offerImageRowSchema } from "../offers/schema";
import type { OfferImageRow } from "../offers/schema";
import type { OfferImage } from "../offers/types";
import { supabase } from "../supabase";
import { createImagePath } from "./path";
import { validateImageFile } from "./validation";

const OFFER_IMAGES_BUCKET = "offer-images";
const MIN_ALT_TEXT_LENGTH = 5;
const MAX_ALT_TEXT_LENGTH = 180;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STORAGE_PATH_PATTERN = new RegExp(
  `^offers/(${UUID_PATTERN.source.slice(1, -1)})/(${UUID_PATTERN.source.slice(1, -1)})\\.(jpeg|png|webp)$`,
  "i",
);

export class ImageRepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ImageRepositoryError";
  }
}

export class ImageCleanupPendingError extends ImageRepositoryError {
  readonly storagePath: string;

  constructor(storagePath: string) {
    super("Obraz usunięto z galerii, ale usunięcie pliku wymaga ponowienia.");
    this.name = "ImageCleanupPendingError";
    this.storagePath = storagePath;
  }
}

const parseOfferImageRow = (value: unknown): OfferImageRow => {
  try {
    return offerImageRowSchema.parse(value);
  } catch (error) {
    throw new ImageRepositoryError("Nie udało się odczytać obrazu galerii.", { cause: error });
  }
};

const toOfferImage = (value: unknown, signedUrl: string | null = null): OfferImage => {
  const row = parseOfferImageRow(value);
  return {
    id: row.id,
    path: row.storage_path,
    alt: row.alt_text,
    position: row.position,
    signedUrl,
  };
};

const ensureUuid = (value: string, message: string): void => {
  if (!UUID_PATTERN.test(value)) {
    throw new ImageRepositoryError(message);
  }
};

const ensureRows = (data: unknown, message: string): unknown[] => {
  if (!Array.isArray(data)) {
    throw new ImageRepositoryError(message);
  }
  return data;
};

const getImageRows = async (offerId: string): Promise<OfferImageRow[]> => {
  ensureUuid(offerId, "Nieprawidłowy identyfikator oferty.");
  const { data, error } = await supabase
    .from("offer_images")
    .select("id,offer_id,storage_path,alt_text,position")
    .eq("offer_id", offerId)
    .order("position", { ascending: true });

  if (error) {
    throw new ImageRepositoryError("Nie udało się pobrać obrazów oferty.", { cause: error });
  }

  try {
    return offerImageRowSchema.array().parse(ensureRows(data, "Nie udało się odczytać galerii."));
  } catch (parseError) {
    if (parseError instanceof ImageRepositoryError) throw parseError;
    throw new ImageRepositoryError("Nie udało się odczytać galerii.", { cause: parseError });
  }
};

const validateUploadInput = (offerId: string, file: File, altText: string, position: number) => {
  const validation = validateImageFile(file);
  if (!validation.ok) {
    throw new ImageRepositoryError(validation.error.message);
  }

  const normalizedAltText = altText.trim();
  if (
    normalizedAltText.length < MIN_ALT_TEXT_LENGTH ||
    normalizedAltText.length > MAX_ALT_TEXT_LENGTH
  ) {
    throw new ImageRepositoryError("Opis alternatywny musi mieć od 5 do 180 znaków.");
  }

  if (!Number.isInteger(position) || position < 0) {
    throw new ImageRepositoryError("Pozycja obrazu musi być nieujemną liczbą całkowitą.");
  }

  ensureUuid(offerId, "Nieprawidłowy identyfikator oferty.");

  return normalizedAltText;
};

export const uploadOfferImage = async (
  offerId: string,
  file: File,
  altText: string,
  position: number,
): Promise<OfferImage> => {
  const normalizedAltText = validateUploadInput(offerId, file, altText, position);
  const path = createImagePath(offerId, file, crypto.randomUUID());
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const storage = supabase.storage.from(OFFER_IMAGES_BUCKET);
  const { error: uploadError } = await storage.upload(path, blob, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    throw new ImageRepositoryError("Nie udało się wgrać obrazu.", { cause: uploadError });
  }

  const { data, error } = await supabase
    .from("offer_images")
    .insert({
      offer_id: offerId,
      storage_path: path,
      alt_text: normalizedAltText,
      position,
    })
    .select("id,offer_id,storage_path,alt_text,position")
    .single();

  if (error) {
    let cleanupFailed = false;
    try {
      const { error: cleanupError } = await storage.remove([path]);
      cleanupFailed = cleanupError !== null;
    } catch {
      cleanupFailed = true;
    }

    if (cleanupFailed) {
      console.error("image_upload_compensation_failed", { storagePath: path });
      throw new ImageRepositoryError(
        "Obraz został wgrany, ale nie udało się zapisać go w galerii.",
      );
    }

    throw new ImageRepositoryError("Obraz został wgrany, ale nie udało się zapisać go w galerii.", {
      cause: error,
    });
  }

  return toOfferImage(data);
};

export const listOfferImages = async (offerId: string): Promise<OfferImage[]> => {
  const rows = await getImageRows(offerId);
  const signedUrls = await resolveAdminImageUrls(rows.map((row) => row.storage_path));
  return rows.map((row) => toOfferImage(row, signedUrls.get(row.storage_path) ?? null));
};

const getImageById = async (imageId: string): Promise<OfferImageRow> => {
  ensureUuid(imageId, "Nieprawidłowy identyfikator obrazu.");
  const { data, error } = await supabase
    .from("offer_images")
    .select("id,offer_id,storage_path,alt_text,position")
    .eq("id", imageId)
    .maybeSingle();

  if (error) {
    throw new ImageRepositoryError("Nie udało się pobrać obrazu galerii.", { cause: error });
  }
  if (data === null) {
    throw new ImageRepositoryError("Obraz galerii nie istnieje.");
  }
  return parseOfferImageRow(data);
};

export const setOfferHeroImage = async (offerId: string, imageId: string): Promise<void> => {
  ensureUuid(offerId, "Nieprawidłowy identyfikator oferty.");
  ensureUuid(imageId, "Nieprawidłowy identyfikator obrazu.");
  const { data, error: imageError } = await supabase
    .from("offer_images")
    .select("id,offer_id,storage_path,alt_text,position")
    .eq("id", imageId)
    .eq("offer_id", offerId)
    .maybeSingle();

  if (imageError) {
    throw new ImageRepositoryError("Nie udało się wybrać obrazu głównego.", {
      cause: imageError,
    });
  }
  if (data === null) {
    throw new ImageRepositoryError("Wybrany obraz nie należy do tej oferty.");
  }
  const image = parseOfferImageRow(data);

  const { error: updateError } = await supabase
    .from("offers")
    .update({ hero_image: image.storage_path })
    .eq("id", offerId);
  if (updateError) {
    throw new ImageRepositoryError("Nie udało się wybrać obrazu głównego.", {
      cause: updateError,
    });
  }
};

const getHeroReferences = async (storagePath: string): Promise<unknown[]> => {
  const { data, error } = await supabase.from("offers").select("id").eq("hero_image", storagePath);
  if (error) {
    throw new ImageRepositoryError("Nie udało się sprawdzić użycia obrazu.", { cause: error });
  }
  return ensureRows(data, "Nie udało się sprawdzić użycia obrazu.");
};

const getImageReferences = async (
  storagePath: string,
  exceptImageId?: string,
): Promise<unknown[]> => {
  let query = supabase.from("offer_images").select("id").eq("storage_path", storagePath);
  if (exceptImageId !== undefined) {
    query = query.neq("id", exceptImageId);
  }
  const { data, error } = await query;
  if (error) {
    throw new ImageRepositoryError("Nie udało się sprawdzić użycia obrazu.", { cause: error });
  }
  return ensureRows(data, "Nie udało się sprawdzić użycia obrazu.");
};

const hasReferences = async (storagePath: string, exceptImageId?: string): Promise<boolean> => {
  if ((await getHeroReferences(storagePath)).length > 0) return true;
  return (await getImageReferences(storagePath, exceptImageId)).length > 0;
};

const removeObjectOrThrowCleanupPending = async (
  storagePath: string,
  imageId?: string,
): Promise<void> => {
  let cleanupFailed = false;
  try {
    const { error } = await supabase.storage.from(OFFER_IMAGES_BUCKET).remove([storagePath]);
    cleanupFailed = error !== null;
  } catch {
    cleanupFailed = true;
  }

  if (cleanupFailed) {
    console.error(
      "offer_image_cleanup_failed",
      imageId === undefined ? { storagePath } : { imageId, storagePath },
    );
    throw new ImageCleanupPendingError(storagePath);
  }
};

export const deleteOfferImage = async (imageId: string): Promise<void> => {
  const image = await getImageById(imageId);
  if ((await getHeroReferences(image.storage_path)).length > 0) {
    throw new ImageRepositoryError(
      "Nie można usunąć obrazu głównego. Najpierw wybierz inny obraz główny.",
    );
  }
  if ((await getImageReferences(image.storage_path, image.id)).length > 0) return;

  const { error: deleteError } = await supabase.from("offer_images").delete().eq("id", image.id);
  if (deleteError) {
    throw new ImageRepositoryError("Nie udało się usunąć obrazu z galerii.", {
      cause: deleteError,
    });
  }

  if (await hasReferences(image.storage_path)) return;
  await removeObjectOrThrowCleanupPending(image.storage_path, image.id);
};

export const retryOfferImageObjectCleanup = async (storagePath: string): Promise<void> => {
  if (!STORAGE_PATH_PATTERN.test(storagePath)) {
    throw new ImageRepositoryError("Nieprawidłowa ścieżka obrazu.");
  }
  if (await hasReferences(storagePath)) return;
  await removeObjectOrThrowCleanupPending(storagePath);
};

const updateImagePosition = async (
  offerId: string,
  imageId: string,
  position: number,
): Promise<void> => {
  const { error } = await supabase
    .from("offer_images")
    .update({ position })
    .eq("id", imageId)
    .eq("offer_id", offerId);
  if (error) throw error;
};

export const reorderOfferImages = async (
  offerId: string,
  orderedImageIds: string[],
): Promise<void> => {
  const currentRows = await getImageRows(offerId);
  const currentIds = new Set(currentRows.map((row) => row.id));
  const orderedIds = new Set(orderedImageIds);
  if (
    orderedImageIds.length !== currentRows.length ||
    orderedIds.size !== orderedImageIds.length ||
    [...orderedIds].some((id) => !currentIds.has(id))
  ) {
    throw new ImageRepositoryError("Kolejność musi zawierać wszystkie obrazy oferty.");
  }

  const maxPosition = currentRows.reduce((max, row) => Math.max(max, row.position), -1);
  try {
    for (const [index, imageId] of orderedImageIds.entries()) {
      await updateImagePosition(offerId, imageId, maxPosition + orderedImageIds.length + index + 1);
    }
    for (const [index, imageId] of orderedImageIds.entries()) {
      await updateImagePosition(offerId, imageId, index);
    }
  } catch {
    try {
      await getImageRows(offerId);
    } catch {
      // The mutation error remains the actionable result even if refresh also fails.
    }
    throw new ImageRepositoryError("Nie udało się zmienić kolejności obrazów.");
  }
};
