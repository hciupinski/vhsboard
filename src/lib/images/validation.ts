export const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type ImageValidationError = {
  code: "typ" | "format" | "rozszerzenie" | "rozmiar" | "pusty";
  message: string;
};

type ImageExtension = "jpeg" | "png" | "webp";

const error = (
  code: ImageValidationError["code"],
  message: string,
): Result<void, ImageValidationError> => ({ ok: false, error: { code, message } });

export const imageExtensionForMimeType = (mimeType: string): ImageExtension | undefined => {
  switch (mimeType) {
    case "image/jpeg":
      return "jpeg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return undefined;
  }
};

export const validateImageFile = (file: File): Result<void, ImageValidationError> => {
  if (file.size === 0) return error("pusty", "Plik jest pusty. Wybierz inny plik zdjęcia.");
  if (!file.type)
    return error("typ", "Nie można rozpoznać typu pliku. Wybierz zdjęcie JPG, PNG lub WebP.");

  const extension = imageExtensionForMimeType(file.type);
  if (!extension)
    return error("format", "Nieobsługiwany format obrazu. Wybierz plik JPG, PNG lub WebP.");

  if (file.size > MAX_IMAGE_BYTES) {
    return error("rozmiar", "Plik jest za duży. Maksymalny rozmiar zdjęcia to 8 MiB.");
  }

  const fileExtension = file.name.includes(".")
    ? file.name.split(".").at(-1)?.toLowerCase()
    : undefined;
  if (!fileExtension || !["jpg", "jpeg", "png", "webp"].includes(fileExtension)) {
    return error(
      "rozszerzenie",
      "Nieobsługiwane rozszerzenie pliku. Wybierz zdjęcie z rozszerzeniem JPG, JPEG, PNG lub WebP.",
    );
  }
  const isJpegAlias = extension === "jpeg" && fileExtension === "jpg";
  if (fileExtension !== extension && !isJpegAlias) {
    return error(
      "rozszerzenie",
      `Rozszerzenie .${fileExtension} nie pasuje do typu obrazu ${extension.toUpperCase()}. Wybierz plik zapisany jako JPG, PNG lub WebP.`,
    );
  }

  return { ok: true, value: undefined };
};
