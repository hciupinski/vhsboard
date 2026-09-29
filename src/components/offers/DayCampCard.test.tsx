import { cleanup, render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vitest";

import { DayCampCard } from "./DayCampCard";

const offer = {
  id: "a0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  offerKind: "day_camp" as const,
  slug: "wake-lato-2026",
  activity: "wake" as const,
  title: "Wakeboardowe obozy",
  subtitle: "Pięć dni na wodzie.",
  shortDescription: "Wakeboard i opieka instruktorów przez pięć wakacyjnych dni.",
  content: {
    paragraphs: ["Opis."],
    highlights: ["Wakeboard"],
    included: ["Opieka"],
    excluded: ["Dojazd"],
    dayProgram: [{ time: "09:00", text: "Start." }],
    venueDescription: "Wakepark.",
    parentInfo: { ageRange: "7–12 lat", supervision: "Opieka.", safety: "Kaski." },
    terms: [
      {
        label: "Turnus 1",
        startDate: "2026-07-06",
        endDate: "2026-07-10",
        bookingUrl: "https://zapisy.example.test/wake",
        priceOptions: [{ label: "Podstawowy", price: 1200 }],
      },
    ],
  },
  location: "Wrocław",
  startDate: "2099-07-06",
  endDate: "2099-07-10",
  durationDays: 5,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 1200,
  currency: "PLN" as const,
  bookingUrl: "https://zapisy.example.test/wake",
  showLastPlacesBadge: false,
  heroImageUrl: null,
  images: [],
  accommodationImages: [],
};

const renderCard = async (cardOffer: typeof offer) => {
  const root = createRootRoute();
  const route = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <DayCampCard offer={cardOffer} />,
  });
  const router = createRouter({
    routeTree: root.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
};

afterEach(cleanup);

describe("DayCampCard", () => {
  it("makes the entire day-camp card one link to its public detail", async () => {
    await renderCard(offer);
    expect(screen.getByRole("link", { name: /wakeboardowe obozy/i })).toHaveAttribute(
      "href",
      "/obozy/wake-lato-2026",
    );
  });

  it("shows last places on an upcoming day camp", async () => {
    const { container } = await renderCard({
      ...offer,
      heroImageUrl: "https://signed.example/wake.jpg",
      showLastPlacesBadge: true,
    });

    expect(screen.getByText("Ostatnie miejsca")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /wakeboardowe obozy/i })).toHaveAttribute(
      "href",
      "/obozy/wake-lato-2026",
    );
    expect(container.querySelector("img")).not.toHaveClass("grayscale");
  });

  it("shows a finished day camp without a detail link or last places tag", async () => {
    const { container } = await renderCard({
      ...offer,
      startDate: "2000-07-06",
      endDate: "2000-07-10",
      heroImageUrl: "https://signed.example/wake.jpg",
      showLastPlacesBadge: true,
    });

    expect(screen.getByText("Zakończone")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveClass("grayscale");
    expect(screen.queryByText("Ostatnie miejsca")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Szczegóły")).not.toBeInTheDocument();
  });
});
