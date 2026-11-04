import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { getRentalDocument } = vi.hoisted(() => ({ getRentalDocument: vi.fn() }));
vi.mock("@/lib/documents/rental-repository", () => ({ getRentalDocument }));
import { RentalSection } from "./RentalSection";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <RentalSection />
    </QueryClientProvider>,
  );
}
describe("RentalSection", () => {
  it("shows rental and service information without a button if no file exists", async () => {
    getRentalDocument.mockResolvedValue(null);
    renderSection();
    expect(screen.getByRole("heading", { name: "SPRZĘT GOTOWY NA WYJAZD" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Zapoznaj się z ofertą" })).not.toBeInTheDocument();
  });
  it("opens the available offer in a new tab", async () => {
    getRentalDocument.mockResolvedValue({
      path: "documents/test.pdf",
      signedUrl: "https://example.test/oferta.pdf",
    });
    renderSection();
    const link = await screen.findByRole("link", { name: "Zapoznaj się z ofertą" });
    expect(link).toHaveAttribute("href", "https://example.test/oferta.pdf");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
