import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DayCampOffer } from "@/lib/offers/types";
import { routeTree } from "@/routeTree.gen";

import { Route } from "./obozy.$slug";

const { mockedGetPublishedOfferBySlug } = vi.hoisted(() => ({
  mockedGetPublishedOfferBySlug: vi.fn(),
}));

vi.mock("@/lib/offers/public-repository", () => ({
  getPublishedOfferBySlug: mockedGetPublishedOfferBySlug,
}));

const publishedDayCamp: DayCampOffer = {
  id: "41d1d1b8-7bda-4d38-8406-63cc3ee01837",
  offerKind: "day_camp",
  activity: "wake",
  slug: "wakeboardowe-lato",
  title: "Wakeboardowe lato",
  subtitle: "Pięć dni na wodzie.",
  shortDescription: "Wakeboard i dobra ekipa.",
  location: "Central Wake Park, Głowno",
  startDate: "2026-06-29",
  endDate: "2026-07-03",
  durationDays: 5,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 1450,
  currency: "PLN",
  bookingUrl: "https://zapisy.example.test/wakeboardowe-lato",
  heroImageUrl: null,
  images: [
    {
      id: "2b5fabbb-0431-4d83-98ec-3fe5bc776812",
      path: "wakeboardowe-lato/galeria-1.jpg",
      alt: "Uczestnik obozu płynie na wakeboardzie",
      position: 0,
      signedUrl: "https://images.example.test/wakeboardowe-lato/galeria-1.jpg",
    },
  ],
  content: {
    paragraphs: ["Uczymy od podstaw i rozwijamy pewność na desce."],
    venueDescription: "Wakepark nad wodą.",
    highlights: ["Codzienna jazda na wakeboardzie"],
    included: ["Opieka instruktorów"],
    excluded: ["Dojazd"],
    dayProgram: [{ time: "09:00", text: "Zajęcia na wodzie." }],
    terms: [
      {
        label: "Turnus 1",
        startDate: "2026-06-29",
        endDate: "2026-07-03",
        bookingUrl: "https://zapisy.example.test/wakeboardowe-lato",
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

describe("day-camp detail route", () => {
  it("loads only a published day camp under /obozy/:slug", async () => {
    const offer = {
      slug: "wakeboardowe-lato",
      offerKind: "day_camp",
      title: "Wakeboardowe lato",
      shortDescription: "Pięć dni ruchu i nauki na wodzie.",
    };
    const ensureQueryData = vi.fn().mockResolvedValue(offer);

    await expect(
      Route.options.loader?.({
        context: { queryClient: { ensureQueryData } },
        params: { slug: offer.slug },
      } as never),
    ).resolves.toEqual({ offer, slug: offer.slug, preview: false });
  });

  it("loads a saved draft through the administrator preview query", async () => {
    const offer = {
      slug: "wakeboardowe-lato",
      offerKind: "day_camp",
      title: "Wakeboardowe lato",
      shortDescription: "Pięć dni ruchu i nauki na wodzie.",
    };
    const ensureQueryData = vi.fn().mockResolvedValue(offer);

    await expect(
      Route.options.loader?.({
        context: { queryClient: { ensureQueryData } },
        params: { slug: offer.slug },
        search: { preview: true },
      } as never),
    ).resolves.toEqual({ offer, slug: offer.slug, preview: true });
    expect(ensureQueryData).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["admin-preview-offer", "day_camp", offer.slug] }),
    );
  });

  it("returns not found when a trip is requested through the day-camp path", async () => {
    const ensureQueryData = vi.fn().mockResolvedValue({ offerKind: "trip" });

    await expect(
      Route.options.loader?.({
        context: { queryClient: { ensureQueryData } },
        params: { slug: "atlantic-surf-week" },
      } as never),
    ).rejects.toMatchObject({ isNotFound: true });
  });

  it("renders published camp details, gallery, registration, and a visible camp video", async () => {
    mockedGetPublishedOfferBySlug.mockResolvedValue(publishedDayCamp);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history: createMemoryHistory({ initialEntries: ["/obozy/wakeboardowe-lato"] }),
    });

    await router.load();
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "O obozie" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Atrakcje" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "W cenie" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Poza ceną" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Galeria" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zapisz się" })).toHaveAttribute(
      "href",
      "https://zapisy.example.test/wakeboardowe-lato",
    );
    expect(screen.getByRole("link", { name: "Wybierz turnus" })).toHaveAttribute(
      "href",
      "#turnusy",
    );
    expect(screen.getByTitle("Obozy VHSBOARD")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/wff_iv8QJ4c",
    );
    expect(
      screen.queryByRole("button", { name: "Odtwórz film: Obozy VHSBOARD" }),
    ).not.toBeInTheDocument();
  });

  it("links camp sections in their public reading order", async () => {
    mockedGetPublishedOfferBySlug.mockResolvedValue(publishedDayCamp);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history: createMemoryHistory({ initialEntries: ["/obozy/wakeboardowe-lato"] }),
    });

    await router.load();
    render(<RouterProvider router={router} />);

    const navigation = await screen.findByRole("navigation", { name: "Sekcje obozu" });
    const links = within(navigation).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "O obozie",
      "Atrakcje",
      "Plan dnia",
      "W cenie",
      "Turnusy i ceny",
      "Dla rodzica",
      "Galeria",
    ]);
    for (const link of links) {
      const target = document.getElementById(link.getAttribute("href")!.slice(1));
      expect(target).not.toBeNull();
      expect(
        within(target!).getByRole("heading", { level: 2, name: link.textContent! }),
      ).toBeInTheDocument();
    }
  });
});
