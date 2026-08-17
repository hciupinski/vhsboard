export type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

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

export const getPublicSupabaseConfig = (): PublicSupabaseConfig => {
  const url = requirePublicEnvironmentVariable(
    "VITE_SUPABASE_URL",
    import.meta.env["VITE_SUPABASE_URL"],
  );
  const anonKey = requirePublicEnvironmentVariable(
    "VITE_SUPABASE_ANON_KEY",
    import.meta.env["VITE_SUPABASE_ANON_KEY"],
  );

  validateHttpsUrl(url);

  return { url, anonKey };
};
