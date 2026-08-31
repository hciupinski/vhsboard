import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DayCampOffer } from "@/lib/offers/types";
import { routeTree } from "@/routeTree.gen";

const { mockedGetPublishedOfferBySlug } = vi.hoisted(() => ({
  mockedGetPublishedOfferBySlug: vi.fn(),
}));

vi.mock("@/lib/offers/public-repository", () => ({
  getPublishedOfferBySlug: mockedGetPublishedOfferBySlug,
}));

const dayCamp: DayCampOffer = {
  id: "2c1b6bc6-0d23-465a-91a1-2e6c5906de8a",
  offerKind: "day_camp",
  activity: "wake",
  slug: "wakeboard-2026",
  title: "Wakeboardowe obozy",
  subtitle: "Pięć dni ruchu na wodzie.",
  shortDescription: "Wakeboard i dobra ekipa.",
  location: "Central Wake Park, Głowno",
  startDate: "2026-06-29",
  endDate: "2026-07-03",
  durationDays: 5,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 1450,
  currency: "PLN",
  bookingUrl: "https://zapisy.example/wakeboard-2026",
  heroImageUrl: null,
  images: [],
  content: {
    paragraphs: ["Uczymy od podstaw."],
    venueDescription: "Wakepark nad wodą.",
    highlights: ["Wakeboard"],
    included: ["Opieka instruktorów"],
    excluded: [],
    dayProgram: [{ time: "09:00", text: "Zajęcia na wodzie." }],
    terms: [
      {
        label: "Turnus 1",
        startDate: "2026-06-29",
        endDate: "2026-07-03",
        bookingUrl: "https://zapisy.example/wakeboard-2026",
        priceOptions: [{ label: "Obozy", price: 1450 }],
      },
    ],
    parentInfo: {
      ageRange: "10–16 lat",
      supervision: "Instruktorzy",
      safety: "Kaski i kamizelki",
    },
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("day-camp route nesting", () => {
  it("renders the selected day-camp detail instead of the parent listing", async () => {
    mockedGetPublishedOfferBySlug.mockResolvedValue(dayCamp);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history: createMemoryHistory({ initialEntries: ["/obozy/wakeboard-2026"] }),
    });

    await router.load();
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "Wakeboardowe obozy" })).toBeInTheDocument();
    expect(screen.getByText("Twój obóz")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Wybierz turnus" })).toHaveAttribute(
      "href",
      "#turnusy",
    );
    expect(screen.getByRole("heading", { name: "Plan dnia" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Obozy aktywnie" })).not.toBeInTheDocument();
  });
});
