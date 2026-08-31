import { render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

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
  startDate: "2026-07-06",
  endDate: "2026-07-10",
  durationDays: 5,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 1200,
  currency: "PLN" as const,
  bookingUrl: "https://zapisy.example.test/wake",
  heroImageUrl: null,
  images: [],
};

describe("DayCampCard", () => {
  it("links a day camp to its dedicated public detail", async () => {
    const root = createRootRoute();
    const route = createRoute({
      getParentRoute: () => root,
      path: "/",
      component: () => <DayCampCard offer={offer} />,
    });
    const router = createRouter({
      routeTree: root.addChildren([route]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    await router.load();
    render(<RouterProvider router={router} />);
    expect(screen.getByRole("link", { name: "Zobacz szczegóły obozów" })).toHaveAttribute(
      "href",
      "/obozy/wake-lato-2026",
    );
  });
});
