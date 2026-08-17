import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OfferCard } from "./OfferCard";
import { OfferFacts } from "./OfferFacts";
import { OfferGallery } from "./OfferGallery";
import { OfferListState } from "./OfferListState";
import type { OfferImage, PublicOffer } from "@/lib/offers/types";

const offer: PublicOffer = {
  id: "a0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  slug: "atlantic-surf-week",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "Siedem dni w Ericeirze.",
  shortDescription: "Poranne sesje, dobry surf house i kolacje po wodzie.",
  content: { paragraphs: [], highlights: [], included: [], excluded: [], schedule: [] },
  location: "Ericeira, Portugalia",
  startDate: "2026-06-12",
  endDate: "2026-06-18",
  durationDays: 7,
  groupSizeMin: 12,
  groupSizeMax: 18,
  priceFrom: 3100,
  currency: "PLN",
  bookingUrl: "https://tripahead.example/atlantic-surf-week",
  heroImageUrl: "https://signed.example/hero.jpg",
  images: [],
};

const image: OfferImage = {
  id: "b1f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  path: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/gallery.jpg",
  alt: "Surfer na fali w Ericeirze",
  position: 0,
  signedUrl: "https://signed.example/gallery.jpg",
};

const renderOfferCard = async (cardOffer: PublicOffer) => {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <OfferCard offer={cardOffer} />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();
  return render(<RouterProvider router={router} />);
};

afterEach(() => {
  cleanup();
});

describe("public offer components", () => {
  it("renders Polish facts and a detail link without a content image when its URL is missing", async () => {
    await renderOfferCard({ ...offer, heroImageUrl: null });

    expect(screen.getByText("7 dni · 12–18 osób")).toBeInTheDocument();
    expect(screen.getByText(/3100\s*zł/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zobacz szczegóły wyjazdu" })).toHaveAttribute(
      "href",
      "/trips/atlantic-surf-week",
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps the repository alt for a gallery image", () => {
    render(<OfferGallery images={[image]} />);

    expect(screen.getByRole("img", { name: image.alt })).toHaveAttribute("src", image.signedUrl);
  });

  it("does not use HTML injection in the offer card", async () => {
    const { container } = await renderOfferCard({
      ...offer,
      shortDescription: "<strong>Tekst administratora</strong>",
    });

    expect(screen.getByText("<strong>Tekst administratora</strong>")).toBeInTheDocument();
    expect(container.querySelector("strong")).toBeNull();
  });

  it("uses the required external-link protection for the TripAhead CTA", () => {
    render(<OfferFacts offer={offer} />);

    expect(screen.getByRole("link", { name: "Przejdź do rezerwacji w TripAhead" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "Przejdź do rezerwacji w TripAhead" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  it("hides the TripAhead CTA for an unsafe protocol", () => {
    render(<OfferFacts offer={{ ...offer, bookingUrl: "http://tripahead.example/offer" }} />);

    expect(screen.queryByRole("link", { name: "Przejdź do rezerwacji w TripAhead" })).toBeNull();
  });

  it("announces a list error and retries from the keyboard", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<OfferListState offers={[]} isPending={false} isError onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Nie udało się pobrać ofert");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
