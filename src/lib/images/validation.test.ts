import { describe, expect, it } from "vitest";

import { ACCEPTED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES, validateImageFile } from "./validation";

describe("validateImageFile", () => {
  it.each([
    ["image/jpeg", "surfer.jpeg"],
    ["image/png", "foka.png"],
    ["image/webp", "deska.webp"],
  ])("accepts a %s exactly at 8 MiB", (type, name) => {
    expect(validateImageFile(new File([new Uint8Array(MAX_IMAGE_BYTES)], name, { type }))).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it.each([
    ["image/gif", "ruch.gif", "format"],
    ["image/svg+xml", "logo.svg", "format"],
    ["", "bez-typu.jpg", "typ"],
    ["image/jpeg", "fala.png", "rozszerzenie"],
  ])("rejects %s (%s)", (type, name, reason) => {
    const result = validateImageFile(new File(["x"], name, { type }));

    expect(result).toMatchObject({ ok: false, error: { code: reason } });
    if (!result.ok) expect(result.error.message).toMatch(/\S/);
  });

  it("rejects a file larger than the 8 MiB limit with a Polish message", () => {
    const result = validateImageFile(
      new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "duzy.jpg", {
        type: "image/jpeg",
      }),
    );

    expect(result).toMatchObject({ ok: false, error: { code: "rozmiar" } });
    if (!result.ok) expect(result.error.message).toContain("8 MiB");
  });

  it("matches MIME type to the extension case-insensitively", () => {
    expect(validateImageFile(new File(["x"], "SURFER.JPEG", { type: "image/jpeg" }))).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it("exposes only the supported MIME types", () => {
    expect(ACCEPTED_IMAGE_MIME_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });
});
