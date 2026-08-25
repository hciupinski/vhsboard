import { describe, expect, it } from "vitest";

import { contactDocumentRowSchema } from "./schema";

const row = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Regulamin wyjazdów",
  storage_path: "documents/123e4567-e89b-12d3-a456-426614174000.pdf",
  position: 0,
};

describe("contact document row schema", () => {
  it("accepts a complete document row", () => {
    expect(contactDocumentRowSchema.parse(row)).toEqual(row);
  });

  it.each([
    { ...row, id: "not-an-id" },
    { ...row, title: "  " },
    { ...row, storage_path: "documents/secret.docx" },
    { ...row, position: -1 },
  ])("rejects an invalid document row", (invalidRow) => {
    expect(() => contactDocumentRowSchema.parse(invalidRow)).toThrow();
  });
});
