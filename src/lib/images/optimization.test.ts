import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { optimizeImageForUpload } from "./optimization";
const close = vi.fn();
const drawImage = vi.fn();
const toBlob = vi.fn();
const decode = vi.fn();
const input = () => new File(["source"], "portrait.jpeg", { type: "image/jpeg" });
beforeEach(() => {
  decode.mockResolvedValue({ width: 3000, height: 4000, close });
  vi.stubGlobal("createImageBitmap", decode);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(toBlob);
  toBlob.mockImplementation((callback: BlobCallback) =>
    callback(new Blob(["optimized"], { type: "image/webp" })),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
it("uses decoded orientation, WebP and capped dimensions", async () => {
  const file = await optimizeImageForUpload(input());
  expect(file.name).toBe("portrait.webp");
  expect(file.type).toBe("image/webp");
  expect(file.size).toBeLessThanOrEqual(2 * 1024 * 1024);
  expect(decode).toHaveBeenCalledWith(expect.any(File), { imageOrientation: "from-image" });
  expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1440, 1920);
  expect(close).toHaveBeenCalledOnce();
});
it.each(["null", "unsupported", "decode", "too-large"])("rejects %s failures", async (failure) => {
  if (failure === "null") toBlob.mockImplementation((cb: BlobCallback) => cb(null));
  if (failure === "unsupported")
    toBlob.mockImplementation((cb: BlobCallback) =>
      cb(new Blob(["fallback"], { type: "image/png" })),
    );
  if (failure === "decode") decode.mockRejectedValue(new Error("private codec details"));
  if (failure === "too-large")
    toBlob.mockImplementation((cb: BlobCallback) =>
      cb(new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: "image/webp" })),
    );
  await expect(optimizeImageForUpload(input())).rejects.toThrow(
    "Nie udało się przygotować zdjęcia",
  );
  if (failure !== "decode") expect(close).toHaveBeenCalledOnce();
});
it("lowers quality until the budget is met", async () => {
  toBlob.mockImplementationOnce((cb: BlobCallback) =>
    cb(new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: "image/webp" })),
  );
  await optimizeImageForUpload(input());
  expect(toBlob.mock.calls.map((call) => call[2])).toEqual([0.82, 0.72]);
});
