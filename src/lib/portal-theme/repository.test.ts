import { afterEach, describe, expect, it, vi } from "vitest";

const mockedSupabase = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("../supabase", () => ({ supabase: mockedSupabase }));

import { getAdminPortalTheme, getPublicPortalTheme, savePortalTheme } from "./repository";

function query(data: unknown, error: unknown = null) {
  const value = { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
  value.select.mockReturnValue(value);
  value.eq.mockReturnValue(value);
  value.update.mockReturnValue(value);
  value.single.mockResolvedValue({ data, error });
  mockedSupabase.from.mockReturnValue(value);
  return value;
}

afterEach(() => vi.resetAllMocks());

describe("portal theme repository", () => {
  it.each(["original", "winter"])("reads the global %s theme", async (theme) => {
    const request = query({ theme });
    await expect(getPublicPortalTheme()).resolves.toBe(theme);
    expect(mockedSupabase.from).toHaveBeenCalledWith("portal_settings");
    expect(request.eq).toHaveBeenCalledWith("id", 1);
  });

  it.each([null, { theme: "unknown" }, {}])(
    "rejects missing or invalid settings: %j",
    async (data) => {
      query(data);
      await expect(getAdminPortalTheme()).rejects.toThrow("Nie udało się pobrać wyglądu strony");
    },
  );

  it("does not turn a failed read into a successful default", async () => {
    query(null, { message: "unavailable" });
    await expect(getPublicPortalTheme()).rejects.toThrow("Nie udało się pobrać wyglądu strony");
  });

  it("writes only the theme of the singleton and confirms the returned value", async () => {
    const request = query({ theme: "winter" });
    await expect(savePortalTheme("winter")).resolves.toBeUndefined();
    expect(request.update).toHaveBeenCalledWith({ theme: "winter" });
    expect(request.eq).toHaveBeenCalledWith("id", 1);
    expect(request.select).toHaveBeenCalledWith("theme");
  });

  it.each([
    [null, null],
    [{ theme: "original" }, null],
    [null, { message: "forbidden" }],
  ])("never reports an unconfirmed save as successful", async (data, error) => {
    query(data, error);
    await expect(savePortalTheme("winter")).rejects.toThrow("Nie udało się zapisać wyglądu strony");
  });

  it("rejects an unknown theme before sending it to the database", async () => {
    await expect(savePortalTheme("invalid" as "winter")).rejects.toThrow();
    expect(mockedSupabase.from).not.toHaveBeenCalled();
  });
});
