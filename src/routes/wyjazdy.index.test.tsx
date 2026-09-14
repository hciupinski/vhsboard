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
import type { PublicOffer } from "@/lib/offers/types";

import { Route as TripsRoute } from "./wyjazdy.index";

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

const publishedOffers: PublicOffer[] = [
  {
    id: "trip-1",
    slug: "surf-portugal",
    offerKind: "trip",
    activity: "surf",
    title: "Surfing w Portugalii",
    subtitle: "Tydzień na fali.",
    shortDescription: "Kameralny wyjazd surfingowy.",
    content: { paragraphs: [], highlights: [], included: [], excluded: [], schedule: [] },
    location: "Ericeira",
    startDate: "2026-06-12",
    endDate: "2026-06-18",
    durationDays: 7,
    groupSizeMin: 8,
    groupSizeMax: 12,
    priceFrom: 3100,
    currency: "PLN",
    bookingUrl: "https://zapisy.example.test/surf-portugal",
    heroImageUrl: null,
    images: [],
  },
  {
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
  },
];

const renderTripsPage = async () => {
  for (const [name, value] of Object.entries(publicSiteEnv)) {
    vi.stubEnv(name, value);
  }
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute();
  const TripsPage = TripsRoute.options.component as ComponentType;
  const tripsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/wyjazdy",
    component: TripsPage,
  });
  const emptyRoutes = ["/", "/wyjazdy/$slug", "/eventy", "/obozy", "/o-nas", "/kontakt"].map(
    (path) => createRoute({ getParentRoute: () => rootRoute, path, component: () => null }),
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren([tripsRoute, ...emptyRoutes]),
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/wyjazdy"] }),
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

describe("trips list route", () => {
  it("does not fetch offers while prerendering the marketing page", () => {
    expect(TripsRoute.options.loader).toBeUndefined();
  });

  it("loads published offers on the dedicated /wyjazdy page", async () => {
    mockedListPublishedOffers.mockResolvedValue(publishedOffers);

    await renderTripsPage();

    expect(
      screen.getByRole("heading", { name: /wyjazdy, do których chce się wracać/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/kameralne grupy, dobra ekipa i dużo czasu na desce/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /aktualne kierunki/i })).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Surfing w Portugalii" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Obóz wakeboardowy" })).not.toBeInTheDocument();

    const offersHeading = screen.getByRole("heading", { name: /aktualne kierunki/i });
    const faqHeading = screen.getByRole("heading", { name: "Najczęściej zadawane pytania" });

    expect(
      offersHeading.compareDocumentPosition(faqHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jak zapisać się na wyjazd?" })).toBeVisible();
  });
});
