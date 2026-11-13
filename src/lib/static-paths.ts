/** Prerendered marketing routes, as used by the router and build output. */
export const staticPaths = [
  "/",
  "/o-nas",
  "/wyjazdy",
  "/eventy",
  "/obozy",
  "/kontakt",
  "/wypozyczalnia",
] as const;

/** Cloudflare Pages serves these directory routes at their trailing-slash URL. */
export function canonicalStaticPath(path: string): string {
  return path !== "/" && staticPaths.some((route) => route === path) ? `${path}/` : path;
}
