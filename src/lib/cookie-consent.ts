export const COOKIE_CONSENT_NAME = "vhsboard_cookie_consent";
const cookieMaxAgeInSeconds = 60 * 60 * 24 * 180;

export type CookiePreferences = {
  analytics: boolean;
  marketing: boolean;
};

export const defaultCookiePreferences: CookiePreferences = {
  analytics: false,
  marketing: false,
};

export function getCookiePreferences(): CookiePreferences | null {
  if (typeof document === "undefined") return null;

  const encodedValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_CONSENT_NAME}=`))
    ?.slice(COOKIE_CONSENT_NAME.length + 1);

  if (!encodedValue) return null;

  try {
    const value: unknown = JSON.parse(decodeURIComponent(encodedValue));

    return isCookiePreferences(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveCookiePreferences(preferences: CookiePreferences): boolean {
  if (typeof document === "undefined") return false;

  try {
    document.cookie = `${COOKIE_CONSENT_NAME}=${encodeURIComponent(
      JSON.stringify(preferences),
    )}; Max-Age=${cookieMaxAgeInSeconds}; Path=/; SameSite=Lax`;

    const storedPreferences = getCookiePreferences();

    return (
      storedPreferences?.analytics === preferences.analytics &&
      storedPreferences.marketing === preferences.marketing
    );
  } catch {
    return false;
  }
}

function isCookiePreferences(value: unknown): value is CookiePreferences {
  if (typeof value !== "object" || value === null) return false;

  const preferences = value as Record<string, unknown>;

  return typeof preferences.analytics === "boolean" && typeof preferences.marketing === "boolean";
}
