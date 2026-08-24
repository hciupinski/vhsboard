import { describe, expect, it } from "vitest";

import { createImagePath } from "./path";

const offerId = "123e4567-e89b-12d3-a456-426614174000";
const uploadId = "987e6543-e21b-12d3-a456-426614174000";

describe("createImagePath", () => {
  it("uses only supplied UUIDs and the MIME extension", () => {
    const path = createImagePath(
      offerId,
      new File(["x"], "../../nazwa ze spacja.PNG", { type: "image/png" }),
      uploadId,
    );

    expect(path).toBe(`offers/${offerId}/${uploadId}.png`);
    expect(path).not.toMatch(/\.\.| |nazwa|PNG/);
  });

  it.each([
    ["image/jpeg", "photo.jpeg"],
    ["image/png", "photo.png"],
    ["image/webp", "photo.webp"],
  ])("maps %s to its fixed extension", (type, name) => {
    expect(createImagePath(offerId, new File(["x"], name, { type }), uploadId)).toBe(
      `offers/${offerId}/${uploadId}.${name.split(".").at(-1)}`,
    );
  });

  it.each([
    ["bad-id", offerId, "Nieprawidłowy identyfikator obrazu."],
    [offerId, "bad-id", "Nieprawidłowy identyfikator obrazu."],
  ])("rejects invalid UUIDs", (badOfferId, badUploadId, message) => {
    expect(() =>
      createImagePath(
        badOfferId,
        new File(["x"], "photo.jpg", { type: "image/jpeg" }),
        badUploadId,
      ),
    ).toThrow(message);
  });

  it("rejects unsupported MIME types instead of creating a fallback path", () => {
    expect(() =>
      createImagePath(offerId, new File(["x"], "photo.gif", { type: "image/gif" }), uploadId),
    ).toThrow("Nieprawidłowy typ obrazu.");
  });

  it.each(["constructor", "__proto__"])(
    "rejects inherited MIME key %s instead of creating a path",
    (type) => {
      expect(() =>
        createImagePath(offerId, new File(["x"], "photo.jpg", { type }), uploadId),
      ).toThrow("Nieprawidłowy typ obrazu.");
    },
  );
});
