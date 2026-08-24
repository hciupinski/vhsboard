export const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type ImageValidationError = {
  code: "typ" | "format" | "rozszerzenie" | "rozmiar";
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
  if (!file.type) return error("typ", "Plik nie ma określonego typu MIME.");

  const extension = imageExtensionForMimeType(file.type);
  if (!extension) return error("format", "Format obrazu nie jest obsługiwany.");

  if (file.size > MAX_IMAGE_BYTES) {
    return error("rozmiar", "Obraz przekracza maksymalny rozmiar 8 MiB.");
  }

  const fileExtension = file.name.split(".").at(-1)?.toLowerCase();
  if (fileExtension !== extension) {
    return error("rozszerzenie", "Rozszerzenie pliku nie pasuje do jego typu MIME.");
  }

  return { ok: true, value: undefined };
};
