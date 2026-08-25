import { afterEach, describe, expect, it, vi } from "vitest";

const mockedSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  storage: { from: vi.fn() },
}));

vi.mock("../supabase", () => ({ supabase: mockedSupabase }));

import {
  getPublishedOfferBySlug,
  listPublishedOfferSeoRecords,
  listPublishedOffers,
  OfferRepositoryError,
  resolvePublishedImageUrls,
} from "./public-repository";

const offerId = "a0f8e810-1df3-42d9-90df-2a1a69ad9a2c";
const heroPath = `offers/${offerId}/hero.jpg`;

const listRow = {
  id: offerId,
  slug: "atlantic-surf-week",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "Siedem dni w Ericeirze.",
  short_description: "Poranne sesje, dobry surf house i kolacje po wodzie.",
  location: "Ericeira, Portugalia",
  start_date: "2026-06-12",
  end_date: "2026-06-18",
  duration_days: 7,
  group_size_min: 12,
  group_size_max: 18,
  price_from: 3100,
  currency: "PLN",
  booking_url: "https://zapisy.example/atlantic-surf-week",
  hero_image: heroPath,
  status: "published",
};

const detailRow = {
  ...listRow,
  description: {
    paragraphs: ["Tekst o wyjeździe."],
    highlights: ["Dwie sesje dziennie"],
    included: ["Nocleg"],
    excluded: ["Lot"],
    schedule: [{ day: "Dzień 1", text: "Przyjazd." }],
  },
};

const imageRow = {
  id: "b1f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  offer_id: offerId,
  storage_path: `offers/${offerId}/gallery.jpg`,
  alt_text: "Surfer na fali w Ericeirze",
  position: 0,
};

const createQuery = (result: { data: unknown; error: Error | null }) => {
  const query = Object.assign(Promise.resolve(result), {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
  });
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.maybeSingle.mockReturnValue(query);
  return query;
};

const stubSignedUrls = (signedUrl = "https://signed.example/image.jpg") => {
  const createSignedUrls = vi.fn().mockResolvedValue({
    data: [{ path: heroPath, signedUrl }],
    error: null,
  });
  mockedSupabase.storage.from.mockReturnValue({ createSignedUrls });
  return createSignedUrls;
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("public offer repository", () => {
  it("returns only published slugs and timestamps for static SEO generation", async () => {
    const query = createQuery({
      data: [
        {
          slug: "atlantic-surf-week",
          updated_at: "2026-01-02T10:30:00.000Z",
        },
      ],
      error: null,
    });
    mockedSupabase.from.mockReturnValue(query);

    await expect(listPublishedOfferSeoRecords()).resolves.toEqual([
      { slug: "atlantic-surf-week", updatedAt: "2026-01-02T10:30:00.000Z", offerKind: "trip" },
    ]);
    expect(query.select).toHaveBeenCalledWith("slug,updated_at,offer_kind");
    expect(query.eq).toHaveBeenCalledWith("status", "published");
  });

  it("lists only published offers without fetching long descriptions", async () => {
    const offerQuery = createQuery({ data: [listRow], error: null });
    mockedSupabase.from.mockReturnValue(offerQuery);
    const createSignedUrls = stubSignedUrls();

    const offers = await listPublishedOffers();
    const selectedColumns = offerQuery.select.mock.calls[0]?.[0];

    expect(offerQuery.select).toHaveBeenCalledOnce();
    expect(selectedColumns?.split(",")).not.toContain("description");
    expect(offerQuery.eq).toHaveBeenCalledWith("status", "published");
    expect(offerQuery.eq).toHaveBeenCalledWith("offer_kind", "trip");
    expect(offers).toMatchObject([
      {
        slug: "atlantic-surf-week",
        heroImageUrl: "https://signed.example/image.jpg",
        images: [],
      },
    ]);
    expect(createSignedUrls).toHaveBeenCalledWith([heroPath], 3600);
  });

  it("filters a detail lookup by published status and orders its gallery", async () => {
    const offerQuery = createQuery({ data: detailRow, error: null });
    const imageQuery = createQuery({ data: [imageRow], error: null });
    mockedSupabase.from.mockReturnValueOnce(offerQuery).mockReturnValueOnce(imageQuery);
    stubSignedUrls();

    const offer = await getPublishedOfferBySlug("atlantic-surf-week");

    expect(offerQuery.eq).toHaveBeenCalledWith("slug", "atlantic-surf-week");
    expect(offerQuery.eq).toHaveBeenCalledWith("status", "published");
    expect(offerQuery.eq).toHaveBeenCalledWith("offer_kind", "trip");
    expect(imageQuery.eq).toHaveBeenCalledWith("offer_id", offerId);
    expect(imageQuery.order).toHaveBeenCalledWith("position", { ascending: true });
    expect(offer?.images).toMatchObject([{ path: imageRow.storage_path, position: 0 }]);
  });

  it("returns null for a missing published offer", async () => {
    const offerQuery = createQuery({ data: null, error: null });
    mockedSupabase.from.mockReturnValue(offerQuery);

    await expect(getPublishedOfferBySlug("nieistniejaca-oferta")).resolves.toBeNull();
    expect(offerQuery.eq).toHaveBeenCalledWith("status", "published");
  });

  it("does not sign Storage paths during SSR", async () => {
    vi.stubGlobal("window", undefined);
    const createSignedUrls = stubSignedUrls();

    await expect(resolvePublishedImageUrls([heroPath])).resolves.toEqual(new Map());
    expect(createSignedUrls).not.toHaveBeenCalled();
  });

  it("returns image placeholders for a detail request during SSR", async () => {
    vi.stubGlobal("window", undefined);
    const offerQuery = createQuery({ data: detailRow, error: null });
    const imageQuery = createQuery({ data: [imageRow], error: null });
    mockedSupabase.from.mockReturnValueOnce(offerQuery).mockReturnValueOnce(imageQuery);
    const createSignedUrls = stubSignedUrls();

    const offer = await getPublishedOfferBySlug("atlantic-surf-week");

    expect(offer?.heroImageUrl).toBeNull();
    expect(offer?.images[0]?.signedUrl).toBeNull();
    expect(createSignedUrls).not.toHaveBeenCalled();
  });

  it("turns a malformed Storage signing result into a controlled image placeholder", async () => {
    const offerQuery = createQuery({ data: [listRow], error: null });
    mockedSupabase.from.mockReturnValue(offerQuery);
    stubSignedUrls("http://signed.example/image.jpg");

    const [offer] = await listPublishedOffers();

    expect(offer?.heroImageUrl).toBeNull();
  });

  it("wraps Supabase errors in a safe local error", async () => {
    const databaseError = new Error("database unavailable");
    const offerQuery = createQuery({ data: null, error: databaseError });
    mockedSupabase.from.mockReturnValue(offerQuery);

    await expect(listPublishedOffers()).rejects.toMatchObject({
      name: "OfferRepositoryError",
      message: "Nie udało się pobrać opublikowanych ofert.",
      cause: databaseError,
    });
    await expect(listPublishedOffers()).rejects.toBeInstanceOf(OfferRepositoryError);
  });
});
