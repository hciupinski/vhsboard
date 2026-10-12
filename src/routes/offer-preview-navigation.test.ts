import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { afterEach, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";

const repositories = vi.hoisted(() => ({ published: vi.fn(), preview: vi.fn() }));
vi.mock("@/lib/offers/public-repository", () => ({
  getPublishedOfferBySlug: repositories.published,
}));
vi.mock("@/lib/offers/admin-repository", () => ({
  getAdminPreviewOfferBySlug: repositories.preview,
}));
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

it.each([
  ["/wyjazdy/na-desce", "trip"],
  ["/obozy/na-desce", "day_camp"],
] as const)(
  "switches between published and preview data at the same slug: %s",
  async (path, offerKind) => {
    vi.stubEnv("VITE_SITE_URL", "https://vhsboard.example");
    vi.stubEnv("VITE_SEO_INDEXING", "true");
    const publicOffer = {
      slug: "na-desce",
      offerKind,
      title: "Opublikowana",
      location: "Głowno",
      shortDescription: "Opis publiczny",
    };
    repositories.published.mockResolvedValue(publicOffer);
    repositories.preview.mockResolvedValue({ ...publicOffer, title: "Zmieniony szkic" });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history: createMemoryHistory({ initialEntries: [path] }),
    });
    await router.load();
    expect(router.state.matches.at(-1)?.loaderData).toMatchObject({
      preview: false,
      offer: { title: "Opublikowana" },
    });
    await router.navigate({ href: `${path}?preview=true` });
    expect(router.state.matches.at(-1)?.loaderData).toMatchObject({
      preview: true,
      offer: { title: "Zmieniony szkic" },
    });
    await router.navigate({ href: path });
    expect(router.state.matches.at(-1)?.loaderData).toMatchObject({
      preview: false,
      offer: { title: "Opublikowana" },
    });
    queryClient.clear();
  },
);
