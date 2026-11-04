import { supabase } from "../supabase";
import { createDocumentPath, isDocumentPath } from "./path";
import { validateDocumentFile } from "./validation";

const BUCKET = "contact-documents";
const TTL_SECONDS = 3600;

export type RentalDocument = { path: string; signedUrl: string };

export async function getRentalDocument(): Promise<RentalDocument | null> {
  const { data, error } = await supabase
    .from("portal_rental_document")
    .select("storage_path")
    .eq("id", 1)
    .single();
  if (error || !data) throw new Error("Nie udało się pobrać oferty wypożyczalni.");
  const path = data.storage_path;
  if (path === null) return null;
  if (typeof path !== "string" || !isDocumentPath(path)) throw new Error("Nieprawidłowy dokument.");
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL_SECONDS);
  if (signed.error || !signed.data?.signedUrl) throw new Error("Nie udało się otworzyć dokumentu.");
  let url: URL;
  try {
    url = new URL(signed.data.signedUrl);
  } catch {
    throw new Error("Nieprawidłowy adres dokumentu.");
  }
  if (url.protocol !== "https:") throw new Error("Nieprawidłowy adres dokumentu.");
  return { path, signedUrl: url.toString() };
}

async function cleanup(path: string | null) {
  if (!path || !isDocumentPath(path)) return;
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) console.error("rental_document_cleanup_failed", { path });
  } catch {
    console.error("rental_document_cleanup_failed", { path });
  }
}

export async function replaceRentalDocument(file: File): Promise<void> {
  const valid = validateDocumentFile(file);
  if (!valid.ok) throw new Error(valid.error.message);
  const path = createDocumentPath(crypto.randomUUID());
  const storage = supabase.storage.from(BUCKET);
  const { error } = await storage.upload(
    path,
    new Blob([await file.arrayBuffer()], { type: file.type }),
    {
      contentType: file.type,
      upsert: false,
    },
  );
  if (error) throw new Error("Nie udało się wgrać dokumentu.");
  const result = await supabase.rpc("replace_portal_rental_document", { p_path: path });
  if (result.error) {
    await cleanup(path);
    throw new Error("Nie udało się zapisać oferty wypożyczalni.");
  }
  await cleanup(typeof result.data === "string" ? result.data : null);
}

export async function removeRentalDocument(): Promise<void> {
  const result = await supabase.rpc("replace_portal_rental_document", { p_path: null });
  if (result.error) throw new Error("Nie udało się usunąć oferty wypożyczalni.");
  await cleanup(typeof result.data === "string" ? result.data : null);
}
