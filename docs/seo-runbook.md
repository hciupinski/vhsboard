# Runbook technicznego SEO

## Konfiguracja

SEO jest budowane osobno dla każdego środowiska Pages. GitHub Environment
`production` dotyczy main, a `development` dotyczy develop; oba używają jednego
projektu Pages i oddzielnych buildów.

- `VITE_SITE_URL` musi być dokładnym originem HTTPS, bez ścieżki, query,
  fragmentu, portu i danych logowania.
- `VITE_SEO_INDEXING` musi mieć wartość `false` albo `true`.
- Produkcja używa `VITE_SITE_URL=https://vhsboard.pl` oraz
  `VITE_SEO_INDEXING=true`.

Dla dev zawsze ustaw `VITE_SITE_URL=https://develop.vhsboard.pages.dev` oraz
`VITE_SEO_INDEXING=false`. Sprawdź meta robots i nagłówek preview X-Robots-Tag.

Te wartości, podobnie jak publiczne `VITE_SUPABASE_URL` i
`VITE_SUPABASE_ANON_KEY`, konfiguruj jako GitHub Environment variables właściwego środowiska. Anon key
jest konfiguracją klienta, nie sekretem uprzywilejowanym; nie dodawaj nigdy
service-role key.

## Lokalna kontrola

W lokalnym `.env.local` ustaw jawnie wartości SEO oraz istniejące dane firmy
i Supabase. Nie commituj tego pliku. Następnie uruchom:

```bash
bun run typecheck
bun run test
bun run lint
bun run build
bun run check:seo
```

`build` prerenderuje wyłącznie strony marketingowe i generuje
`.output/public/sitemap.xml` oraz końcowy `.output/public/robots.txt`.
Szczegóły ofert są pobierane w przeglądarce z Supabase, więc opublikowanie
oferty w CMS nie wymaga nowego deployu. Canonicale, `og:url`, JSON-LD i
mapa witryny używają końcowego ukośnika dla statycznych stron katalogowych
(np. `/wyjazdy/`); strona główna pozostaje `/`, a szczegóły ofert zachowują
swoje adresy.
`check:seo` sprawdza meta dane, canonicale, język, robots, sitemapę, brak
panelu admina, statycznych szczegółów ofert oraz podpisanych URL-i Storage.

## Kontrola po wdrożeniu

Po wdrożeniu `main` sprawdź view-source dla strony głównej i `/wyjazdy`.
Treść szczegółu oferty ładuje się po stronie przeglądarki, dlatego testuj ją
normalnie po otwarciu adresu `/wyjazdy/:slug` albo `/obozy/:slug`.
Otwórz też `/sitemap.xml` i `/robots.txt`; sitemap nie może zawierać `/admin`
ani dynamicznych szczegółów ofert.

Przed publikacją oferty potwierdź ręcznie rzeczywistą cenę PLN oraz działający
link HTTPS do zewnętrznego systemu zapisów. Dane firmy w JSON-LD pochodzą wyłącznie z publicznej
konfiguracji deployu, więc muszą odpowiadać zatwierdzonym danym firmy.

## Kontrola domeny produkcyjnej

Po zmianach konfiguracji lub deployu sprawdź canonicale, sitemapę, robots.txt
i `index, follow` na `https://vhsboard.pl`. Utrzymuj zgodne adresy Auth
i osobną konfigurację development.

## HTML ofert i panelu

Dynamiczne adresy `/wyjazdy/:slug` i `/obozy/:slug` otrzymują publiczny shell
`/_shell/app.html`, a `/admin` i `/admin/*` — `/_shell/admin.html`.
Publiczny shell zawiera `index, follow` tylko przy `VITE_SEO_INDEXING=true`.
Panel zawsze ma `noindex, nofollow`, niezależnie od tego ustawienia.
Shell publiczny nie ma canonicala wskazującego techniczny adres. Prawidłowy
canonical, tytuł i opis konkretnej oferty ustawia aplikacja po pobraniu danych.
Podgląd `?preview=true`, brak oferty oraz stany błędów mają noindex.
Bezpieczny fallback główny również ma noindex.

Pozostawiamy szczegóły ofert pobierane przez JS: CMS nie generuje HTML i nie
wywołuje rebuilda. Robot musi uruchomić JavaScript i odczytać dane, aby zobaczyć
pełną ofertę. Nie ma gwarancji terminu indeksacji. Część botów udostępniania nie
uruchamia JS, dlatego zobaczy ogólny podgląd VHSBOARD z publicznego shellu.
Oferty nie są dodawane do sitemapy ani generowane statycznie.

## Open Graph i Twitter

Strony marketingowe mają własne lokalne grafiki sekcji `/og/*.jpg` 1200×630.
Szczegóły ofert używają ogólnej grafiki ofert; zdjęcie podpisane z Supabase nie
jest trwałym obrazem OG. Nie umieszczaj w metadanych adresów zawierających
query ani token Storage. Regenerację grafik opisuje
[runbook wdrożenia](deployment-runbook.md).

Kontrola `check:seo` wymaga jednej deklaracji robots i spójnych OG/Twitter,
wymiarów i alt obrazu; sprawdza oba shelle oraz fizyczne pliki grafik.
Po zmianie routingu lub metadanych zbuduj i sprawdź lokalnie oba ustawienia
`VITE_SEO_INDEXING=false` i `true`; nie zmieniaj tym ustawienia konta GitHub.
Po próbie z `true` odtwórz lokalny artefakt dla rzeczywistej konfiguracji deployu.

## Migracja istniejących adresów

Przy zmianach przekierowań porównuj adresy starej mapy witryny, menu, linków
wewnętrznych, Search Console i logów oraz uwzględnij publiczne pliki PDF.
Dla każdego adresu potwierdź aktualną treść, odpowiednik i wynik HTTP. Stosuj pojedyncze 301 tylko do rzeczywiście równoważnej
treści; nie kieruj wszystkich brakujących adresów na stronę główną.

Zatwierdzone przekierowania starego WordPressa są w
[`public/_redirects`](../public/_redirects). Dawny adres `/skimboarding/`
prowadzi do `/eventy/`. Większość adresów starych ofert prowadzi do `/wyjazdy/`,
a `/home/oboz_zimowy-freestyle` (również z końcowym ukośnikiem) prowadzi do
`/obozy/oboz-freestyle-2027`. Przekierowania pozostawiają bez zmian obecne
adresy ofert w CMS.

Po deployu sprawdź pełne łańcuchy
przekierowań, końcowe statusy i treść na rzeczywistej domenie.

## Statyczne 404 i cache

`public/404.html` wyłącza domyślny fallback SPA Cloudflare Pages dla nieznanych
ścieżek; Pages zwraca tę stronę ze statusem 404. Jawne reguły `_redirects`
nadal kierują szczegóły ofert i panel do odpowiednich shelli. Ponieważ shell
oferty jest statyczny, nieistniejący slug również otrzymuje HTTP 200 przed
sprawdzeniem w przeglądarce; sam komunikat i noindex nie zmieniają tego statusu.
Pełne 404 dla tych adresów wymaga mechanizmu znającego stan CMS przed odpowiedzią.

`public/_headers` ustawia roczny `immutable` wyłącznie na `/assets/*`, gdzie Vite
umieszcza wersjonowane hashem zasoby. Nie umieszczaj tam plików bez hasha ani
HTML. Pozostałe ścieżki zachowują domyślne zachowanie Pages, w tym rewalidację.
Po wdrożeniu sprawdź nagłówki rzeczywistego pliku JS/CSS z hashem i HTML oraz
powtórz po kolejnym deployu. Sam lokalny plik `_headers` nie dowodzi działania
konfiguracji CDN.
