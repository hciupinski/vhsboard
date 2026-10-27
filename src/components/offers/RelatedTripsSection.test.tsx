import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tripOffer } from "@/test/offer-fixtures";
import { listPublishedOffers } from "@/lib/offers/public-repository";
import { RelatedTripsSection } from "./RelatedTripsSection";
vi.mock("@/lib/offers/public-repository", () => ({ listPublishedOffers: vi.fn() }));
async function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const root = createRootRoute();
  const page = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <RelatedTripsSection currentOfferId="current" />,
  });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
afterEach(cleanup);
beforeEach(() => {
  vi.mocked(listPublishedOffers).mockReset();
});
describe("RelatedTripsSection", () => {
  it("shows only other published trips and keeps the full list accessible", async () => {
    vi.mocked(listPublishedOffers).mockResolvedValue([
      { ...tripOffer, id: "current", title: "Aktualny" },
      tripOffer,
    ]);
    await renderSection();
    const section = (await screen.findByRole("heading", { name: "Zobacz inne wyjazdy" })).closest(
      "section",
    )!;
    expect(
      await within(section).findByRole("link", {
        name: `Sprawdź szczegóły wyjazdu: ${tripOffer.title}`,
      }),
    ).toHaveAttribute("href", `/wyjazdy/${tripOffer.slug}`);
    expect(within(section).queryByRole("heading", { name: "Aktualny" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zobacz wszystkie wyjazdy" })).toHaveAttribute(
      "href",
      "/wyjazdy",
    );
    expect(listPublishedOffers).toHaveBeenCalledWith("trip");
  });
  it("offers the list without an empty recommendations heading", async () => {
    vi.mocked(listPublishedOffers).mockResolvedValue([]);
    await renderSection();
    await screen.findByRole("link", { name: "Zobacz wszystkie wyjazdy" });
    expect(screen.queryByRole("heading", { name: "Zobacz inne wyjazdy" })).not.toBeInTheDocument();
  });
  it("keeps a useful list link when loading fails", async () => {
    vi.mocked(listPublishedOffers).mockRejectedValue(new Error("offline"));
    await renderSection();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się pobrać innych wyjazdów.",
    );
    expect(screen.getByRole("link", { name: "Zobacz wszystkie wyjazdy" })).toHaveAttribute(
      "href",
      "/wyjazdy",
    );
  });
  it("reserves three card slots without blocking the list link", async () => {
    vi.mocked(listPublishedOffers).mockReturnValue(new Promise(() => {}));
    await renderSection();
    expect(screen.getAllByTestId("related-trip-skeleton")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Zobacz wszystkie wyjazdy" })).toBeInTheDocument();
  });
});
