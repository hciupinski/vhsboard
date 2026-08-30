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
};

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
    mockedListPublishedOffers.mockResolvedValue([]);

    await renderTripsPage();

    expect(screen.getByRole("heading", { name: "Wyjazdy" })).toBeInTheDocument();
    expect(
      await screen.findByText("Nie mamy teraz opublikowanych wyjazdów. Wróć do nas za chwilę."),
    ).toBeInTheDocument();
  });
});
