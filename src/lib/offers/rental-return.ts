import { defaultStringifySearch } from "@tanstack/react-router";

export const rentalSearch = (kind: string, slug: string) => defaultStringifySearch({ kind, slug });

export function rentalReturn(kind: string, slug: string): { href: string; label: string } {
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && (kind === "trip" || kind === "day_camp")) {
    return { href: `/${kind === "trip" ? "wyjazdy" : "obozy"}/${slug}/`, label: "Wróć do oferty" };
  }
  return { href: "/wyjazdy/", label: "Wróć do wyjazdów" };
}
