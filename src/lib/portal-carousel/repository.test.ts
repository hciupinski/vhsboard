import { afterEach, describe, expect, it, vi } from "vitest";

const mockedSupabase = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("../supabase", () => ({ supabase: mockedSupabase }));

import {
  PortalCarouselRepositoryError,
  listAdminPortalCarouselImages,
  listPublicPortalCarouselImages,
  savePortalCarouselImages,
} from "./repository";

const firstId = "123e4567-e89b-12d3-a456-426614174000";
const secondId = "223e4567-e89b-12d3-a456-426614174000";
const thirdId = "323e4567-e89b-12d3-a456-426614174000";

const query = (result: { data: unknown; error: unknown }) => {
  const value = Object.assign(Promise.resolve(result), { select: vi.fn(), order: vi.fn() });
  value.select.mockReturnValue(value);
  value.order.mockReturnValue(value);
  return value;
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("portal carousel repository", () => {
  it("normalizes saved legacy paths and removes duplicate replacement images", async () => {
    mockedSupabase.from.mockReturnValue(
      query({
        data: [
          { id: thirdId, image_path: "carousel/surf_girl.jpg", position: 2 },
          { id: firstId, image_path: "carousel/hero-surf.jpg", position: 0 },
          { id: secondId, image_path: "carousel/3karuzela_surf.png", position: 1 },
        ],
        error: null,
      }),
    );

    await expect(listPublicPortalCarouselImages()).resolves.toMatchObject([
      { path: "carousel/3karuzela_surf.png" },
    ]);
  });

  it("orders known rows and omits unknown database paths", async () => {
    mockedSupabase.from.mockReturnValue(
      query({
        data: [
          { id: secondId, image_path: "carousel/2karuzela_oboz1.png", position: 1 },
          { id: firstId, image_path: "carousel/3karuzela_surf.png", position: 0 },
          { id: thirdId, image_path: "carousel/not-in-repo.jpg", position: 2 },
        ],
        error: null,
      }),
    );

    await expect(listPublicPortalCarouselImages()).resolves.toMatchObject([
      { path: "carousel/3karuzela_surf.png" },
      { path: "carousel/2karuzela_oboz1.png" },
    ]);
  });

  it("uses the same safe ordered query for administrators", async () => {
    mockedSupabase.from.mockReturnValue(
      query({
        data: [{ id: firstId, image_path: "carousel/3karuzela_surf.png", position: 0 }],
        error: null,
      }),
    );

    await expect(listAdminPortalCarouselImages()).resolves.toMatchObject([
      { path: "carousel/3karuzela_surf.png" },
    ]);
  });

  it("wraps malformed database rows in a repository error", async () => {
    mockedSupabase.from.mockReturnValue(
      query({
        data: [{ id: "not-a-uuid", image_path: "carousel/3karuzela_surf.png", position: 0 }],
        error: null,
      }),
    );

    await expect(listPublicPortalCarouselImages()).rejects.toBeInstanceOf(
      PortalCarouselRepositoryError,
    );
  });

  it("rejects duplicate or unknown paths before calling Supabase", async () => {
    await expect(
      savePortalCarouselImages(["carousel/3karuzela_surf.png", "carousel/3karuzela_surf.png"]),
    ).rejects.toThrow("Kolejność karuzeli zawiera powtórzone zdjęcie");
    await expect(savePortalCarouselImages(["carousel/missing.jpg"])).rejects.toThrow(
      "Zdjęcie karuzeli nie istnieje w repozytorium",
    );

    expect(mockedSupabase.rpc).not.toHaveBeenCalled();
  });

  it("wraps a failed save from Supabase", async () => {
    mockedSupabase.rpc.mockResolvedValue({ error: { message: "forbidden" } });

    await expect(savePortalCarouselImages(["carousel/3karuzela_surf.png"])).rejects.toThrow(
      "Nie udało się zapisać karuzeli",
    );
  });
});
