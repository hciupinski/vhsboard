import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import type { TripOffer } from "@/lib/offers/types";

const repositories = vi.hoisted(() => ({ published: vi.fn(), preview: vi.fn() }));
vi.mock("@/lib/offers/public-repository", () => ({
  getPublishedOfferBySlug: repositories.published,
}));
vi.mock("@/lib/offers/admin-repository", () => ({
  getAdminPreviewOfferBySlug: repositories.preview,
}));
const offer: TripOffer = {
  id: "trip-1",
  offerKind: "trip",
  activity: "surf",
  slug: "surf",
  title: "Surf w Portugalii",
  subtitle: "",
  shortDescription: "Tydzień na fali.",
  location: "Ericeira",
  startDate: null,
  endDate: null,
  durationDays: 7,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 3000,
  currency: "PLN",
  bookingUrl: "https://tripahead.example/surf",
  showLastPlacesBadge: false,
  heroImageUrl: null,
  images: [],
  accommodationImages: [],
  content: { paragraphs: [], highlights: [], included: [], excluded: [], schedule: [] },
};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

it.each([
  ["/admin/login", "admin"],
  ["/admin-shell", "admin"],
  ["/wyjazdy/surf?preview=true", "preview"],
  ["/wyjazdy/missing", "missing"],
  ["/wyjazdy/wrong", "wrong"],
  ["/wyjazdy/failure", "failure"],
  ["/not-a-page", "missing"],
  ["/wyjazdy/surf", "published"],
] as const)("keeps one correct robots entry for %s", async (path, condition) => {
  vi.stubEnv("VITE_SITE_URL", "https://vhsboard.example");
  vi.stubEnv("VITE_SEO_INDEXING", "true");
  repositories.published.mockResolvedValue(
    condition === "missing"
      ? null
      : condition === "wrong"
        ? { ...offer, offerKind: "day_camp" }
        : offer,
  );
  if (condition === "failure") repositories.published.mockRejectedValue(new Error("Offline"));
  repositories.preview.mockResolvedValue(offer);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  await waitFor(() => {
    const tags = document.querySelectorAll('meta[name="robots"]');
    expect(tags).toHaveLength(1);
    expect(tags[0]).toHaveAttribute(
      "content",
      condition === "published" ? "index, follow" : "noindex, nofollow",
    );
  });
  if (condition === "published")
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://vhsboard.example/wyjazdy/surf",
    );
  queryClient.clear();
});
