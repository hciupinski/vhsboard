import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { TripOffer } from "@/lib/offers/types";

import { HomeUpcomingOffersSection } from "./HomeUpcomingOffersSection";

const offer: TripOffer = {
  id: "trip-1",
  slug: "atlantic-surf-week",
  offerKind: "trip",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "",
  shortDescription: "Poranne sesje na oceanie.",
  location: "Ericeira, Portugalia",
  startDate: "2099-06-12",
  endDate: "2099-06-18",
  durationDays: 7,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 3100,
  currency: "PLN",
  bookingUrl: "https://example.test/zapisy",
  showLastPlacesBadge: false,
  heroImageUrl: null,
  images: [],
  accommodationImages: [],
  content: { paragraphs: [], highlights: [], included: [], excluded: [], schedule: [] },
};

const renderSection = async (props: {
  offers: TripOffer[];
  isPending: boolean;
  isError: boolean;
}) => {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <HomeUpcomingOffersSection {...props} today="2026-09-27" />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();
  return render(<RouterProvider router={router} />);
};

afterEach(cleanup);

describe("HomeUpcomingOffersSection", () => {
  it("keeps three card-sized placeholders while upcoming offers load", async () => {
    await renderSection({ offers: [], isPending: true, isError: false });

    const section = screen
      .getByRole("heading", { name: "NAJBLIŻSZE NA RADARZE" })
      .closest("section");
    if (!section) throw new Error("Nie znaleziono sekcji najbliższych ofert");

    expect(within(section).getAllByTestId("home-offer-skeleton")).toHaveLength(3);
  });

  it("renders selected upcoming offers and a helpful empty state", async () => {
    await renderSection({ offers: [offer], isPending: false, isError: false });

    expect(screen.getByRole("link", { name: offer.title })).toHaveAttribute(
      "href",
      "/wyjazdy/atlantic-surf-week",
    );

    cleanup();
    await renderSection({ offers: [], isPending: false, isError: false });

    expect(
      screen.getByText("Nie mamy teraz opublikowanych najbliższych terminów."),
    ).toBeInTheDocument();
  });

  it("keeps both category routes available when offers cannot be loaded", async () => {
    await renderSection({ offers: [], isPending: false, isError: true });

    expect(screen.getByRole("link", { name: "Zobacz wyjazdy" })).toHaveAttribute(
      "href",
      "/wyjazdy",
    );
    expect(screen.getByRole("link", { name: "Zobacz obozy" })).toHaveAttribute("href", "/obozy");
  });
});
