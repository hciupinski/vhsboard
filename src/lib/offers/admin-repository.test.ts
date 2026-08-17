import { afterEach, describe, expect, it, vi } from "vitest";

import type { EditableOfferInput } from "./editor-schema";

const mockedSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  storage: { from: vi.fn() },
}));

vi.mock("../supabase", () => ({ supabase: mockedSupabase }));

import {
  archiveOffer,
  canPublishOffer,
  createOffer,
  getAdminOffer,
  listAdminOffers,
  resolveAdminImageUrls,
  setOfferStatus,
  updateOffer,
} from "./admin-repository";

const offerId = "a0f8e810-1df3-42d9-90df-2a1a69ad9a2c";
const heroPath = `offers/${offerId}/hero.jpg`;
const updatedAt = "2026-08-17T12:34:56.000Z";

const completeInput: EditableOfferInput = {
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
  bookingUrl: "https://tripahead.example/atlantic-surf-week",
  heroImagePath: heroPath,
};

const draftRow = {
  id: offerId,
  slug: completeInput.slug,
  activity: completeInput.activity,
  title: completeInput.title,
  subtitle: completeInput.subtitle,
  short_description: completeInput.shortDescription,
  description: completeInput.content,
  location: completeInput.location,
  start_date: completeInput.startDate,
  end_date: completeInput.endDate,
  duration_days: completeInput.durationDays,
  group_size_min: completeInput.groupSizeMin,
  group_size_max: completeInput.groupSizeMax,
  price_from: completeInput.priceFrom,
  currency: completeInput.currency,
  booking_url: completeInput.bookingUrl,
  hero_image: completeInput.heroImagePath,
  status: "draft",
  updated_at: updatedAt,
};

const publishedRow = {
  ...draftRow,
  id: "b1f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  slug: "published-surf-week",
  status: "published",
};

const archivedRow = {
  ...draftRow,
  id: "c2f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  slug: "archived-surf-week",
  status: "archived",
};

type QueryResult = { data: unknown; error: unknown };

const createQuery = (result: QueryResult) => {
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

const createMutationQuery = (result: QueryResult) => {
  const query = Object.assign(createQuery(result), {
    insert: vi.fn(),
    update: vi.fn(),
    single: vi.fn(),
    delete: vi.fn(),
  });
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.single.mockReturnValue(query);
  return query;
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe("administrator offer repository", () => {
  it("lists offers of every status", async () => {
    const query = createQuery({
      data: [draftRow, publishedRow, archivedRow],
      error: null,
    });
    mockedSupabase.from.mockReturnValue(query);

    await expect(listAdminOffers()).resolves.toMatchObject([
      { status: "draft", updatedAt },
      { status: "published", updatedAt },
      { status: "archived", updatedAt },
    ]);
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("updated_at"));
    expect(query.eq).not.toHaveBeenCalledWith("status", "published");
  });

  it("rejects a malformed administrator list update timestamp", async () => {
    const query = createQuery({
      data: [{ ...draftRow, updated_at: "not-an-iso-timestamp" }],
      error: null,
    });
    mockedSupabase.from.mockReturnValue(query);

    await expect(listAdminOffers()).rejects.toMatchObject({
      name: "OfferRepositoryError",
      message: "Nie udało się odczytać danych oferty.",
    });
  });

  it("maps only PostgreSQL 23505 to the duplicate-slug message", async () => {
    const databaseError = { code: "23505" };
    mockedSupabase.from.mockReturnValue(createMutationQuery({ data: null, error: databaseError }));

    await expect(createOffer(completeInput)).rejects.toMatchObject({
      message: "Taki adres oferty już istnieje",
      cause: databaseError,
    });
  });

  it("normalizes input and always creates a draft", async () => {
    const query = createMutationQuery({ data: draftRow, error: null });
    mockedSupabase.from.mockReturnValue(query);

    await expect(
      createOffer({ ...completeInput, title: `  ${completeInput.title}  ` }),
    ).resolves.toMatchObject({
      id: offerId,
      title: completeInput.title,
      status: "draft",
      heroImagePath: heroPath,
    });
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: completeInput.title, status: "draft" }),
    );
  });

  it("rejects invalid input before contacting Supabase", async () => {
    await expect(
      createOffer({ ...completeInput, bookingUrl: "http://tripahead.example/oferta" }),
    ).rejects.toMatchObject({
      name: "OfferRepositoryError",
      message: "Nie udało się zapisać oferty.",
    });
    expect(mockedSupabase.from).not.toHaveBeenCalled();
  });

  it("gets an administrator offer by slug without a public-status filter", async () => {
    const query = createQuery({ data: draftRow, error: null });
    mockedSupabase.from.mockReturnValue(query);

    await expect(getAdminOffer(completeInput.slug)).resolves.toMatchObject({
      id: offerId,
      slug: completeInput.slug,
      status: "draft",
    });
    expect(query.eq).toHaveBeenCalledWith("slug", completeInput.slug);
    expect(query.eq).not.toHaveBeenCalledWith("status", "published");
  });

  it("returns null when an administrator offer slug does not exist", async () => {
    const query = createQuery({ data: null, error: null });
    mockedSupabase.from.mockReturnValue(query);

    await expect(getAdminOffer("missing-offer")).resolves.toBeNull();
  });

  it("parses updates and scopes them to the offer id", async () => {
    const query = createMutationQuery({ data: draftRow, error: null });
    mockedSupabase.from.mockReturnValue(query);

    await expect(updateOffer(offerId, completeInput)).resolves.toMatchObject({
      id: offerId,
      status: "draft",
    });
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ slug: completeInput.slug, description: completeInput.content }),
    );
    expect(query.eq).toHaveBeenCalledWith("id", offerId);
  });

  it("requires the hero image row to belong to the offer and match its path", async () => {
    const offerQuery = createQuery({ data: draftRow, error: null });
    const imageQuery = createQuery({
      data: { alt_text: "Surfer na fali w Ericeirze" },
      error: null,
    });
    mockedSupabase.from.mockReturnValueOnce(offerQuery).mockReturnValueOnce(imageQuery);

    await expect(canPublishOffer(offerId)).resolves.toBe(true);
    expect(offerQuery.eq).toHaveBeenCalledWith("id", offerId);
    expect(imageQuery.eq).toHaveBeenCalledWith("offer_id", offerId);
    expect(imageQuery.eq).toHaveBeenCalledWith("storage_path", heroPath);
  });

  it("does not mark an offer as published without a matching hero image alt", async () => {
    const offerQuery = createQuery({ data: draftRow, error: null });
    const imageQuery = createQuery({ data: null, error: null });
    mockedSupabase.from.mockReturnValueOnce(offerQuery).mockReturnValueOnce(imageQuery);

    await expect(setOfferStatus(offerId, "published")).rejects.toMatchObject({
      message: "Dodaj obraz główny z opisem alternatywnym przed publikacją.",
    });
    expect(mockedSupabase.from).toHaveBeenCalledTimes(2);
  });

  it.each(["abcd", ` ${"a".repeat(181)} `])(
    "rejects a hero image alt outside the trimmed 5–180 character range",
    async (altText) => {
      const offerQuery = createQuery({ data: draftRow, error: null });
      const imageQuery = createQuery({ data: { alt_text: altText }, error: null });
      mockedSupabase.from.mockReturnValueOnce(offerQuery).mockReturnValueOnce(imageQuery);

      await expect(canPublishOffer(offerId)).resolves.toBe(false);
    },
  );

  it("publishes only after readiness succeeds", async () => {
    const offerQuery = createQuery({ data: draftRow, error: null });
    const imageQuery = createQuery({ data: { alt_text: "Opis głównego zdjęcia" }, error: null });
    const publishedOfferRow = { ...draftRow, status: "published" };
    const mutationQuery = createMutationQuery({ data: publishedOfferRow, error: null });
    mockedSupabase.from
      .mockReturnValueOnce(offerQuery)
      .mockReturnValueOnce(imageQuery)
      .mockReturnValueOnce(mutationQuery);

    await expect(setOfferStatus(offerId, "published")).resolves.toMatchObject({
      id: offerId,
      status: "published",
    });
    expect(mutationQuery.update).toHaveBeenCalledWith({ status: "published" });
    expect(mutationQuery.eq).toHaveBeenCalledWith("id", offerId);
  });

  it("unpublishes directly to draft without requiring image readiness", async () => {
    const mutationQuery = createMutationQuery({ data: draftRow, error: null });
    mockedSupabase.from.mockReturnValue(mutationQuery);

    await expect(setOfferStatus(offerId, "draft")).resolves.toMatchObject({ status: "draft" });
    expect(mockedSupabase.from).toHaveBeenCalledOnce();
    expect(mutationQuery.update).toHaveBeenCalledWith({ status: "draft" });
  });

  it("archives with an update and never deletes an offer", async () => {
    const mutationQuery = createMutationQuery({ data: null, error: null });
    mockedSupabase.from.mockReturnValue(mutationQuery);

    const result: void = await archiveOffer(offerId);

    expect(result).toBeUndefined();
    expect(mutationQuery.update).toHaveBeenCalledWith({ status: "archived" });
    expect(mutationQuery.eq).toHaveBeenCalledWith("id", offerId);
    expect(mutationQuery.select).not.toHaveBeenCalled();
    expect(mutationQuery.single).not.toHaveBeenCalled();
    expect(mutationQuery.delete).not.toHaveBeenCalled();
  });

  it("preserves an unrelated database cause without using the duplicate-slug message", async () => {
    const databaseError = { code: "42501", details: "row-level security" };
    mockedSupabase.from.mockReturnValue(createMutationQuery({ data: null, error: databaseError }));

    await expect(createOffer(completeInput)).rejects.toMatchObject({
      name: "OfferRepositoryError",
      message: "Nie udało się zapisać oferty.",
      cause: databaseError,
    });
  });

  it("deduplicates nonempty paths and keeps only valid HTTPS signed URLs", async () => {
    const secondPath = `offers/${offerId}/second.jpg`;
    const createSignedUrls = vi.fn().mockResolvedValue({
      data: [
        { path: heroPath, signedUrl: "https://signed.example/hero.jpg" },
        { path: secondPath, signedUrl: "http://signed.example/second.jpg" },
        { path: "unexpected.jpg", signedUrl: "not a url" },
      ],
      error: null,
    });
    mockedSupabase.storage.from.mockReturnValue({ createSignedUrls });

    await expect(
      resolveAdminImageUrls([heroPath, "", "   ", heroPath, secondPath]),
    ).resolves.toEqual(new Map([[heroPath, "https://signed.example/hero.jpg"]]));
    expect(mockedSupabase.storage.from).toHaveBeenCalledWith("offer-images");
    expect(createSignedUrls).toHaveBeenCalledWith([heroPath, secondPath], 3600);
  });

  it("does not sign private image paths during SSR", async () => {
    vi.stubGlobal("window", undefined);
    const createSignedUrls = vi.fn();
    mockedSupabase.storage.from.mockReturnValue({ createSignedUrls });

    await expect(resolveAdminImageUrls([heroPath])).resolves.toEqual(new Map());
    expect(createSignedUrls).not.toHaveBeenCalled();
  });
});
