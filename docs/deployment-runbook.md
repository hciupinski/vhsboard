# Runbook wdrożenia

## Środowiska

Jeden projekt Cloudflare Pages Direct Upload `vhsboard` obsługuje produkcję
z `main` (`https://vhsboard.pages.dev`, docelowo `https://vhsboard.pl`) i preview
z `develop` (`https://develop.vhsboard.pages.dev`). Budowanie i migracje prowadzi
GitHub Actions, bez integracji Git Cloudflare i bez serwera aplikacyjnego.
Ta konfiguracja nie przepina domeny ani istniejącego WordPressa.

| Ustawienie                                | production                                 | development                                |
| ----------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| Dozwolony ref                             | `refs/heads/main`                          | `refs/heads/develop`                       |
| Supabase project ref                      | `jiqgcbqsbmzokcmtjtsw`                     | `hrtxiivubihmxsjuxzer`                     |
| `VITE_SUPABASE_URL`                       | `https://jiqgcbqsbmzokcmtjtsw.supabase.co` | `https://hrtxiivubihmxsjuxzer.supabase.co` |
| `VITE_SITE_URL` przed migracją domeny     | `https://vhsboard.pages.dev`               | `https://develop.vhsboard.pages.dev`       |
| `VITE_SEO_INDEXING` przed migracją domeny | `false`                                    | `false`                                    |

## Jednorazowe przygotowanie

1. Potwierdź w API Pages: projekt `vhsboard`, subdomena `vhsboard.pages.dev`,
   `production_branch=main`. Direct Upload może wymagać API do zmiany tej gałęzi.
   Nie ustawiaj develop jako production branch i nie dodawaj teraz domeny.
2. GitHub Environments: `production` dopuszcza tylko branch `main`,
   `development` tylko `develop`; bez reguł tagów. Zachowaj istniejące reguły ochrony.
3. W każdym Environment ustaw publiczne variables: `CLOUDFLARE_PAGES_PROJECT=vhsboard`,
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`,
   `VITE_SEO_INDEXING`. Nie ustawiaj ich na poziomie całego workflow: muszą być
   odczytane dopiero przez job związany z właściwym Environment.
4. Dane firmy `VITE_CONTACT_*` i `VITE_BUSINESS_*` z `.env.example` mogą pozostać
   wspólne jako repository variables. W Environment można je nadpisać, np. na
   testowe dane kontaktowe; pamiętaj, że wszystkie `VITE_*` są publiczne.
5. Repozytoryjne variables `SUPABASE_PRODUCTION_PROJECT_REF` i
   `SUPABASE_DEVELOPMENT_PROJECT_REF` przechowują powyższe dwa różne refs jako
   oczekiwane cele walidacji. Nie są sekretami.
6. Każdy Environment zawiera secrets: `SUPABASE_ACCESS_TOKEN`,
   `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID`, `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID`. Użytkownik wpisuje prywatne wartości bezpośrednio
   w GitHub. `SUPABASE_PROJECT_ID` musi zgadzać się z oczekiwanym refem.
   `GITHUB_TOKEN` jest automatyczny. Nigdy nie dodawaj `service_role`.
7. Projekt Supabase dev odtwarza schemat, RLS i prywatne buckety z migracji;
   nie kopiujemy automatycznie ofert, Auth ani obiektów Storage z produkcji.
   Skonfiguruj Auth i testowe konto według [runbooka Supabase](supabase-runbook.md).

Tokeny mogą mieć szersze uprawnienia niż jedno środowisko. Samo rozdzielenie
GitHub Environments nie ogranicza tokenu Pages do preview ani tokenu Supabase
do jednego projektu. Ten układ izoluje dane i normalne wdrożenia; nie jest
izolacją produkcji od złośliwego workflow dysponującego szerokim tokenem.

## Pipeline i kontrole

PR do `main` albo `develop` uruchamia **Verify**: jobs `test`, `lint`,
`typecheck`, `build`. Weryfikacja używa syntetycznej konfiguracji publicznej,
bez Environment i deployment secrets. `build:ci` pomija prerender i sitemapę.

Push do main/develop lub ręczny **Deploy Pages** z jednego z tych branchy:

1. `resolve-target` wybiera Environment wyłącznie z pełnego Git refa; inne
   branche i tagi nie uruchamiają uprzywilejowanych jobs.
2. `verify` wykonuje typecheck, test, lint i build:ci bez danych produkcyjnych.
3. `deploy-supabase` sprawdza head brancha i komplet konfiguracji; URL i project ID
   muszą wskazywać oczekiwany Supabase. CLI `3.0.0` wykonuje jawne link,
   `db push --remote --dry-run`, potem `db push --remote --yes`.
4. `deploy-cloudflare` ponownie waliduje konfigurację, wykonuje pełny build i SEO,
   zapisuje publiczny `_deployment.json` z SHA/branchem/Environment i sprawdza head
   oraz rzeczywisty `production_branch=main` przez Pages API przed uploadem.
5. Wrangler publikuje wyłącznie `.output/public`, z jawnym branchem i SHA.
   Kontrola po deployu porównuje środowisko/branch/SHA/status w API oraz wersję
   serwowaną z konkretnego deployment URL i stałego adresu. Maksymalnie sześć prób,
   z timeoutami HTTP i przerwami po 5 s. Summary podaje zweryfikowane URL i SHA.

Błąd migracji blokuje frontend. W nowym workflow nieaktualny commit jest odrzucany
przed migracją oraz uploadem; wdrażaj najnowszy head, zamiast uruchamiać stary run. Osobne grupy
concurrency chronią każde środowisko przed nakładającymi się migracjami;
`cancel-in-progress=false` nie przerywa trwającej migracji. GitHub może zastąpić
oczekujący run nowszym, więc nie każdy commit musi zostać osobno opublikowany.

## Pierwszy start i codzienna praca

Przed aktywacją poczekaj na zakończenie wszystkich istniejących deployów produkcji.
Dla main zachowujemy dotychczasową grupę concurrency `production-deploy`, aby
stary run nie nałożył się na bootstrap. Nie ponawiaj runów sprzed bootstrapu:
GitHub używa w nich starego workflow z pierwotnego SHA, bez nowych zabezpieczeń.
Zamiast tego uruchom aktualny workflow z bieżącego main.

Przed mergem nowego pipeline przygotuj obydwa Environments i wymagane nazwy
sekretów/variables. Pierwszy bootstrap trafia do main przy zachowaniu obecnej
produkcji i jej Supabase. Po zielonym deployu utwórz develop od świeżego main
albo przenieś bootstrap PR-em na istniejący develop; nigdy nie resetuj cudzej pracy.
Push develop stosuje migracje nowego Supabase i publikuje pierwszy preview.
Po migracjach utwórz osobnego administratora dev.

Później: feature → PR do develop → testy na stałym aliasie → PR develop do main
→ produkcja. Hotfix main przenieś również do develop przez PR. Wymagaj czterech
rzeczywistych kontroli Verify na obu branchach; nie omijaj istniejących reguł.
Merge przenosi kod i migracje, ale nie oferty, konta ani pliki CMS.

Usuń stare repository-level kopie konfiguracji Supabase/SEO dopiero po zielonych
wdrożeniach i sprawdzeniu Verify do obu branchy. Wspólne dane firmy mogą pozostać.

## Diagnostyka i dowody

- Przy błędzie konfiguracji sprawdź nazwy i Environment; nie wypisuj wartości
  sekretów, pełnego środowiska ani odpowiedzi API do logów.
- Przy błędzie migracji sprawdź project ref i konkretny krok; nie uruchamiaj resetu,
  seedów QA ani automatycznych down migrations na produkcji.
- Przy błędzie Pages sprawdź cel projektu, uprawnienia tokenu, production branch,
  SHA oraz wersję pod stałym aliasem; sam HTTP 200 nie potwierdza nowego kodu.
- Publiczny preview ma noindex, ale domyślnie nie jest prywatny. Access można
  włączyć osobno; wtedy kontrola publicznych URL wymaga odpowiedniego dostępu.
- Sprawdź publiczne trasy, refresh szczegółów ofert i admina, logowanie/reset,
  odczyt draftów i izolację zapisów dev od produkcji. Screenshoty 1440×900 i
  390×844, URL, SHA i run CI zapisuj w raporcie i folderze projektu Drive.
- Nie zgłaszaj wdrożenia na podstawie merge lub samego lokalnego buildu.

## Przyszłe przepięcie domeny

Osobny etap po uzyskaniu dostępów hosting/domena z VHS-051: audyt URL WordPress
oraz przekierowań 301, zachowanie DNS poczty, dodanie Pages Custom domain i TLS,
aktualizacja Auth produkcji, `VITE_SITE_URL=https://vhsboard.pl`, dopiero przy
uruchomieniu indeksowania `VITE_SEO_INDEXING=true`, nowy build/deploy i kontrola SEO.
Redirect dokładnie z `vhsboard.pages.dev` nie może objąć aliasu develop.

## Zmiany treści

CMS zapisuje oferty, galerie, PDF-y, karuzelę i motyw w Supabase wybranego
środowiska. Nie przebudowuje Pages. Kod, katalog lokalnych fotografii, fonty,
OG oraz publiczne dane firmy z `VITE_*` wymagają nowego buildu/deployu.

## Zdjęcia, fonty i podglądy udostępniania

Po zmianie oryginałów w `src/assets` uruchom:

```bash
bun run images:generate
bun run images:check
bun run typecheck
bun run og:generate
bun run build
bun run check:seo
```

Zacommituj warianty `public/images/generated`, manifest oraz
`src/lib/images/local-assets.generated.ts` razem ze źródłami. Generator tworzy
AVIF/WebP dla szerokości 480, 960 i 1600 px (bez powiększania i kadrowania,
maksymalna wysokość 1920 px); budżety to 180 KiB dla najmniejszego i 450 KiB
na każdy większy wariant. Checker wykrywa brak plików, rozbieżne hashe źródeł,
rozmiary i nieaktualny katalog TypeScript. `images:check` jest obecnie kontrolą
lokalną, nie osobnym krokiem CI. Katalog zachowuje konkretne klucze plików;
`getLocalImage` przyjmuje tylko `LocalImagePath`. Po zmianie nazwy lub usunięciu
zdjęcia regeneracja katalogu i `typecheck` wykryją pozostałe odwołania w kodzie.
Sprawdzaj oba polecenia: `images:check` wykrywa nieaktualne wygenerowane pliki,
a `typecheck` błędne ścieżki w aplikacji. W tablicach zdjęć zachowuj literały
ścieżek, np. przez `as const`; nie omijaj sprawdzania rzutowaniem na `LocalImagePath`.

`og:generate` zapisuje siedem JPEG-ów 1200×630 w `public/og`, do 300 KiB każdy.
`check:seo` weryfikuje ich obecność, rozmiar i metadane. Obejrzyj wygenerowane
kadry przed commitem. Te grafiki są ogólne dla sekcji, nie powstają przy edycji
oferty w CMS.

Fonty są importowane z `@fontsource` w `src/styles.css`: Bebas Neue 400 oraz
Barlow 400/500/600/700 i kursywa 400, z latin i latin-ext. Przy zmianie fontów
zaktualizuj importy i lockfile, sprawdź polskie znaki oraz łamanie nagłówków na
telefonie, następnie wykonaj build/deploy. Nie przywracaj Google Fonts CSS.

## Kontrola i diagnoza przed merge

```bash
bun run typecheck
bun run test
bun run lint
bun run build:ci
bun run build
bun run check:seo
bun run images:check
```

Pełny build wymaga prawidłowych publicznych zmiennych w `.env.local`. Kontrola
PR `build:ci` nie zastępuje pełnego prerenderingu ani `check:seo`. Jeśli problem
występuje tylko na deployu, zacznij od logów konkretnego kroku w Actions,
porównaj nazwy i konfigurację publicznych zmiennych, potem sprawdź stronę Pages
oraz dostępność Supabase. Do problemów z logowaniem sprawdź Auth i rekord roli;
do błędów treści — odpowiednią tabelę, RLS i logi Storage. Nie obchodź RLS.

Repozytorium nie wdraża automatycznych backupów, alertów ani rollbacku bazy.
Sprawdź możliwości i aktualną konfigurację kopii w projekcie Supabase przed
operacją na danych. Nie traktuj ponownego deployu starego frontendu jako
cofnięcia migracji bazy. Migracje powinny zachowywać zgodność ze starszym kodem.
