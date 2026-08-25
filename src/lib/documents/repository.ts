import { supabase } from "../supabase";
import { createDocumentPath, isDocumentPath } from "./path";
import { contactDocumentRowSchema, type ContactDocumentRow } from "./schema";
import type { ContactDocument } from "./types";
import { validateDocumentFile, validateDocumentTitle } from "./validation";

const BUCKET = "contact-documents";
const COLUMNS = "id,title,storage_path,position";
const SIGNED_URL_TTL_SECONDS = 3600;

export class DocumentRepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DocumentRepositoryError";
  }
}

export class DocumentCleanupPendingError extends DocumentRepositoryError {
  constructor(readonly storagePath: string) {
    super("Dokument usunięto z listy, ale usunięcie pliku wymaga ponowienia.");
    this.name = "DocumentCleanupPendingError";
  }
}

const parseRow = (value: unknown): ContactDocumentRow => {
  try {
    return contactDocumentRowSchema.parse(value);
  } catch (cause) {
    throw new DocumentRepositoryError("Nie udało się odczytać dokumentu.", { cause });
  }
};

const toDocument = (value: unknown, signedUrl: string | null = null): ContactDocument => {
  const row = parseRow(value);
  return {
    id: row.id,
    title: row.title,
    path: row.storage_path,
    position: row.position,
    signedUrl,
  };
};

const signedUrlsFor = async (paths: string[]): Promise<Map<string, string>> => {
  if (paths.length === 0) return new Map();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error || !Array.isArray(data))
    throw new DocumentRepositoryError("Nie udało się przygotować odnośników do dokumentów.", {
      cause: error,
    });
  return new Map(
    data.flatMap((item) => {
      if (typeof item.path !== "string" || typeof item.signedUrl !== "string") return [];
      try {
        return new URL(item.signedUrl).protocol === "https:"
          ? [[item.path, item.signedUrl] as const]
          : [];
      } catch {
        return [];
      }
    }),
  );
};

const listContactDocuments = async (): Promise<ContactDocument[]> => {
  const { data, error } = await supabase
    .from("contact_documents")
    .select(COLUMNS)
    .order("position", { ascending: true });
  if (error || !Array.isArray(data))
    throw new DocumentRepositoryError("Nie udało się pobrać dokumentów.", { cause: error });
  const rows = data.map(parseRow);
  const signedUrls = await signedUrlsFor(rows.map((row) => row.storage_path));
  return rows.map((row) => toDocument(row, signedUrls.get(row.storage_path) ?? null));
};

export const listPublicContactDocuments = listContactDocuments;
export const listAdminContactDocuments = listContactDocuments;

export const uploadContactDocument = async (
  title: string,
  file: File,
  position: number,
): Promise<ContactDocument> => {
  const validTitle = validateDocumentTitle(title);
  if (!validTitle.ok) throw new DocumentRepositoryError(validTitle.error.message);
  const validFile = validateDocumentFile(file);
  if (!validFile.ok) throw new DocumentRepositoryError(validFile.error.message);
  if (!Number.isInteger(position) || position < 0)
    throw new DocumentRepositoryError("Nieprawidłowa pozycja dokumentu.");
  const path = createDocumentPath(crypto.randomUUID());
  const storage = supabase.storage.from(BUCKET);
  const { error: uploadError } = await storage.upload(
    path,
    new Blob([await file.arrayBuffer()], { type: file.type }),
    { contentType: file.type, upsert: false },
  );
  if (uploadError)
    throw new DocumentRepositoryError("Nie udało się wgrać dokumentu.", { cause: uploadError });
  const { data, error } = await supabase
    .from("contact_documents")
    .insert({ title: validTitle.value, storage_path: path, position })
    .select(COLUMNS)
    .single();
  if (error) {
    try {
      await storage.remove([path]);
    } catch {
      /* compensation is best effort */
    }
    throw new DocumentRepositoryError(
      "Dokument został wgrany, ale nie udało się zapisać go na liście.",
      { cause: error },
    );
  }
  return toDocument(data);
};

const loadDocument = async (id: string): Promise<ContactDocumentRow> => {
  const { data, error } = await supabase
    .from("contact_documents")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || data === null)
    throw new DocumentRepositoryError("Dokument nie istnieje.", { cause: error });
  return parseRow(data);
};

const removeObject = async (path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (!error) return;
  } catch {
    /* handled below */
  }
  console.error("contact_document_cleanup_failed", { storagePath: path });
  throw new DocumentCleanupPendingError(path);
};

export const deleteContactDocument = async (id: string): Promise<void> => {
  const document = await loadDocument(id);
  const { error } = await supabase.from("contact_documents").delete().eq("id", id);
  if (error)
    throw new DocumentRepositoryError("Nie udało się usunąć dokumentu z listy.", { cause: error });
  await removeObject(document.storage_path);
};

export const retryContactDocumentObjectCleanup = async (path: string): Promise<void> => {
  if (!isDocumentPath(path)) throw new DocumentRepositoryError("Nieprawidłowa ścieżka dokumentu.");
  await removeObject(path);
};
