# VHSBOARD Technical Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Naprawić kontrolę typów i blokadę indeksowania publicznych ofert oraz udokumentować rzeczywistą architekturę.

**Architecture:** Zachowujemy statyczny hosting i pobieranie ofert z Supabase w przeglądarce. Dwa ogólne pliki startowe rozdzielają indeksowalne oferty od CMS; nie generujemy HTML konkretnej oferty. Typecheck blokuje CI przed migracjami.

**Tech Stack:** React 19, TypeScript, TanStack Start/Router/Query, Vitest, Bun, GitHub Actions, Cloudflare Pages.

**Spec:** [Wspólny zakres i kryteria](../specs/2026-10-09-site-quality-improvements.md).

## Global Constraints

- Oferty pozostają pobierane przez JavaScript z Supabase.
- Hosting pozostaje statycznym Cloudflare Pages; bez Workers i osobnego backendu.
- Nie osłabiamy `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` ani RLS.
- Nie zmieniamy domeny, DNS, produkcyjnych danych ani ustawień kont usług.
- Nie wdrażamy rezerwacji, zaliczek, płatności ani kont klientów.

## Review Focus

- Zmiana `preview` w tym samym URL nie może pokazać szkicu jako danych publicznych — test loaderDeps/query keys w zadaniu 5.
- `next` spoza CMS nie może stać się przekierowaniem po loginie — istniejące testy `session.test.ts`, zadanie 5.
- Przy indexing=true CMS musi mieć noindex również przed JS — test artefaktu admin shellu, zadanie 1.
- Przy indexing=false publiczny shell nie może być index — test obu flag, zadanie 1.
- Brak/usunięta oferta i błąd ładowania nie mogą odziedziczyć index po JS — test routera oraz ręczny odbiór, zadanie 1.

---

## Mapa plików

| Pliki                                                                                                                                                                                                                                                                                                                              | Odpowiedzialność                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `package.json`, `tsconfig.json`, `.github/workflows/{verify,deploy-pages}.yml`                                                                                                                                                                                                                                                     | Jedna komenda typecheck i bramki CI.                                                                      |
| `scripts/build-mode.ts`, `src/lib/{auth/session,cookie-consent}.ts`, `src/lib/offers/{admin-repository,day-camp-sections,editor-schema,schema}.ts`                                                                                                                                                                                 | Naprawa typów i granic danych.                                                                            |
| `src/components/admin/OfferEditorForm.tsx`, `src/components/cookie-consent/CookieConsentProvider.tsx`, `src/routes/admin.{$slug,index,login}.tsx`, `src/routes/{wyjazdy,obozy}.$slug.tsx`                                                                                                                                          | Nullable dane, opcjonalne propsy, loaderDeps.                                                             |
| `src/components/admin/OfferEditorForm.test.tsx`, `src/components/public/PublicChrome.test.tsx`, `src/lib/documents/repository.test.ts`, `src/lib/offers/{editor-schema,query-options}.test.ts`, `src/routes/admin.{$slug,index}.test.tsx`, `src/routes/{wyjazdy,obozy}.{$slug,index}.test.tsx`, `src/routes/public-pages.test.tsx` | Dwanaście plików testów wskazanych przez tsc: typowane fixture/router mocks; zachowanie obecnych asercji. |
| `vite.config.ts`, `src/routes/{__root,spa-shell,admin-shell}.tsx`, `public/_redirects`                                                                                                                                                                                                                                             | Generowanie i przepisywanie dwóch shellów.                                                                |
| `scripts/check-seo-build{,.test}.ts`, `src/lib/seo{,.test}.ts`                                                                                                                                                                                                                                                                     | Regresje metadanych i artefaktów.                                                                         |
| `AGENTS.md`, `docs/{architecture,deployment-runbook,seo-runbook,supabase-runbook,design-system}.md`                                                                                                                                                                                                                                | Aktualny opis i utrzymanie.                                                                               |

### Zadanie 5: TypeScript i CI

**Files:** Modify wszystkie istniejące pliki w pierwszych czterech wierszach mapy. Dokładną listę bazową odtworzy `bunx tsc --noEmit`; nie edytować ręcznie `src/routeTree.gen.ts`. Test: istniejące testy modułów oraz `src/routes/{wyjazdy,obozy}.$slug.test.tsx`.

**Interfaces:** Zachować `sanitizeAdminNext(next: string | undefined): AdminPath`, `getAdminSession(): Promise<AdminSession | null>` i publiczne typy ofert. Loadery mają `loaderDeps: ({search}) => ({preview: search.preview})` i odczytują `deps.preview`; nadal zwracają `{offer, slug, preview}`. Produces: skrypt `typecheck` = `tsc --noEmit`, job PR `typecheck` i krok produkcyjnego `verify`.

- [ ] Odtworzyć bazę: `bunx tsc --noEmit > /private/tmp/vhsboard-types-before.log 2>&1`; oczekiwany kod 2 i 119 błędów przed rozszerzeniem include o `scripts/**/*.ts`.
- [ ] Dodać do testów obu loaderów przypadek `preview=true/false`: wywołanie query options dostaje odpowiednią wartość, query keys pozostają oddzielne. Sprawdzić przez prawdziwy testowy router zmianę search przy tym samym slug; loader uruchamia się ponownie. Uruchomić `bun run test -- 'src/routes/wyjazdy.$slug.test.tsx' 'src/routes/obozy.$slug.test.tsx' src/lib/offers/query-options.test.ts`; nowy przypadek ma wykazać brak prawidłowego loaderDeps.
- [ ] Naprawić 72 odczyty indeksowane przez `['property']`; zawężać `unknown` przez obecne schematy Zod. W nullable closure zapisać zawężoną wartość w stałej. Opcjonalne propsy przekazywać warunkowo zamiast explicit undefined. Testy zawężają discriminated union `offerKind` i typują funkcje/mocki rzeczywistymi kontraktami; bez `any`, `@ts-ignore` i zbiorowych non-null assertions.
- [ ] Naprawić kontrakt loaderów przez `loaderDeps` powyżej; testy nie wywołują loader object jak funkcji bez sprawdzenia typu. Dodać type guard `isAdminPath(value: string): value is AdminPath` wewnątrz `src/lib/auth/session.ts`, oparty na istniejącym regex; `sanitizeAdminNext` używa go po walidacji origin/query/hash.
- [ ] Dodać skrypt typecheck i `scripts/**/*.ts` do include. Uruchamiać osobny PR job po frozen install; w produkcyjnym `verify` po install i przed downstream migracjami. Nie zmieniać triggerów, sekretów ani pinów Actions.
- [ ] Uruchomić `bun run typecheck`, `bun run test`, `bun run lint`, `bun run build:ci`; oczekiwany kod 0. `tsconfig` nadal ma wszystkie obecne rygorystyczne flagi. Istniejące testy `src/lib/auth/session.test.ts` nadal odrzucają zewnętrzny `next`.
- [ ] Commit tylko plików zadania: `fix: enforce strict TypeScript checks in CI`.

### Zadanie 1: Publiczny shell index i prywatny shell noindex

**Files:** Modify `vite.config.ts`, `src/routes/__root.tsx`, `src/routes/spa-shell.tsx`, `public/_redirects`, `scripts/check-seo-build{,.test}.ts`, `src/lib/seo{,.test}.ts`; Create `src/routes/admin-shell.tsx`, `src/routes/seo-routing.test.tsx`.

**Interfaces:** Produces `getRobotsContent(indexable: boolean = true): "index, follow" | "noindex, nofollow"` w `src/lib/seo.ts`; korzysta z `getSeoConfig().indexing`. Publiczny plik `/_shell/app.html`; administracyjny `/_shell/admin.html`. `checkSeoBuild({outputDirectory, siteUrl, indexing}): Promise<void>` zachowuje obecny kontrakt.

- [ ] W testach check-seo fixture z indexing=true wymaga publicznego index i admin noindex; wariant false wymaga obu noindex. Dodać odrzucenie brakującego admin shellu i przekierowań `/admin` na publiczny shell. Uruchomić `bun run test -- scripts/check-seo-build.test.ts`; oczekiwany FAIL dla obecnych artefaktów/rewrites.

  ```ts
  it.each(["true", "false"])("keeps private pages noindex for indexing=%s", (flag) => {
    vi.stubEnv("VITE_SEO_INDEXING", flag);
    expect(getRobotsContent(false)).toBe("noindex, nofollow");
    expect(getRobotsContent(true)).toBe(flag === "true" ? "index, follow" : "noindex, nofollow");
  });
  ```

- [ ] Zaimplementować `getRobotsContent`; createPageMetadata używa go z parametrem indexable. Root pozostaje bezpiecznym domyślnym noindex przez `getRobotsContent(false)`. `/spa-shell` dostaje własny head z `getRobotsContent(true)` i pusty komponent. `/admin-shell` jest również pusty, lecz ma własny head z noindex; nie ładuje sesji/danych CMS i nie posiada publicznego canonical do ścieżki technicznej.
- [ ] Dodać `/admin-shell` do allowlist i `pages` pełnego prerenderu z `prerender: {outputPath: '/_shell/admin', autoSubfolderIndex: false, crawlLinks: false}`. Przy build-only nadal nie prerenderować. Zachować sześć stron marketingowych oraz obecną konfigurację publicznego shellu. Aktualizować komentarz spa-shell do rzeczywistego output path.
- [ ] Przepisać tylko `/admin` i `/admin/*` na `/_shell/admin 200`; oferty nadal na `/_shell/app 200`, `/trips/:slug` nadal 301. Check-seo sprawdza robots obu shellów i ich brak podpisanych URL/danych CMS; nadal odrzuca prerender konkretnej oferty i sitemapę z dodatkowymi trasami.
- [ ] W `seo-routing.test.tsx` przez testowy router sprawdzić CMS i podgląd szkicu: `document.querySelectorAll('meta[name="robots"]').length === 1`, content noindex. Sprawdzić null/wrong kind i odrzucony fetch: ekran błędu/404 ma noindex. Użyć deklaratywnego head routera dla fallbacków; nie naprawiać przez bezpośrednie mutowanie DOM. Publiczna prawidłowa oferta przy indexing=true ma pojedyncze index i właściwy canonical po JS.
- [ ] Uruchomić powyższe testy oraz `bun run typecheck`, `bun run lint`. Wykonać pełny `bun run build` i `bun run check:seo` oddzielnie z `VITE_SEO_INDEXING=false` i `true`; env obu komend musi być identyczny. Oczekiwany kod 0 i osiem plików HTML: sześć marketingowych + dwa shelle, bez szczegółów ofert. Nie wdrażać buildu testowego.
- [ ] Commit: `fix: separate public and admin SEO shells`.

### Zadanie 18: Dokumentacja utrzymania — po media i UI

**Files:** Modify `AGENTS.md`, `docs/architecture.md`, `docs/deployment-runbook.md`, `docs/seo-runbook.md`, `docs/supabase-runbook.md`, `docs/design-system.md`.

**Interfaces:** Consumes końcowe komendy `typecheck`, `images:generate`, `images:check`, `og:generate` oraz reguły shellów z wcześniejszych zadań. Produces aktualne instrukcje projektu; nie tworzy nowego mechanizmu infrastruktury.

- [ ] Wyszukać przestarzałe odniesienia: `rg -n 'localStorage|adminStore|src/lib/trips|/oferty|/trips|_shell|verify /|font|primary' AGENTS.md docs`. `/trips` zachować tylko jako udokumentowany legacy redirect; usunąć opis prototypowego CMS i nieaktualnego celu `/oferty`.
- [ ] Opisać obecne trasy marketingowe/CMS, moduły ofert/dokumentów/karuzeli, private Storage/signed URL, role i RLS. Rozdzielić publikację w CMS (widoczna bez rebuild) od aktualizacji kodu/statycznych mediów (wymaga build/deploy).
- [ ] Uzupełnić runbook wdrożenia o typecheck i faktyczną kolejność verify → migracje → pełny build/SEO → Pages. Wyjaśnić, że PR build-only nie sprawdza pełnego prerenderingu. Wymienić wymaganą zmienną `VITE_SEO_INDEXING`; nie włączać jej na koncie. Instrukcje wymaganych statusów odwołują się do rzeczywistych nazw jobs, nie twierdzą, że ochrona już jest skonfigurowana.
- [ ] Uzupełnić SEO o dwa shelle, JS oferty i ograniczenie ogólnego OG. Dodać procedury eksportu zdjęć i fontów; design-system dostaje faktyczne tokeny kontrastu, wysokość headera i zasady motion. Diagnostyka wskazuje logi workflow i bezpieczne komendy; nie dopisuje niewdrożonych backupów/alertów/rollbacku.
- [ ] Sprawdzić wszystkie lokalne odnośniki i ścieżki z dokumentacji; `git diff --check` ma kod 0. Uruchomić końcowe `bun run typecheck`, `bun run test`, `bun run lint`, `bun run build:ci`, `bun run build`, `bun run check:seo`, `bun run images:check` i ręczny odbiór z obu pozostałych planów. Nie powtarzać pełnych testów bez nowych zmian.
- [ ] Commit: `docs: document current architecture and maintenance`.
