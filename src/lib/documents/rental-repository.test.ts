import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), storage: { from: vi.fn() } }));
vi.mock("../supabase", () => ({ supabase: mocked }));
import {
  getRentalDocument,
  replaceRentalDocument,
  removeRentalDocument,
} from "./rental-repository";

const id = "223e4567-e89b-12d3-a456-426614174000";
const path = `documents/${id}.pdf`;
const oldPath = "documents/123e4567-e89b-12d3-a456-426614174000.pdf";
const pdf = () => new File(["pdf"], "oferta.pdf", { type: "application/pdf" });
const query = (data: unknown, error: unknown = null) => {
  const q = { select: vi.fn(), eq: vi.fn(), single: vi.fn().mockResolvedValue({ data, error }) };
  q.select.mockReturnValue(q);
  q.eq.mockReturnValue(q);
  return q;
};
const storage = { upload: vi.fn(), remove: vi.fn(), createSignedUrl: vi.fn() };
beforeEach(() => {
  vi.spyOn(crypto, "randomUUID").mockReturnValue(id);
  mocked.storage.from.mockReturnValue(storage);
  storage.upload.mockResolvedValue({ error: null });
  storage.remove.mockResolvedValue({ error: null });
  storage.createSignedUrl.mockResolvedValue({
    data: { signedUrl: "https://example.test/offer.pdf" },
    error: null,
  });
  mocked.rpc.mockResolvedValue({ data: oldPath, error: null });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});
describe("portal rental document", () => {
  it("returns no document when none is configured", async () => {
    mocked.from.mockReturnValue(query({ storage_path: null }));
    expect(await getRentalDocument()).toBeNull();
    expect(storage.createSignedUrl).not.toHaveBeenCalled();
  });
  it("returns a signed HTTPS URL for the configured PDF", async () => {
    mocked.from.mockReturnValue(query({ storage_path: path }));
    expect(await getRentalDocument()).toMatchObject({
      path,
      signedUrl: "https://example.test/offer.pdf",
    });
  });
  it("uploads before atomic replacement and removes the previous PDF", async () => {
    await replaceRentalDocument(pdf());
    expect(storage.upload.mock.invocationCallOrder[0]).toBeLessThan(
      mocked.rpc.mock.invocationCallOrder[0]!,
    );
    expect(mocked.rpc).toHaveBeenCalledWith("replace_portal_rental_document", { p_path: path });
    expect(storage.remove).toHaveBeenCalledWith([oldPath]);
  });
  it("cleans up the new file when metadata replacement fails", async () => {
    mocked.rpc.mockResolvedValue({ data: null, error: { message: "failed" } });
    await expect(replaceRentalDocument(pdf())).rejects.toThrow();
    expect(storage.remove).toHaveBeenCalledWith([path]);
    expect(storage.remove).not.toHaveBeenCalledWith([oldPath]);
  });
  it("removes the association before deleting the file", async () => {
    await removeRentalDocument();
    expect(mocked.rpc).toHaveBeenCalledWith("replace_portal_rental_document", { p_path: null });
    expect(storage.remove).toHaveBeenCalledWith([oldPath]);
  });
});
