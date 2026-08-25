# Runbook technicznego SEO

## Konfiguracja

SEO jest budowane razem z jedynym artefaktem Cloudflare Pages. Nie ma osobnego
środowiska staging.

- `VITE_SITE_URL` musi być dokładnym originem HTTPS, bez ścieżki, query,
  fragmentu, portu i danych logowania.
- `VITE_SEO_INDEXING` musi mieć wartość `false` albo `true`.
- Obecnie ustaw `VITE_SITE_URL` na adres projektu `*.pages.dev` oraz
  `VITE_SEO_INDEXING=false`. Roboty mogą pobrać stronę, ale HTML zawsze
  zawiera `noindex, nofollow`.

Te wartości, podobnie jak publiczne `VITE_SUPABASE_URL` i
`VITE_SUPABASE_ANON_KEY`, konfiguruj jako GitHub Actions variables. Anon key
jest konfiguracją klienta, nie sekretem uprzywilejowanym; nie dodawaj nigdy
service-role key.

## Lokalna kontrola

W lokalnym `.env.local` ustaw jawnie wartości SEO oraz istniejące dane firmy
i Supabase. Nie commituj tego pliku. Następnie uruchom:

```bash
bun run test
bun run lint
bun run build
bun run check:seo
```

`build` pobiera wyłącznie opublikowane rekordy i celowo kończy się błędem,
jeżeli nie może otrzymać slugów potrzebnych do prerenderingu. Generuje
`.output/public/sitemap.xml` oraz końcowy `.output/public/robots.txt`.
`check:seo` sprawdza meta dane, canonicale, język, robots, sitemapę, brak
panelu admina, skeletonów oraz podpisanych URL-i Storage.

## Pierwszy merge i kontrola

Po merge'u do `main` sprawdź view-source dla strony głównej, `/wyjazdy` i
jednego opublikowanego `/wyjazdy/:slug`. Treść szczegółu, title, description,
canonical i `noindex, nofollow` muszą być dostępne bez JavaScriptu. Otwórz też
`/sitemap.xml` i `/robots.txt`; sitemap nie może zawierać `/admin`.

Przed publikacją oferty potwierdź ręcznie rzeczywistą cenę PLN oraz działający
link HTTPS do zewnętrznego systemu zapisów. Dane firmy w JSON-LD pochodzą wyłącznie z publicznej
konfiguracji deployu, więc muszą odpowiadać zatwierdzonym danym firmy.

## Przełączenie domeny w Tasku 100

Po skonfigurowaniu i zweryfikowaniu DNS dla `vhsboard.pl` zmień w tym samym
workflow, bez tworzenia nowego środowiska:

```text
VITE_SITE_URL=https://vhsboard.pl
VITE_SEO_INDEXING=true
```

Wykonaj nowy build i deploy, następnie sprawdź canonicale, sitemapę i
`index, follow` na wdrożonej domenie przed zgłoszeniem jej do indeksowania.
