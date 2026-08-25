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

`build` prerenderuje wyłącznie strony marketingowe i generuje
`.output/public/sitemap.xml` oraz końcowy `.output/public/robots.txt`.
Szczegóły ofert są pobierane w przeglądarce z Supabase, więc opublikowanie
oferty w CMS nie wymaga nowego deployu.
`check:seo` sprawdza meta dane, canonicale, język, robots, sitemapę, brak
panelu admina, statycznych szczegółów ofert oraz podpisanych URL-i Storage.

## Pierwszy merge i kontrola

Po merge'u do `main` sprawdź view-source dla strony głównej i `/wyjazdy`.
Treść szczegółu oferty ładuje się po stronie przeglądarki, dlatego testuj ją
normalnie po otwarciu adresu `/wyjazdy/:slug` albo `/polkolonie/:slug`.
Otwórz też `/sitemap.xml` i `/robots.txt`; sitemap nie może zawierać `/admin`
ani dynamicznych szczegółów ofert.

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
