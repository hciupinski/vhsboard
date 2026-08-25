import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockedList = vi.hoisted(() => vi.fn());
vi.mock("@/lib/documents/repository", () => ({ listPublicContactDocuments: mockedList }));
import { ContactDocuments } from "./ContactDocuments";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
describe("ContactDocuments", () => {
  it("renders stored PDF links in a new tab", async () => {
    mockedList.mockResolvedValue([
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Regulamin",
        path: "documents/123e4567-e89b-12d3-a456-426614174000.pdf",
        position: 0,
        signedUrl: "https://signed.example/regulamin.pdf",
      },
    ]);
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <ContactDocuments />
      </QueryClientProvider>,
    );
    const link = await screen.findByRole("link", { name: "Regulamin" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("does not render a section for an empty library", async () => {
    mockedList.mockResolvedValue([]);
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <ContactDocuments />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(mockedList).toHaveBeenCalledOnce());
    expect(screen.queryByRole("heading", { name: "Do pobrania" })).not.toBeInTheDocument();
  });
});
