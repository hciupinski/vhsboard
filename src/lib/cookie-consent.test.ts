import { afterEach, describe, expect, it, vi } from "vitest";

import { COOKIE_CONSENT_NAME, getCookiePreferences, saveCookiePreferences } from "./cookie-consent";

const clearCookiePreferences = () => {
  document.cookie = `${COOKIE_CONSENT_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
};

afterEach(() => {
  clearCookiePreferences();
});

describe("cookie consent preferences", () => {
  it("returns a stored analytics and marketing choice", () => {
    document.cookie = `${COOKIE_CONSENT_NAME}=${encodeURIComponent(
      JSON.stringify({ analytics: true, marketing: false }),
    )}; Path=/`;

    expect(getCookiePreferences()).toEqual({ analytics: true, marketing: false });
  });

  it("ignores a malformed cookie instead of assuming consent", () => {
    document.cookie = `${COOKIE_CONSENT_NAME}=not-json; Path=/`;

    expect(getCookiePreferences()).toBeNull();
  });

  it("persists both category values in the consent cookie", () => {
    expect(saveCookiePreferences({ analytics: false, marketing: true })).toBe(true);

    expect(document.cookie).toContain(`${COOKIE_CONSENT_NAME}=`);
    expect(getCookiePreferences()).toEqual({ analytics: false, marketing: true });
  });

  it("reports a failed save when the browser does not retain the cookie", () => {
    const cookieSetter = vi.spyOn(document, "cookie", "set").mockImplementation(() => undefined);

    expect(saveCookiePreferences({ analytics: true, marketing: true })).toBe(false);

    cookieSetter.mockRestore();
  });
});
