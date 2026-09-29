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
import type { OfferImage, TripOffer } from "@/lib/offers/types";

const offer: TripOffer = {
  id: "a0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  slug: "atlantic-surf-week",
  offerKind: "trip",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "Siedem dni w Ericeirze.",
  shortDescription: "Poranne sesje, dobry surf house i kolacje po wodzie.",
  content: { paragraphs: [], highlights: [], included: [], excluded: [], schedule: [] },
  location: "Ericeira, Portugalia",
  startDate: "2099-06-12",
  endDate: "2099-06-18",
  durationDays: 7,
  groupSizeMin: 12,
  groupSizeMax: 18,
  priceFrom: 3100,
  currency: "PLN",
  bookingUrl: "https://zapisy.example/atlantic-surf-week",
  showLastPlacesBadge: false,
  heroImageUrl: "https://signed.example/hero.jpg",
  images: [],
  accommodationImages: [],
};

const image: OfferImage = {
  id: "b1f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  path: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/gallery.jpg",
  alt: "Surfer na fali w Ericeirze",
  position: 0,
  category: "gallery",
  signedUrl: "https://signed.example/gallery.jpg",
};

const renderOfferCard = async (cardOffer: TripOffer) => {
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
  it("shows only the selected trip facts on the image card", async () => {
    await renderOfferCard({ ...offer, heroImageUrl: null });

    expect(screen.getByText("12–18 czerwca 2099")).toBeInTheDocument();
    expect(screen.getByText("Surf")).toBeInTheDocument();
    expect(screen.getByText(/3100\s*zł/)).toBeInTheDocument();
    expect(screen.getByText("Sprawdź szczegóły")).toBeInTheDocument();
    expect(screen.queryByText("Ericeira, Portugalia")).not.toBeInTheDocument();
    expect(screen.queryByText("7 dni · 12–18 osób")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /atlantycki tydzień surfingu/i })).toHaveAttribute(
      "href",
      "/wyjazdy/atlantic-surf-week",
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("makes the entire trip card one link to its public detail", async () => {
    await renderOfferCard(offer);

    expect(screen.getByRole("link", { name: /atlantycki tydzień surfingu/i })).toHaveAttribute(
      "href",
      "/wyjazdy/atlantic-surf-week",
    );
  });

  it("shows the last places tag while retaining the detail link for an upcoming trip", async () => {
    const { container } = await renderOfferCard({ ...offer, showLastPlacesBadge: true });

    expect(screen.getByText("Ostatnie miejsca")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ostatnie miejsca/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /atlantycki tydzień surfingu/i })).toHaveAttribute(
      "href",
      "/wyjazdy/atlantic-surf-week",
    );
    expect(container.querySelector("img")).not.toHaveClass("grayscale");
  });

  it("keeps wrapping status tags and a long title in one expanding card flow", async () => {
    const title = "Surf i snowboard podczas długiego tygodnia przygód";
    const { container } = await renderOfferCard({
      ...offer,
      activity: "combo",
      title,
      showLastPlacesBadge: true,
    });

    const card = container.querySelector("article");
    const tags = screen.getByText("Ostatnie miejsca").parentElement;
    const details = screen.getByRole("heading", { name: title }).parentElement;

    expect(card).toHaveClass("flex", "min-h-[26rem]");
    expect(screen.getByText("Surf + snowboard")).toBeInTheDocument();
    expect(tags).toHaveClass("flex", "flex-wrap");
    expect(tags).not.toHaveClass("absolute");
    expect(details).toHaveClass("mt-auto");
    expect(details).not.toHaveClass("absolute");
    expect(tags?.parentElement).toBe(details?.parentElement);
  });

  it("shows a finished trip without a detail link or last places tag", async () => {
    const { container } = await renderOfferCard({
      ...offer,
      startDate: "2000-06-12",
      endDate: "2000-06-18",
      showLastPlacesBadge: true,
    });

    expect(screen.getByText("Zakończone")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveClass("grayscale");
    expect(screen.queryByText("Ostatnie miejsca")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Sprawdź szczegóły")).not.toBeInTheDocument();
  });

  it("keeps the repository alt without creating an empty gallery heading", () => {
    const { container } = render(<OfferGallery images={[image]} />);

    expect(screen.getByRole("img", { name: image.alt })).toHaveAttribute("src", image.signedUrl);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("py-6", "sm:pb-10");
  });

  it("uses standard section spacing for a titled standalone gallery", () => {
    render(<OfferGallery images={[image]} title="Galeria wyjazdu" id="trip" />);

    expect(screen.getByRole("region", { name: "Galeria wyjazdu" })).toHaveClass(
      "py-12",
      "sm:py-14",
    );
  });

  it("opens a selected gallery image in an accessible lightbox", async () => {
    const user = userEvent.setup();
    render(<OfferGallery images={[image]} />);

    await user.click(screen.getByRole("button", { name: `Powiększ zdjęcie: ${image.alt}` }));

    const dialog = screen.getByRole("dialog", { name: `Powiększone zdjęcie: ${image.alt}` });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("img", { name: image.alt })).toHaveAttribute("src", image.signedUrl);
  });

  it("omits a short description from the compact card", async () => {
    await renderOfferCard({
      ...offer,
      shortDescription: "<strong>Tekst administratora</strong>",
    });

    expect(screen.queryByText("<strong>Tekst administratora</strong>")).not.toBeInTheDocument();
  });

  it("uses the required external-link protection for the booking CTA", () => {
    render(<OfferFacts offer={offer} />);

    expect(screen.getByRole("link", { name: "Przejdź do zapisów" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "Przejdź do zapisów" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  it("hides the booking CTA for an unsafe protocol", () => {
    render(<OfferFacts offer={{ ...offer, bookingUrl: "http://zapisy.example/offer" }} />);

    expect(screen.queryByRole("link", { name: "Przejdź do zapisów" })).toBeNull();
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
