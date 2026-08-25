import { describe, expect, it } from "vitest";

import { createDocumentPath, isDocumentPath } from "./path";

const id = "123e4567-e89b-12d3-a456-426614174000";

describe("document paths", () => {
  it("creates a non-user-controlled PDF object path", () => {
    expect(createDocumentPath(id)).toBe(`documents/${id}.pdf`);
  });

  it("rejects paths that do not match the document bucket contract", () => {
    expect(isDocumentPath("documents/not-a-uuid.pdf")).toBe(false);
    expect(isDocumentPath(`documents/${id}.docx`)).toBe(false);
  });
});
