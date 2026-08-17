import { afterEach, describe, expect, it, vi } from "vitest";

const mockedSupabase = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
}));

vi.mock("../supabase", () => ({ supabase: mockedSupabase }));

import {
  getAdminSession,
  sanitizeAdminNext,
  signInWithPassword,
  signOut,
} from "./session";

const user = { id: "user-1", email: "admin@example.test" };

const stubProfile = (result: { data: { role: string } | null; error: Error | null }) => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  mockedSupabase.from.mockReturnValue(query);
  return query;
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("getAdminSession", () => {
  it("returns null when there is no Supabase session", async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    await expect(getAdminSession()).resolves.toBeNull();
    expect(mockedSupabase.from).not.toHaveBeenCalled();
  });

  it("returns null when Supabase cannot read the current session", async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error("session unavailable"),
    });

    await expect(getAdminSession()).resolves.toBeNull();
    expect(mockedSupabase.from).not.toHaveBeenCalled();
  });

  it("returns null when the profile lookup fails", async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: { user } }, error: null });
    stubProfile({ data: null, error: new Error("profile unavailable") });

    await expect(getAdminSession()).resolves.toBeNull();
  });

  it.each([null, { role: "editor" }, { role: "owner" }])(
    "returns null when the profile is not an administrator: %o",
    async (profile) => {
      mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: { user } }, error: null });
      stubProfile({ data: profile, error: null });

      await expect(getAdminSession()).resolves.toBeNull();
    },
  );

  it("returns only the declared contract for the exact admin role", async () => {
    mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: { user } }, error: null });
    const profileQuery = stubProfile({ data: { role: "admin" }, error: null });

    await expect(getAdminSession()).resolves.toEqual({
      userId: "user-1",
      email: "admin@example.test",
      role: "admin",
    });
    expect(mockedSupabase.from).toHaveBeenCalledWith("profiles");
    expect(profileQuery.select).toHaveBeenCalledWith("role");
    expect(profileQuery.eq).toHaveBeenCalledWith("id", "user-1");
  });
});

describe("authentication calls", () => {
  it("passes credentials only to Supabase password sign-in", async () => {
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    await expect(signInWithPassword("admin@example.test", "sekret")).resolves.toBeUndefined();
    expect(mockedSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@example.test",
      password: "sekret",
    });
  });

  it("rejects Supabase sign-in and sign-out errors without transforming their details", async () => {
    const signInError = new Error("invalid credentials");
    const signOutError = new Error("network unavailable");
    mockedSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: signInError });
    mockedSupabase.auth.signOut.mockResolvedValue({ error: signOutError });

    await expect(signInWithPassword("admin@example.test", "sekret")).rejects.toBe(signInError);
    await expect(signOut()).rejects.toBe(signOutError);
  });
});

describe("sanitizeAdminNext", () => {
  it.each(["/admin", "/admin/oferta-testowa"])("accepts an internal admin path: %s", (next) => {
    expect(sanitizeAdminNext(next)).toBe(next);
  });

  it.each([
    "https://attacker.test",
    "//attacker.test",
    "/oferty",
    "/admin?next=https://attacker.test",
    "/admin#outside",
    "%E0%A4%A",
  ])("falls back to /admin for an unsafe return value: %s", (next) => {
    expect(sanitizeAdminNext(next)).toBe("/admin");
  });
});
