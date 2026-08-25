export type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

export type SeoConfig = {
  siteUrl: string;
  indexing: boolean;
};

type PublicEnvironment = Record<string, string | undefined>;

const requirePublicEnvironmentVariable = (name: string, value: string | undefined): string => {
  if (value == null || value.trim() === "") {
    throw new Error(`Brak wymaganej zmiennej środowiskowej: ${name}.`);
  }

  return value;
};

const validateHttpsUrl = (url: string): void => {
  try {
    if (new URL(url).protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error("VITE_SUPABASE_URL musi być poprawnym adresem HTTPS.");
  }
};

const validateHttpsOrigin = (value: string): string => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("VITE_SITE_URL musi być poprawnym originem HTTPS.");
  }

  const isOriginOnly =
    url.protocol === "https:" &&
    url.username === "" &&
    url.password === "" &&
    url.port === "" &&
    url.pathname === "/" &&
    url.search === "" &&
    url.hash === "";

  if (!isOriginOnly) {
    throw new Error("VITE_SITE_URL musi być poprawnym originem HTTPS.");
  }

  return url.origin;
};

export const getPublicSupabaseConfigFrom = (
  environment: PublicEnvironment,
): PublicSupabaseConfig => {
  const url = requirePublicEnvironmentVariable(
    "VITE_SUPABASE_URL",
    environment["VITE_SUPABASE_URL"],
  );
  const anonKey = requirePublicEnvironmentVariable(
    "VITE_SUPABASE_ANON_KEY",
    environment["VITE_SUPABASE_ANON_KEY"],
  );

  validateHttpsUrl(url);

  return { url, anonKey };
};

export const getPublicSupabaseConfig = (): PublicSupabaseConfig =>
  getPublicSupabaseConfigFrom(import.meta.env);

export const getSeoConfigFrom = (environment: PublicEnvironment): SeoConfig => {
  const siteUrl = validateHttpsOrigin(
    requirePublicEnvironmentVariable("VITE_SITE_URL", environment["VITE_SITE_URL"]),
  );
  const indexingValue = requirePublicEnvironmentVariable(
    "VITE_SEO_INDEXING",
    environment["VITE_SEO_INDEXING"],
  );

  if (indexingValue !== "true" && indexingValue !== "false") {
    throw new Error("VITE_SEO_INDEXING musi mieć wartość true albo false.");
  }

  return { siteUrl, indexing: indexingValue === "true" };
};

export const getSeoConfig = (): SeoConfig => getSeoConfigFrom(import.meta.env);
