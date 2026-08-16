# VHSBOARD

## Description

VHSBOARD is a Polish marketing website for small-group surfing and snowboarding
trips. It presents current offers and trip details, with a lightweight admin
CMS prototype for managing offer content.

Bookings are handled externally through TripAhead. VHSBOARD does not manage
reservations, payments, availability, or participant data.

## Tech stack

- React 19 and TypeScript
- Vite
- TanStack Router, Start, and Query
- Tailwind CSS 4
- Radix UI primitives
- Bun

The current CMS prototype stores data in browser `localStorage`. The planned
production architecture uses Cloudflare for hosting and Supabase for database,
authentication, storage, and Row Level Security.

## How to run

Install dependencies and start the development server:

```bash
bun install
bun run dev
```

Useful commands:

```bash
bun run build
bun run lint
bun run format
```

## Wdrożenia

Tylko gałąź `main` może wdrażać witrynę na bezpłatny adres Cloudflare Pages
`*.pages.dev` — po pushu lub merge'u do `main`, a także przez ręczne
uruchomienie workflow rozpoczęte z `main`. Domena `vhsboard.pl` pozostaje poza
zakresem tego wdrożenia i nadal obsługuje ją WordPress. Ręczną konfigurację oraz
sprawdzenia pierwszego merge'a opisuje
[runbook wdrożenia](docs/deployment-runbook.md).

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
