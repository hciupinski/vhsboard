import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { FunctionComponent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CookieConsentProvider } from "@/components/cookie-consent/CookieConsentProvider";
import { getPublishedOfferBySlug } from "@/lib/offers/public-repository";
import type { TripOffer } from "@/lib/offers/types";

import { Route } from "./wyjazdy.$slug";

vi.mock("@/lib/offers/public-repository", () => ({ getPublishedOfferBySlug: vi.fn() }));

describe("trip detail route", () => {
  it("loads a published offer under /wyjazdy/:slug", async () => {
    const offer = {
      slug: "atlantic-surf-week",
      offerKind: "trip",
      title: "Atlantycki tydzień surfingu",
      location: "Ericeira, Portugalia",
      shortDescription: "Siedem dni w Ericeirze.",
    };
    const ensureQueryData = vi.fn().mockResolvedValue(offer);

    await expect(
      Route.options.loader?.({
        context: { queryClient: { ensureQueryData } },
        params: { slug: offer.slug },
      } as never),
    ).resolves.toEqual({ offer, slug: offer.slug });
  });
});

const detailOffer: TripOffer = {
  id: "trip-1",
  slug: "surf-week",
  offerKind: "trip",
  activity: "surf",
  title: "Tydzień surfingu",
  subtitle: "Razem na fali",
  shortDescription: "Surf i słońce.",
  content: {
    paragraphs: ["Opis wyjazdu."],
    highlights: ["Poranne fale"],
    schedule: [{ day: "Dzień 1", text: "Pierwsza sesja" }],
    included: ["Noclegi"],
    excluded: ["Loty"],
  },
  location: "Ericeira",
  startDate: null,
  endDate: null,
  durationDays: 7,
  groupSizeMin: 8,
  groupSizeMax: 12,
  priceFrom: 3000,
  currency: "PLN",
  bookingUrl: "https://tripahead.example/surf",
  heroImageUrl: null,
  images: [
    {
      id: "image-1",
      path: "gallery.jpg",
      alt: "Surfer na fali",
      position: 0,
      signedUrl: "https://example.test/gallery.jpg",
    },
  ],
};

async function renderDetail(offer: TripOffer) {
  vi.stubEnv("VITE_SITE_URL", "https://vhsboard.example");
  vi.stubEnv("VITE_SEO_INDEXING", "false");
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(getPublishedOfferBySlug).mockResolvedValue(offer);
  queryClient.setQueryData(["published-offer", "trip", offer.slug], offer);
  const root = createRootRoute();
  const page = createRoute({
    getParentRoute: () => root,
    path: "/wyjazdy/$slug",
    loader: () => ({ offer, slug: offer.slug }),
    component: Route.options.component as FunctionComponent,
  });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: [`/wyjazdy/${offer.slug}`] }),
  });
  await router.load();
  return render(
    <QueryClientProvider client={queryClient}>
      <CookieConsentProvider>
        <RouterProvider router={router} />
      </CookieConsentProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("trip section navigation integration", () => {
  it("links to the rendered trip sections in reading order", async () => {
    await renderDetail(detailOffer);
    const navigation = await screen.findByRole("navigation", { name: "Sekcje wyjazdu" });
    const links = within(navigation).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "O wyjeździe",
      "W programie",
      "Plan wyjazdu",
      "Co jest w cenie",
      "Galeria",
    ]);
    for (const link of links) {
      const target = document.getElementById(link.getAttribute("href")!.slice(1));
      expect(target).not.toBeNull();
      expect(
        within(target!).getByRole("heading", { level: 2, name: link.textContent! }),
      ).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Przejdź do zapisów" })).toHaveAttribute(
      "href",
      detailOffer.bookingUrl,
    );
  });

  it("omits empty sections and images without usable URLs but keeps excluded-only price details", async () => {
    await renderDetail({
      ...detailOffer,
      content: { paragraphs: [], highlights: [], schedule: [], included: [], excluded: ["Loty"] },
      images: [{ ...detailOffer.images[0]!, signedUrl: null }],
    });
    const navigation = await screen.findByRole("navigation", { name: "Sekcje wyjazdu" });
    expect(
      within(navigation)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Co jest w cenie"]);
    expect(screen.queryByRole("heading", { name: "Galeria" })).not.toBeInTheDocument();
  });

  it("does not render a navigation bar when every optional section is empty", async () => {
    await renderDetail({
      ...detailOffer,
      content: { paragraphs: [], highlights: [], schedule: [], included: [], excluded: [] },
      images: [],
    });
    expect(await screen.findByRole("heading", { name: detailOffer.title })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Sekcje wyjazdu" })).not.toBeInTheDocument();
  });
});
