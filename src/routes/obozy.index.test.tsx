import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CookieConsentProvider } from "@/components/cookie-consent/CookieConsentProvider";
import type { DayCampOffer } from "@/lib/offers/types";

import { Route as CampsRoute } from "./obozy.index";

const { mockedListPublishedOffers } = vi.hoisted(() => ({
  mockedListPublishedOffers: vi.fn(),
}));

vi.mock("@/lib/offers/public-repository", () => ({
  listPublishedOffers: mockedListPublishedOffers,
}));

const publicSiteEnv = {
  VITE_SITE_URL: "https://vhsboard.pages.dev",
  VITE_SEO_INDEXING: "false",
  VITE_CONTACT_EMAIL: "kontakt@example.test",
  VITE_CONTACT_PHONE: "+48123456789",
  VITE_BUSINESS_NAME: "Testowa firma",
  VITE_BUSINESS_STREET: "ul. Przykładowa 1",
  VITE_BUSINESS_POSTAL_CODE: "00-001",
  VITE_BUSINESS_CITY: "Warszawa",
  VITE_BUSINESS_NIP: "1234567890",
  VITE_BUSINESS_REGON: "123456789",
  VITE_BUSINESS_BANK_ACCOUNT: "12345678901234567890123456",
};

const publishedCamp: DayCampOffer = {
  id: "camp-1",
  slug: "wake-lato",
  offerKind: "day_camp",
  activity: "wake",
  title: "Obóz wakeboardowy",
  subtitle: "Pięć dni na wodzie.",
  shortDescription: "Obóz dla dzieci.",
  content: {
    paragraphs: [],
    highlights: [],
    included: [],
    excluded: [],
    dayProgram: [],
    venueDescription: "Wakepark.",
    parentInfo: { ageRange: "8–12 lat", supervision: "Opieka", safety: "Kaski" },
    terms: [],
  },
  location: "Wrocław",
  startDate: "2026-07-06",
  endDate: "2026-07-10",
  durationDays: 5,
  groupSizeMin: 8,
  groupSizeMax: 12,
  priceFrom: 1200,
  currency: "PLN",
  bookingUrl: "https://zapisy.example.test/wake-lato",
  heroImageUrl: null,
  images: [],
};

const renderCampsPage = async () => {
  for (const [name, value] of Object.entries(publicSiteEnv)) {
    vi.stubEnv(name, value);
  }
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute();
  const CampsPage = CampsRoute.options.component as ComponentType;
  const campsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/obozy",
    component: CampsPage,
  });
  const emptyRoutes = ["/", "/wyjazdy", "/wyjazdy/$slug", "/eventy", "/o-nas", "/kontakt"].map(
    (path) => createRoute({ getParentRoute: () => rootRoute, path, component: () => null }),
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren([campsRoute, ...emptyRoutes]),
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/obozy"] }),
  });

  await router.load();
  return render(
    <QueryClientProvider client={queryClient}>
      <CookieConsentProvider>
        <RouterProvider router={router} />
      </CookieConsentProvider>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("camps list route", () => {
  it("shows parent-focused FAQ after the upcoming camp list", async () => {
    mockedListPublishedOffers.mockResolvedValue([publishedCamp]);

    await renderCampsPage();

    const offersHeading = screen.getByRole("heading", { name: /najbliższe terminy/i });
    const faqHeading = screen.getByRole("heading", { name: "Najczęściej zadawane pytania" });

    expect(offersHeading.compareDocumentPosition(faqHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jak zapisać dziecko na obóz?" })).toBeVisible();
  });
});
