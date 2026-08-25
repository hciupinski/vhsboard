import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockedRepository = vi.hoisted(() => ({
  deleteContactDocument: vi.fn(),
  listAdminContactDocuments: vi.fn(),
  retryContactDocumentObjectCleanup: vi.fn(),
  uploadContactDocument: vi.fn(),
}));
vi.mock("@/lib/documents/repository", () => mockedRepository);
import { ContactDocumentManager } from "./ContactDocumentManager";

const document = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Regulamin",
  path: "documents/123e4567-e89b-12d3-a456-426614174000.pdf",
  position: 0,
  signedUrl: "https://signed.example/regulamin.pdf",
};
const pdf = new File(["pdf"], "regulamin.pdf", { type: "application/pdf" });

beforeEach(() => {
  mockedRepository.listAdminContactDocuments.mockResolvedValue([]);
  mockedRepository.uploadContactDocument.mockResolvedValue(document);
  mockedRepository.deleteContactDocument.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("ContactDocumentManager", () => {
  it("does not upload without a title and selected PDF", async () => {
    const user = userEvent.setup();
    render(<ContactDocumentManager />);
    await user.click(await screen.findByRole("button", { name: "Dodaj dokument" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Nazwa dokumentu");
    expect(mockedRepository.uploadContactDocument).not.toHaveBeenCalled();
  });

  it("uploads a selected PDF with the next position and refreshes the list", async () => {
    const user = userEvent.setup();
    mockedRepository.listAdminContactDocuments
      .mockResolvedValueOnce([document])
      .mockResolvedValueOnce([
        document,
        { ...document, id: "223e4567-e89b-12d3-a456-426614174000", position: 1 },
      ]);
    render(<ContactDocumentManager />);
    await screen.findByText("Regulamin");
    await user.type(screen.getByLabelText("Nazwa dokumentu"), "Informacja");
    await user.upload(screen.getByLabelText("Wybierz plik PDF"), pdf);
    await user.click(screen.getByRole("button", { name: "Dodaj dokument" }));
    await waitFor(() =>
      expect(mockedRepository.uploadContactDocument).toHaveBeenCalledWith("Informacja", pdf, 1),
    );
  });
});
