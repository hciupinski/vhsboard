# VHSBOARD

## Description

VHSBOARD is a Polish marketing website for small-group surfing and snowboarding
trips, eventy z torem skimboardowym oraz obozy. It presents current
offers and trip details, with a lightweight Supabase admin CMS for managing
offer content.

Bookings are handled externally through a configured registration system. VHSBOARD does not manage
reservations, payments, availability, or participant data.

## Tech stack

- React 19 and TypeScript
- Vite
- TanStack Router, Start, and Query
- Tailwind CSS 4
- Radix UI primitives
- Bun

The CMS uses Supabase for its database, authentication, private image storage,
and Row Level Security. Cloudflare hosts the static frontend.

## How to run

Install dependencies and start the development server:

```bash
bun install
bun run dev
```

Useful commands:

```bash
bun run typecheck
bun run test
bun run build
bun run check:seo
bun run images:check
bun run lint
bun run format
```

## Wdrożenia

Gałąź `main` wdraża produkcję na `https://vhsboard.pages.dev`, a `develop`
wersję testową na `https://develop.vhsboard.pages.dev`. Każde środowisko używa
własnego projektu Supabase. Workflow uruchamia push, merge lub ręczne
wywołanie z właściwej gałęzi. Domena `vhsboard.pl` pozostaje poza zakresem
tego wdrożenia i nadal obsługuje ją WordPress. Konfigurację, procedurę wydań
oraz sprawdzenia wdrożenia opisuje
[runbook wdrożenia](docs/deployment-runbook.md).

Do uruchomienia strony publicznej wymagane są również publiczne zmienne
konfiguracyjne danych kontaktowych i firmy: `VITE_CONTACT_EMAIL`,
`VITE_CONTACT_PHONE`, `VITE_BUSINESS_NAME`, `VITE_BUSINESS_STREET`,
`VITE_BUSINESS_POSTAL_CODE`, `VITE_BUSINESS_CITY`, `VITE_BUSINESS_NIP` oraz
`VITE_BUSINESS_REGON` i `VITE_BUSINESS_BANK_ACCOUNT`. Wartości umieszczaj w
zmiennych środowiskowych deployu, nigdy w repozytorium.

Techniczne SEO wymaga też `VITE_SITE_URL` (dokładnego originu HTTPS) oraz
`VITE_SEO_INDEXING` (`true` albo `false`). Dopóki adres Pages jest jedynym
adresem wdrożenia, ustaw `VITE_SEO_INDEXING=false`; sitemapę i kontrolę
statycznego outputu opisuje [runbook SEO](docs/seo-runbook.md).

## Supabase lokalnie

Migracje CMS, RLS i prywatny Storage wymagają Docker Desktop oraz Supabase CLI.
Uruchamiaj je z katalogu głównego projektu:

```bash
supabase start
supabase db reset
supabase db lint --fail-on error
supabase test db supabase/tests
```

Instrukcję ręcznego nadania roli administratora, zasady podpisanych URL-i i
bezpiecznej ewolucji schematu zawiera [runbook Supabase](docs/supabase-runbook.md).

Publikacja i edycja ofert, PDF-ów oraz wybór zdjęć karuzeli w CMS nie wymagają
rebuilda. Zmiany kodu, zdjęć repozytorium, fontów i grafik OG wymagają deployu.
Aktualne trasy i granice aplikacji opisuje [architektura](docs/architecture.md),
a reguły mediów i interakcji — [system designu](docs/design-system.md).

## Dokumentacja

`docs/` zawiera aktualny opis rozwiązania, design system, runbooki i notatki
wydań w `docs/releases/YYYY-MM-DD.N.md`. Plany i specyfikacje zadań przedstawiaj
w czacie, a wyniki pracy w czacie, PR lub właściwym trackerze. Pliki robocze powstają
w katalogu tymczasowym poza repozytorium. Trwałe ustalenia dopisuj do właściwego
istniejącego dokumentu po sprawdzeniu ich zgodności z kodem. Szczegółowe zasady
dokumentowania pracy zawiera [przewodnik agentów](AGENTS.md#documentation-and-agent-working-materials).
