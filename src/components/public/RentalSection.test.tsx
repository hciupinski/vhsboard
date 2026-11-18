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
function renderSection(standalone = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <RentalSection standalone={standalone} />
    </QueryClientProvider>,
  );
}
describe("RentalSection", () => {
  it("shows rental and service information without a button if no file exists", async () => {
    getRentalDocument.mockResolvedValue(null);
    renderSection();
    expect(screen.getByRole("heading", { name: "WYPOŻYCZALNIA SNOWBOARDÓW" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Skontaktuj się z nami" })).toHaveAttribute(
      "href",
      "/kontakt",
    );
    expect(screen.queryByRole("link", { name: "Zobacz ofertę i cennik" })).not.toBeInTheDocument();
  });
  it("places embedded text before the image and sizes all prose consistently", () => {
    getRentalDocument.mockResolvedValue(null);
    const { container } = renderSection();
    const heading = screen.getByRole("heading", { name: "WYPOŻYCZALNIA SNOWBOARDÓW" });
    const figure = container.querySelector("figure")!;
    expect(heading.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(figure).toHaveClass("lg:order-first");
    const prose = heading.parentElement!.querySelectorAll("p");
    expect(Array.from(prose).slice(1)).toHaveLength(4);
    Array.from(prose)
      .slice(1)
      .forEach((paragraph) =>
        expect(paragraph).toHaveClass("text-lg", "max-lg:text-justify", "max-lg:hyphens-auto"),
      );
  });
  it("retains image-first document order on the standalone page", () => {
    getRentalDocument.mockResolvedValue(null);
    const { container } = renderSection(true);
    const figure = container.querySelector("figure")!;
    const heading = screen.getByRole("heading", { name: "WYPOŻYCZALNIA SNOWBOARDÓW" });
    expect(figure.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    heading
      .parentElement!.querySelectorAll("p")
      .forEach((paragraph) => expect(paragraph).not.toHaveClass("max-lg:text-justify"));
  });
  it("opens the available offer in a new tab", async () => {
    getRentalDocument.mockResolvedValue({
      path: "documents/test.pdf",
      signedUrl: "https://example.test/oferta.pdf",
    });
    renderSection();
    const link = await screen.findByRole("link", { name: "Zobacz ofertę i cennik" });
    expect(link).toHaveAttribute("href", "https://example.test/oferta.pdf");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
