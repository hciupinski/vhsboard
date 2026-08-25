import { describe, expect, it } from "vitest";

import { validateDocumentFile, validateDocumentTitle } from "./validation";

describe("document validation", () => {
  it("accepts a PDF with a matching suffix and a trimmed title", () => {
    const file = new File(["pdf"], "regulamin.pdf", { type: "application/pdf" });

    expect(validateDocumentFile(file)).toEqual({ ok: true, value: undefined });
    expect(validateDocumentTitle("  Regulamin wyjazdów  ")).toEqual({
      ok: true,
      value: "Regulamin wyjazdów",
    });
  });

  it.each([
    new File(["pdf"], "regulamin.docx", { type: "application/pdf" }),
    new File(["pdf"], "regulamin.pdf", { type: "application/msword" }),
    new File(["pdf"], "regulamin.pdf", { type: "" }),
    new File([new Uint8Array(10 * 1024 * 1024 + 1)], "regulamin.pdf", {
      type: "application/pdf",
    }),
  ])("rejects an invalid PDF upload", (file) => {
    expect(validateDocumentFile(file)).toMatchObject({ ok: false });
  });

  it.each(["ab", "a".repeat(161)])("rejects a title outside the 3–160 range", (title) => {
    expect(validateDocumentTitle(title)).toMatchObject({ ok: false });
  });
});
