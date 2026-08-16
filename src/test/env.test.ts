import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicSupabaseConfig } from "../lib/env";

const validUrl = "https://project.supabase.co";
const anonKey = "test-anon-key-that-must-not-leak";

const stubValidConfig = () => {
  vi.stubEnv("VITE_SUPABASE_URL", validUrl);
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", anonKey);
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getPublicSupabaseConfig", () => {
  it("returns the supplied HTTPS URL and anon key", () => {
    stubValidConfig();

    expect(getPublicSupabaseConfig()).toEqual({
      url: validUrl,
      anonKey,
    });
  });

  it.each(["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"])(
    "rejects a missing %s value",
    (variableName) => {
      stubValidConfig();
      vi.stubEnv(variableName, undefined);

      expect(getPublicSupabaseConfig).toThrow(variableName);
    },
  );

  it.each(["http://project.supabase.co", "not a URL", ""])(
    "rejects an invalid Supabase URL: %s",
    (url) => {
      vi.stubEnv("VITE_SUPABASE_URL", url);
      vi.stubEnv("VITE_SUPABASE_ANON_KEY", anonKey);

      expect(getPublicSupabaseConfig).toThrow();
    },
  );

  it("never includes the anon key in a configuration error", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "http://project.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", anonKey);

    expect(getPublicSupabaseConfig).toThrow();

    try {
      getPublicSupabaseConfig();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain(anonKey);
    }
  });
});
