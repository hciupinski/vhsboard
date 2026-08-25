import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockedSupabase = vi.hoisted(() => ({ from: vi.fn(), storage: { from: vi.fn() } }));
vi.mock("../supabase", () => ({ supabase: mockedSupabase }));

import {
  DocumentCleanupPendingError,
  deleteContactDocument,
  listPublicContactDocuments,
  retryContactDocumentObjectCleanup,
  uploadContactDocument,
} from "./repository";

const documentId = "123e4567-e89b-12d3-a456-426614174000";
const uploadId = "223e4567-e89b-12d3-a456-426614174000";
const path = `documents/${uploadId}.pdf`;
const row = { id: documentId, title: "Regulamin", storage_path: path, position: 0 };

const query = (result: { data: unknown; error: unknown }) => {
  const value = Object.assign(Promise.resolve(result), {
    select: vi.fn(), order: vi.fn(), eq: vi.fn(), insert: vi.fn(), delete: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(),
  });
  value.select.mockReturnValue(value); value.order.mockReturnValue(value); value.eq.mockReturnValue(value);
  value.insert.mockReturnValue(value); value.delete.mockReturnValue(value); value.single.mockResolvedValue(result); value.maybeSingle.mockResolvedValue(result);
  return value;
};

beforeEach(() => {
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(uploadId);
  mockedSupabase.storage.from.mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: null }), remove: vi.fn().mockResolvedValue({ error: null }), createSignedUrls: vi.fn().mockResolvedValue({ data: [{ path, signedUrl: "https://signed.example/regulamin.pdf" }], error: null }) });
});
afterEach(() => { vi.restoreAllMocks(); vi.resetAllMocks(); });

describe("contact document repository", () => {
  it("lists metadata with a readable signed URL", async () => {
    mockedSupabase.from.mockReturnValue(query({ data: [row], error: null }));
    await expect(listPublicContactDocuments()).resolves.toEqual([{ id: documentId, title: "Regulamin", path, position: 0, signedUrl: "https://signed.example/regulamin.pdf" }]);
  });

  it("uploads the PDF before inserting validated metadata", async () => {
    const insertQuery = query({ data: row, error: null });
    mockedSupabase.from.mockReturnValue(insertQuery);
    const upload = mockedSupabase.storage.from().upload;
    await uploadContactDocument("  Regulamin  ", new File(["pdf"], "regulamin.pdf", { type: "application/pdf" }), 0);
    expect(upload.mock.invocationCallOrder[0]).toBeLessThan(insertQuery.insert.mock.invocationCallOrder[0]);
    expect(insertQuery.insert).toHaveBeenCalledWith({ title: "Regulamin", storage_path: path, position: 0 });
  });

  it("cleans up the object after metadata insert failure", async () => {
    const insertQuery = query({ data: null, error: { code: "42501" } });
    const storage = mockedSupabase.storage.from();
    mockedSupabase.from.mockReturnValue(insertQuery);
    await expect(uploadContactDocument("Regulamin", new File(["pdf"], "regulamin.pdf", { type: "application/pdf" }), 0)).rejects.toThrow("nie udało się zapisać");
    expect(storage.remove).toHaveBeenCalledWith([path]);
  });

  it("reports a retryable cleanup failure after deleting metadata", async () => {
    mockedSupabase.from.mockReturnValueOnce(query({ data: row, error: null })).mockReturnValueOnce(query({ data: null, error: null }));
    mockedSupabase.storage.from.mockReturnValue({ remove: vi.fn().mockResolvedValue({ error: { message: "failed" } }) });
    await expect(deleteContactDocument(documentId)).rejects.toBeInstanceOf(DocumentCleanupPendingError);
  });

  it("does not retry an arbitrary Storage path", async () => {
    await expect(retryContactDocumentObjectCleanup("private/file.pdf")).rejects.toThrow("Nieprawidłowa ścieżka");
  });
});
