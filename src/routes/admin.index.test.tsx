import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType, PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminOfferListItem } from "@/lib/offers/admin-repository";
import { Route as AdminListRoute } from "./admin.index";

const { mockedArchiveOffer, mockedListAdminOffers, mockedResolveAdminImageUrls } = vi.hoisted(
  () => ({
    mockedArchiveOffer: vi.fn(),
    mockedListAdminOffers: vi.fn(),
    mockedResolveAdminImageUrls: vi.fn(),
  }),
);

vi.mock("@/lib/offers/admin-repository", () => ({
  archiveOffer: mockedArchiveOffer,
  listAdminOffers: mockedListAdminOffers,
  resolveAdminImageUrls: mockedResolveAdminImageUrls,
}));

vi.mock("@/components/admin/AdminGuard", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/components/admin/AdminGuard")>();
  return {
    ...original,
    AdminGuard: ({ children }: PropsWithChildren) => children,
  };
});

const offer: AdminOfferListItem = {
  id: "a0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  offerKind: "trip",
  slug: "atlantic-surf-week",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "Siedem dni w Ericeirze.",
  shortDescription: "Poranne sesje, dobry surf house i kolacje po wodzie.",
  content: {
    paragraphs: ["Tekst o wyjeździe."],
    highlights: ["Dwie sesje dziennie"],
    included: ["Nocleg"],
    excluded: ["Lot"],
    schedule: [{ day: "Dzień 1", text: "Przyjazd." }],
  },
  location: "Ericeira, Portugalia",
  startDate: "2026-06-12",
  endDate: "2026-06-18",
  durationDays: 7,
  groupSizeMin: 12,
  groupSizeMax: 18,
  priceFrom: 3100,
  currency: "PLN",
  bookingUrl: "https://zapisy.example/atlantic-surf-week",
  heroImagePath: "offers/atlantic-surf-week/hero.jpg",
  status: "draft",
  updatedAt: "2026-08-17T08:30:00.000Z",
};

const renderAdminList = async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const rootRoute = createRootRoute();
  const AdminList = AdminListRoute.options.component as ComponentType;
  const adminListRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin",
    component: AdminList,
  });
  const adminEditorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/$slug",
    component: () => null,
  });
  const tripRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/wyjazdy/$slug",
    component: () => null,
  });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([adminListRoute, adminEditorRoute, tripRoute, homeRoute]),
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/admin"] }),
  });

  await router.load();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
};

beforeEach(() => {
  mockedResolveAdminImageUrls.mockResolvedValue(new Map());
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("admin offer list route", () => {
  it("renders loading and empty states without prototype data", async () => {
    let resolveOffers!: (offers: AdminOfferListItem[]) => void;
    mockedListAdminOffers.mockReturnValue(
      new Promise<AdminOfferListItem[]>((resolve) => {
        resolveOffers = resolve;
      }),
    );

    await renderAdminList();

    expect(screen.getByRole("status")).toHaveTextContent("Ładowanie ofert");
    resolveOffers([]);
    expect(await screen.findByText("Nie ma jeszcze ofert. Zacznij od nowej.")).toBeInTheDocument();
  });

  it("does not render a public preview link for draft or archived offers", async () => {
    mockedListAdminOffers.mockResolvedValue([
      offer,
      {
        ...offer,
        id: "b1f8e810-1df3-42d9-90df-2a1a69ad9a2c",
        slug: "alpine-snow-week",
        title: "Alpejski tydzień snowboardu",
        status: "archived",
      },
    ]);

    await renderAdminList();

    expect(await screen.findByText(offer.title)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /podgląd/i })).not.toBeInTheDocument();
  });

  it("renders a signed hero thumbnail and public preview only for a published offer", async () => {
    mockedListAdminOffers.mockResolvedValue([{ ...offer, status: "published" }]);
    mockedResolveAdminImageUrls.mockResolvedValue(
      new Map([[offer.heroImagePath, "https://signed.example/hero.jpg"]]),
    );

    await renderAdminList();

    expect(
      await screen.findByRole("img", { name: `Zdjęcie główne: ${offer.title}` }),
    ).toHaveAttribute("src", "https://signed.example/hero.jpg");
    expect(screen.getByText("Opublikowana")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /podgląd/i })).toHaveAttribute(
      "href",
      `/wyjazdy/${offer.slug}`,
    );
  });

  it("shows a neutral error and retries loading the list", async () => {
    const user = userEvent.setup();
    mockedListAdminOffers
      .mockRejectedValueOnce(new Error("database connection details"))
      .mockResolvedValueOnce([offer]);

    await renderAdminList();

    expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się pobrać ofert");
    expect(screen.getByRole("alert")).not.toHaveTextContent("database connection details");

    await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));

    expect(await screen.findByText(offer.title)).toBeInTheDocument();
    expect(mockedListAdminOffers).toHaveBeenCalledTimes(2);
  });

  it("archives an offer and invalidates administrator and public caches", async () => {
    const user = userEvent.setup();
    mockedListAdminOffers.mockResolvedValue([offer]);
    mockedResolveAdminImageUrls.mockResolvedValue(new Map());
    mockedArchiveOffer.mockResolvedValue(undefined);

    const { queryClient } = await renderAdminList();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    await screen.findByText(offer.title);
    await user.click(screen.getByRole("button", { name: "Archiwizuj ofertę" }));
    await user.click(screen.getByRole("button", { name: "Archiwizuj" }));

    await waitFor(() => expect(mockedArchiveOffer).toHaveBeenCalledWith(offer.id));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-offers"] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-offer", offer.slug],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["published-offers"] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["published-offer", offer.slug],
    });
  });

  it("keeps the card and announces a Polish error when archiving fails", async () => {
    const user = userEvent.setup();
    mockedListAdminOffers.mockResolvedValue([offer]);
    mockedResolveAdminImageUrls.mockResolvedValue(new Map());
    mockedArchiveOffer.mockRejectedValue(new Error("raw backend details"));

    await renderAdminList();

    await screen.findByText(offer.title);
    await user.click(screen.getByRole("button", { name: "Archiwizuj ofertę" }));
    await user.click(screen.getByRole("button", { name: "Archiwizuj" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się zarchiwizować oferty",
    );
    expect(screen.getByText(offer.title)).toBeInTheDocument();
    expect(screen.getByRole("alert")).not.toHaveTextContent("raw backend details");
  });
});
