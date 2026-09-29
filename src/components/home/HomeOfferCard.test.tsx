import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { DayCampOffer, PublicOffer, TripOffer } from "@/lib/offers/types";

import { HomeOfferCard } from "./HomeOfferCard";

const trip: TripOffer = {
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

const camp: DayCampOffer = {
  id: "camp-1",
  slug: "wakeboardowe-lato",
  offerKind: "day_camp",
  activity: "wake",
  title: "Wakeboardowe lato",
  subtitle: "",
  shortDescription: "Pięć aktywnych dni nad wodą.",
  location: "Warszawa",
  startDate: "2099-07-01",
  endDate: "2099-07-05",
  durationDays: 5,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 1200,
  currency: "PLN",
  bookingUrl: "https://example.test/zapisy",
  showLastPlacesBadge: false,
  heroImageUrl: null,
  images: [],
  accommodationImages: [],
  content: {
    paragraphs: [],
    highlights: [],
    included: [],
    excluded: [],
    dayProgram: [],
    venueDescription: "",
    parentInfo: { ageRange: "", supervision: "", safety: "" },
    terms: [],
  },
};

const renderCard = async (offer: PublicOffer) => {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <HomeOfferCard offer={offer} />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();
  return render(<RouterProvider router={router} />);
};

afterEach(cleanup);

describe("HomeOfferCard", () => {
  it("shows only the selected trip facts on the image card", async () => {
    await renderCard(trip);

    expect(screen.getByRole("heading", { name: trip.title })).toBeInTheDocument();
    expect(screen.getByText("Surf")).toBeInTheDocument();
    expect(screen.getByText("12–18 czerwca 2099")).toBeInTheDocument();
    expect(screen.getByText(/3\s*100\s*zł/)).toBeInTheDocument();
    expect(screen.getByText("Sprawdź szczegóły")).toBeInTheDocument();
    expect(screen.queryByText(trip.location)).not.toBeInTheDocument();
    expect(screen.queryByText(trip.shortDescription)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: trip.title })).toHaveAttribute(
      "href",
      "/wyjazdy/atlantic-surf-week",
    );
  });

  it("links an upcoming camp to its detail from the image card", async () => {
    await renderCard(camp);

    expect(screen.getByRole("heading", { name: camp.title })).toBeInTheDocument();
    expect(screen.getByText("Wakeboard")).toBeInTheDocument();
    expect(screen.getByText("1–5 lipca 2099")).toBeInTheDocument();
    expect(screen.getByText(/1\s*200\s*zł/)).toBeInTheDocument();
    expect(screen.getByText("Sprawdź szczegóły")).toBeInTheDocument();
    expect(screen.queryByText(camp.location)).not.toBeInTheDocument();
    expect(screen.queryByText(camp.shortDescription)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: camp.title })).toHaveAttribute(
      "href",
      "/obozy/wakeboardowe-lato",
    );
  });
});
