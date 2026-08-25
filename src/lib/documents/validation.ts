export const PDF_MIME_TYPE = "application/pdf";
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type DocumentValidationError = {
  code: "typ" | "rozszerzenie" | "rozmiar" | "nazwa";
  message: string;
};

const invalid = (
  code: DocumentValidationError["code"],
  message: string,
): Result<never, DocumentValidationError> => ({ ok: false, error: { code, message } });

export const validateDocumentFile = (file: File): Result<void, DocumentValidationError> => {
  if (file.type !== PDF_MIME_TYPE) {
    return invalid("typ", "Wybierz plik PDF.");
  }

  if (file.name.split(".").at(-1)?.toLowerCase() !== "pdf") {
    return invalid("rozszerzenie", "Plik musi mieć rozszerzenie .pdf.");
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return invalid("rozmiar", "Plik PDF przekracza maksymalny rozmiar 10 MiB.");
  }

  return { ok: true, value: undefined };
};

export const validateDocumentTitle = (title: string): Result<string, DocumentValidationError> => {
  const normalizedTitle = title.trim();
  if (normalizedTitle.length < 3 || normalizedTitle.length > 160) {
    return invalid("nazwa", "Nazwa dokumentu musi mieć od 3 do 160 znaków.");
  }

  return { ok: true, value: normalizedTitle };
};
