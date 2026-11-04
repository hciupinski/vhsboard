# Deployment Environments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Udostępnić stabilną produkcję z `main` i izolowany dev z `develop` na `develop.vhsboard.pages.dev`.

**Architecture:** Jeden projekt Cloudflare Pages Direct Upload `vhsboard`, dwa GitHub Environments i dwa projekty Supabase. GitHub Actions wybiera środowisko wyłącznie z pełnego refa, wdraża migracje przed frontendem i weryfikuje oba adresy. Produkcja zachowuje obecne dane i adres do osobnego przepięcia domeny.

**Tech Stack:** GitHub Actions, Bun, TypeScript/Vitest, Vite/TanStack Start, Supabase CLI `3.0.0`, Cloudflare Wrangler.

**Spec:** [Projekt środowisk](2026-11-04-deployment-environments-design.md).

**Status:** Zadania 1–2 przygotowane w branchu roboczym, konfiguracja GitHub w toku. Nowy pipeline nie jest jeszcze wdrożony. Wybrany sposób przyszłej realizacji: praca agenta; bez wymogu wyboru modelu lub tworzenia nowego czatu.

**Lokalizacja:** `docs/plans/`, zgodnie z aktualną konwencją repozytorium;
domyślne `docs/superpowers/` jest wykluczone przez `.gitignore`.

## Global Constraints

- Jeden projekt Pages `vhsboard`; `main` → `production`, `develop` → `development`.
- Artefakt wyłącznie `.output/public`; bez Workers i dodatkowego backendu.
- Supabase CLI `3.0.0`; jawne `db push --remote --dry-run`, potem `db push --remote --yes`.
- Nigdy `service_role`, hasła ani tokeny w `VITE_*`, repozytorium, logach i czacie.
- Dev zawsze `VITE_SITE_URL=https://develop.vhsboard.pages.dev`, `VITE_SEO_INDEXING=false`.
- Produkcja przed domeną: `https://vhsboard.pages.dev`, `false`; nie zmieniamy teraz DNS.
- Obecny Supabase pozostaje produkcyjny; dev ma nowy projekt, dane i konto admina.
- PR-y nie otrzymują deployment Environment ani sekretów; bez `pull_request_target`.
- Zachowujemy nazwy jobs Verify: `test`, `lint`, `typecheck`, `build`.
- Migracje kompatybilne wstecz; rollback frontendu nie jest rollbackiem bazy.
- Nie wdrażamy rezerwacji; CTA TripAhead pozostają zewnętrzne.

## Review Focus

1. Dispatch z innego refa/tagu: nie uzyskuje Environment i nie wykonuje mutacji (zadania 1–2).
2. Skopiowane production credentials do dev: niezgodność project ref/URL zatrzymuje pipeline przed migracją (zadania 1, 3).
3. Usunięcie repo-level vars: Verify nadal działa bez sekretów i dostępu do hostowanego Supabase (zadania 2–3).
4. Dwa branche wdrażane równolegle albo ponowienie starego runu: dev nie zmienia root aliasu, stare SHA nie zastępuje nowego (zadania 2, 4).
5. Reset hasła i refresh dynamicznej trasy na aliasie dev: właściwy Auth, działający shell i noindex (zadania 3–4).

## Mapa plików

| Plik                                                                     | Odpowiedzialność                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `scripts/deployment-config.ts` — nowy                                    | Czyste funkcje wyboru środowiska i walidacji celu            |
| `scripts/deployment-config.test.ts` — nowy                               | Negatywne i pozytywne przypadki konfiguracji                 |
| `scripts/check-deployment-config.ts` — nowy                              | Mały CLI walidacji `process.env`, bez wypisywania wartości   |
| `.github/workflows/deploy-pages.yml`                                     | Rozszerzenie istniejącego deployu na main/develop            |
| `.github/workflows/verify.yml`                                           | Verify obu baz PR, syntetyczne wartości testowe              |
| `.env.example`                                                           | Opis konfiguracji lokalnej dev, bez prawdziwych wartości     |
| `docs/deployment-runbook.md`                                             | Setup, obsługa obu branchy i diagnostyka                     |
| `docs/supabase-runbook.md`                                               | Cele migracji, izolacja, konto dev i Auth                    |
| `docs/seo-runbook.md`, `docs/architecture.md`                            | Dwa środowiska i osobny etap domeny                          |
| `docs/deployment-environments-verification.md` — nowy podczas realizacji | Faktycznie wykonane kontrole, runy, SHA, screenshoty i braki |

Nie zmieniamy UI ani schematu bazy na potrzeby samego rozdzielenia wdrożeń.

### Task 1: kontrola celu przed operacją na hostowanym środowisku

**Owner:** agent. **Files:** trzy nowe pliki `scripts/deployment-config*` z mapy.

**Interfaces:**

```ts
export type DeploymentTarget = {
  branch: "main" | "develop";
  environment: "production" | "development";
};
export function resolveDeploymentTarget(gitRef: string): DeploymentTarget;
export function validateDeploymentEnvironment(
  target: DeploymentTarget,
  environment: Record<string, string | undefined>,
): void;
export function validatePagesProject(project: unknown): void;
```

Consumes: pełny Git ref i zmienne przekazane jawnie przez job. Produces:
zweryfikowany cel albo wyjątek zawierający wyłącznie bezpieczny opis i nazwy pól.

- [x] Napisz testy `resolveDeploymentTarget`: main → production/main,
      develop → development/develop; `refs/tags/main`, `refs/heads/feature/x`, pusty
      ref i `refs/remotes/origin/develop` rzucają błąd.
- [x] Napisz testy walidacji: fixture z dwoma różnymi refs Supabase; poprawne
      development i production/Pages/false przechodzą; production/vhsboard.pl/false
      i true przechodzą jako konfiguracja przyszłego etapu.
- [x] Napisz tabelę odrzuceń: brak wymaganej zmiennej lub same spacje;
      równe oczekiwane refs; zły project ID; URL innego projektu; dev z produkcyjnym
      URL; dev z indexing=true; pomylony origin; niespójna para environment/branch;
      Pages production z indexing=true; inny projekt Pages niż `vhsboard`.
- [x] Test wymaga niepustych wszystkich nazw z `.env.example` oraz pięciu
      environment secrets i obu oczekiwanych refs. Nie sprawdza formatu prywatnych
      tokenów; istniejąca walidacja aplikacji odpowiada za dane firmy.
- [x] Test błędów z kontrolnymi wartościami anon key, hasła i tokenu sprawdza,
      że żadna z tych wartości nie pojawia się w komunikacie wyjątku.
- [x] Testy `validatePagesProject`: obiekt z `name: "vhsboard"`,
      `subdomain: "vhsboard.pages.dev"`, `production_branch: "main"` przechodzi;
      `production_branch: "develop"`, inna nazwa/subdomena, null lub brak pól rzucają
      bezpieczny błąd. Funkcja sprawdza dane z API, nie odczytuje sieci samodzielnie.
- [x] Uruchom `bun run test -- scripts/deployment-config.test.ts`; oczekuj
      porażki z powodu brakującej implementacji, nie błędu konfiguracji test runnera.
- [x] Zaimplementuj funkcje: mapowanie tylko dwóch pełnych refów; walidacja URL
      Supabase na dokładny `https://<expected-ref>.supabase.co`; porównanie z
      `SUPABASE_PROJECT_ID`; repo-level oczekiwane refs przekazane jako
      `SUPABASE_PRODUCTION_PROJECT_REF` i `SUPABASE_DEVELOPMENT_PROJECT_REF`.
- [x] CLI wywołuje obie funkcje z `GITHUB_REF` i `process.env`, przy sukcesie
      kończy kodem 0, przy błędzie kodem 1 i bezpiecznym komunikatem. Bez sieci
      i bez wykonywania migracji.
- [x] Uruchom testy zakresu, typecheck i lint; wynik PASS/0 błędów.
- [x] Commit: `feat: validate deployment environment targets`.

### Task 2: workflow dwóch środowisk i dokumentacja operacyjna

**Owner:** agent. **Files:** oba workflows, `.env.example`, cztery istniejące
runbooki/architecture z mapy.

**Interfaces:** consumes funkcje z zadania 1; resolver wystawia outputs
`environment` i `branch`, konsumowane przez jobs migracji i uploadu.

- [ ] W izolowanym branchu `codex/deployment-environments` od świeżego main
      rozszerz trigger push o `develop`, zachowaj `workflow_dispatch` bez parametru
      środowiska. Nazwa workflow może zmienić się na `Deploy Pages`; nazwy Verify
      i jego jobs pozostają niezmienione.
- [ ] Dodaj `resolve-target` z job-level allowlistą pełnych refów main/develop,
      bez Environment i sekretów. Po checkout/setup-bun wywołuje funkcję resolvera
      i zapisuje tylko stałe outputs do `GITHUB_OUTPUT`.
- [ ] `verify` zależy od resolvera, wykonuje typecheck, test, lint i build:ci.
      Podaj syntetyczne wartości jawnie, m.in. URL `https://project.supabase.co`,
      anon `test-anon-key`, site `https://vhsboard.pages.dev`, indexing `false`
      i dotychczasowe przykładowe dane firmy z Verify. Nie czytaj repozytoryjnych
      wartości produkcji i nie podłączaj Environment.
- [ ] `deploy-supabase` zależy od resolve-target i verify, wybiera Environment
      z outputu. Przekaż pełny zestaw wymagany przez walidację z `vars`/`secrets`
      tego Environment oraz dwie repo-level oczekiwane refs. Sekrety narzędzi
      ogranicz do kroków, które ich potrzebują.
- [ ] Przed migracją sprawdź `GITHUB_SHA` względem aktualnego heada brancha
      przez odczyt GitHub/Git, przerwij dla nieaktualnego commita. Uruchom CLI
      walidacji przed `supabase link`. Zachowaj pin CLI i kolejność dry-run → push.
- [ ] `deploy-cloudflare` zależy od resolve-target i deploy-supabase; ten sam
      Environment, komplet `VITE_*`, walidacja celu oraz build i check:seo.
      Przed uploadem ponownie sprawdź head; nie przesyłaj artefaktu starszego SHA.
- [ ] Wrangler otrzymuje projekt `vhsboard`, jawny branch z resolvera oraz
      commit hash `GITHUB_SHA` przez obsługiwany parametr. Zachowaj przypięte SHA
      używanych Actions, bez aktualizacji zależności w tym zakresie.
- [ ] Bezpośrednio przed każdym uploadem wykonaj autoryzowany GET Pages API
      `/accounts/{account_id}/pages/projects/vhsboard`. Sprawdź status HTTP,
      `success: true` i przekaż `result` do `validatePagesProject`. Błąd sieci,
      zła production branch lub inny projekt blokują upload; nie wypisuj tokenu
      ani pełnej odpowiedzi. To kontrola również rutynowych deployów, nie tylko setupu.
- [ ] Concurrency zachowuje historyczną grupę `production-deploy` dla main;
      develop używa `pages-deploy-refs/heads/develop`, `cancel-in-progress:
false`. Main i develop nie blokują ani nie anulują wzajemnych wdrożeń.
- [ ] Sprawdź URL zwrócony przez Wrangler: HTTPS, dokładnie host projektu
      albo jego deployment subdomena, bez danych logowania/query/fragmentu/portu.
      Zachowaj kontrolę odpowiedzi i dodaj bounded retry dla stabilnego aliasu
      root/develop, weryfikując SHA deploymentu w metadanych Pages, zamiast
      traktować sam HTTP 200 jako dowód nowej wersji.
- [ ] Summary zapisuje SHA, branch, Environment, deployment URL i stabilny
      URL. Nie zapisuje odpowiedzi zawierających sekrety ani signed Storage URLs.
- [ ] Verify: PR bases `[main, develop]`; syntetyczne zmienne dla testów,
      bez Environment i secrets, build pozostaje `bun run build:ci`.
- [ ] Uaktualnij dokumentację do nowego modelu i dodaj checklistę setupu z
      sekcji „Zależności od użytkownika”. `.env.example` zachowuje puste wartości;
      komentarz kieruje lokalny frontend do dev i zabrania commitowania `.env.local`.
- [ ] Uruchom `bun run typecheck`, `bun run test`, `bun run lint`,
      `bun run build:ci`, `bun run build`, `bun run check:seo`, `bun run images:check`.
      Pełny build wymaga przygotowanej konfiguracji; brak jej jest jawnie odnotowany,
      nie zastępowany wynikiem build:ci. Sprawdź również wariant domeny z indeksowaniem
      wyłącznie lokalnie, odtwórz rzeczywistą konfigurację po sprawdzeniu.
- [ ] Sprawdź YAML przez actionlint (jeśli trzeba, zainstaluj narzędzie poza
      zależnościami aplikacji) oraz Prettier; oczekuj braku błędów.
- [ ] Commit: `ci: deploy main and develop to isolated environments`.
- [ ] Przygotuj PR do main z zakresem, kolejnością bootstrapu, kontrolami i
      jednoznacznym stwierdzeniem, że DNS oraz treści CMS nie są migrowane.

## Zależności od użytkownika — przed aktywacją workflow

Agent wykonuje wszystko, do czego ma autoryzowany dostęp. Nie prosi o hasła
w czacie. Lista ręczna w odpowiedzi sesji obejmuje:

1. Supabase: utworzenie projektu `vhsboard-dev`, zachowanie database password,
   pozyskanie project ref, Project URL i publicznego legacy `anon` key.
2. Supabase Auth dev: Site URL aliasu develop, dokładny reset-password callback,
   wyłączona rejestracja publiczna. Agent może ustawić niesekretne pola przez
   udostępnioną zalogowaną konsolę; bez dostępu wykonuje je użytkownik.
3. Wygenerowanie tokenów Supabase/Cloudflare tylko jeśli potrzebne; istniejących
   produkcyjnych nie odczytujemy. CF wymaga Pages Edit na właściwym koncie.
4. Wpisanie sekretów do gotowego Environment development w GitHub, analogicznie
   braków w production. Publiczny URL i key wpisuje się jako environment variables.
5. Po migracjach: ręczne utworzenie konta Auth dev i nadanie mu roli admin
   przygotowanym SQL-em; lokalne logowanie bez podawania hasła agentowi.
6. Dostępy hosting/domena dla VHS-051 dopiero przy osobnym przepięciu domeny.

### Task 3: przygotowanie kont, bootstrap i ochrona branchy

**Owner:** agent; zależności ręczne powyżej. **Files:** raport weryfikacji,
runbooki jeśli wyniki odczytu kont wymagają korekty instrukcji.

**Interfaces:** consumes zweryfikowane publiczne refs obu Supabase i pipeline
z zadania 2; produces skonfigurowane Environments i dwa rzeczywiste deploymenty.

- [ ] Odczytaj live ustawienia GitHub i Pages przez autoryzowany API/CLI lub
      udostępnioną konsolę. Nie wyświetlaj wartości sekretów. Potwierdź projekt
      `vhsboard`, production_branch `main`, Direct Upload i brak nowej integracji Git.
      Direct Upload może wymagać API do korekty production_branch; nie zakładaj
      dostępności takiej opcji w UI. Nie zmieniaj teraz domen/DNS.
- [ ] Utwórz lub zachowaj GitHub Environments production/development; ustaw
      branch policies dokładnie main/develop, bez tagów. Przy dostępnych uprawnieniach
      wykonaj konfigurację przez API. Jeśli narzędzie nie ma dostępu, przekaż tylko
      brakującą czynność użytkownikowi, z gotową nazwą i wartością niesekretną.
- [ ] Przed migracją ustaw oczekiwane refs repo i environment variables według
      specyfikacji. Zachowaj produkcyjny Supabase, origin i indexing=false. Istniejących
      sekretów production nie odtwarzaj; sprawdź obecność nazw. Użytkownik wprowadza
      nowe secrets i anon key bezpośrednio w panelu.
- [ ] Potwierdź dwa różne refs i hosty Supabase, komplet nazw sekretów i variables,
      konfigurację Auth dev. Nie usuwaj jeszcze starych repo-level vars, ponieważ
      bieżący workflow przed mergem może ich potrzebować.
- [ ] Zbierz baseline: root Pages, aktualny deployment SHA, wygląd strony,
      opublikowane oferty oraz motyw przez odczyt. Zapisz w raporcie bez danych wrażliwych.
- [ ] Poczekaj na zakończenie istniejących produkcyjnych runów starego workflow.
      Nie ponawiaj historycznych runów bez nowych guards.
      Po akceptacji konkretnego PR i gotowości konfiguracji wykonaj merge
      bootstrapu do main; obserwuj verify → migracje → frontend. Sukces main nie
      oznacza sukcesu dev. Nie omijaj branch protection.
- [ ] Utwórz develop od świeżego main po tym mergu i pushuj bez force. Jeśli
      develop już istnieje, porównaj historię i przenieś bootstrap zwykłym PR;
      nie resetuj istniejącej pracy. Push uruchamia pierwszy deploy dev.
- [ ] Sprawdź w logach właściwy cel migracji i w metadanych Pages preview
      branch develop/SHA. Potwierdź dostępność `https://develop.vhsboard.pages.dev`.
- [ ] Po migracjach poprowadź użytkownika przez utworzenie konta dev i SQL
      `insert into public.profiles (id, role) values ('<AUTH_UUID>', 'admin')
on conflict (id) do update set role = excluded.role;` wyłącznie w dev SQL Editor.
- [ ] Skonfiguruj wymagane status checks na obu branchach dopiero po ich
      rzeczywistym pojawieniu się. Zachowaj istniejące reguły; PR wymagany, brak
      force push i usuwania branchy. Odczytaj wynik konfiguracji z API.
- [ ] Usuń redundantne repo-level kopie konfiguracji środowisk dopiero po
      zielonych deployach. Powtórz Verify na PR do obu baz, aby potwierdzić brak
      zależności od tych kopii.

### Task 4: dowody działania i instrukcja codziennej pracy

**Owner:** agent. **Files:** `docs/deployment-environments-verification.md`,
uzupełnienia runbooków.

**Interfaces:** consumes działający alias dev i opcjonalną sesję admina po
ręcznym logowaniu; produces raport z faktycznych kontroli i trwałych dowodów.

- [ ] Sprawdź pełny build obu konfiguracji i istniejące testy SEO; na dev
      canonical/sitemap wskazują dev, HTML i publiczny shell mają noindex,
      admin shell zawsze noindex. Odczytaj nagłówki preview, sprawdź X-Robots-Tag.
- [ ] W przeglądarce sprawdź stronę główną, sześć marketingowych tras,
      bezpośrednie wejście i refresh `/wyjazdy/<test-slug>`, `/obozy/<test-slug>`,
      `/admin/login`, `/admin/reset-password` oraz przekierowanie legacy `/trips/<slug>`.
- [ ] Po ręcznym zalogowaniu do dev sprawdź draft/publikację oferty TEST,
      upload obrazu i PDF oraz zmianę motywu. Porównaj hosty żądań Supabase.
      Sprawdź brak tych zmian na produkcji odczytem; nie zapisuj testów do produkcji.
- [ ] Przetestuj reset hasła konta dev: mail wraca do dev callbacku i nowe
      hasło działa; użytkownik obsługuje prywatną skrzynkę/link. Nie zapisuj tokenów
      ani fragmentów URL w raporcie i screenshotach.
- [ ] Uruchom `supabase start`, `supabase db reset`,
      `supabase db lint --fail-on error`, `supabase test db supabase/tests`,
      `supabase stop` w lokalnym/disposable stosie. Oczekuj sukcesu istniejących
      testów RLS; nigdy nie uruchamiaj resetu ani fixture tests na produkcji.
- [ ] Sprawdź obsługę zwykłego użytkownika i anonimowego odczytu draftów na dev
      zgodnie z testami RLS; brak uprawnień admina i brak publicznych szkiców.
- [ ] Sprawdź dispatch z brancha spoza allowlisty: brak uprzywilejowanych jobs.
      Nie testuj błędnych credentials przeciwko produkcji; pokrywa je test zadania 1.
- [ ] Sprawdź zachowanie starego SHA bez uruchamiania produkcyjnych migracji
      ze starego workflow: porównanie head odrzuca stale commit na dev. Odczytaj
      osobne grupy concurrency i potwierdź, że dev deployment jest preview oraz
      nie zmienił produkcyjnego SHA/root aliasu.
- [ ] Zapisz rzeczywiste screenshoty dev i production na 1440×900 i 390×844
      w folderze projektu Drive; raport zawiera trwałe linki, URL, datę, run ID,
      commit, wyniki i niewykonane kontrole. Nie aktualizuj VHS-051 jako zakończonego.
- [ ] Uzupełnij instrukcję: feature → PR do develop → weryfikacja preview →
      PR develop do main → produkcja; hotfix main synchronizowany do develop.
      Treści CMS i pliki nie przechodzą przez merge.
- [ ] Dokumentuj awarię: błąd migracji blokuje frontend; rollback tylko do
      zgodnego frontendu, naprawa bazy do przodu. Bez automatycznych down migrations.
- [ ] Przegląd końcowy diffu i raportu; commit dokumentacji weryfikacyjnej,
      bez deklaracji zakończenia kontroli, których nie wykonano.

## Późniejszy etap — przepięcie `vhsboard.pl`

To osobna operacja po gotowości produkcji i rozwiązaniu dostępów VHS-051:
audyt URL WordPress/301, zachowanie DNS poczty, Custom domain/TLS,
Auth Site URL i callback domeny, production `VITE_SITE_URL` i indeksowanie,
nowy build/deploy, testy domeny. Redirect z dokładnego root Pages nie może
obejmować aliasu develop. Dev i jego Supabase pozostają bez zmian.

## Kontrola planu przed przekazaniem do realizacji

- [x] Wymagania specyfikacji przypisano zadaniom lub późniejszemu etapowi domeny.
- [x] Nazwy środowisk, outputs, zmiennych i interfejsów są spójne.
- [x] Pięć ryzyk z Review Focus ma wskazane kontrole w zadaniach.
- [x] Praca wymagająca sekretów jest oddzielona od przygotowania repozytorium.
- [x] Plan nie deklaruje zmiany ustawień kont, deployu ani zakończenia VHS-051.
- [x] Niezależny builder-check nie wskazał nierozstrzygniętych pytań; jego uwagę
      o weryfikacji rzeczywistego `production_branch` Pages uwzględniono przed uploadem.
