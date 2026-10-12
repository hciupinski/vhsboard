# Runbook wdrożenia

## Zakres

GitHub Actions wdraża wyłącznie gałąź `main` na bezpłatny adres Cloudflare
Pages `*.pages.dev`. Wdrożenie nie zmienia istniejącej witryny WordPress pod
`vhsboard.pl`; nie konfiguruj w tym procesie własnej domeny ani integracji Git
w Cloudflare.

## Jednorazowe przygotowanie kont

1. W Cloudflare utwórz projekt **Pages Direct Upload**. Projekt nie może mieć
   integracji z Git ani przypisanej własnej domeny. Jego nazwę ustaw później w
   zmiennej `CLOUDFLARE_PAGES_PROJECT`.
2. W GitHub utwórz lub skonfiguruj środowisko `production`. W regułach ochrony
   wdrożenia zezwól wyłącznie na gałąź `main`; nie zezwalaj na wdrożenia z
   innych gałęzi ani tagów. Wszystkie sekrety wdrożeniowe przechowuj tylko w
   tym środowisku, a nie jako sekrety repozytorium lub organizacji.
3. W GitHub (na poziomie repozytorium lub organizacji) dodaj następujące
   publiczne zmienne Actions. Są one przekazywane do kompilacji frontendu, więc
   nie wolno wpisywać w nich sekretów:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL`
   - `VITE_SEO_INDEXING` (`false` na obecnym adresie Pages)
   - `VITE_CONTACT_EMAIL`
   - `VITE_CONTACT_PHONE`
   - `VITE_BUSINESS_NAME`
   - `VITE_BUSINESS_STREET`
   - `VITE_BUSINESS_POSTAL_CODE`
   - `VITE_BUSINESS_CITY`
   - `VITE_BUSINESS_NIP`
   - `VITE_BUSINESS_REGON`
   - `VITE_BUSINESS_BANK_ACCOUNT`
   - `CLOUDFLARE_PAGES_PROJECT`

4. W środowisku GitHub `production` dodaj wyłącznie poniższe sekrety. Ich
   wartości wprowadzaj w ustawieniach GitHub — nigdy w repozytorium, logach
   ani zgłoszeniach:

   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_PROJECT_ID`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

   `GITHUB_TOKEN` jest dostarczany automatycznie przez GitHub Actions i nie
   wymaga ręcznego dodawania.

## Pierwsze wdrożenie

1. Po skonfigurowaniu zmiennych i sekretów zmerguj małą, sprawdzoną zmianę do
   `main`.
2. W zakładce Actions otwórz uruchomienie **Deploy production** dla merge
   commitu. Zweryfikuj kolejność zakończonych zadań:
   `verify` (typecheck, testy i lint), potem `deploy-supabase`, a na końcu
   `deploy-cloudflare` (pełny build, kontrola SEO i upload do Pages).
3. W podsumowaniu zadania wdrożenia otwórz adres Pages `*.pages.dev` zwrócony
   przez krok `pages_deploy`. Potwierdź, że korzysta z HTTPS, ładuje stronę
   główną oraz zawiera właśnie zmergowaną zmianę.
4. Osobno otwórz `https://vhsboard.pl` i potwierdź, że nadal obsługuje ją
   WordPress. Nie dodawaj tej domeny do projektu Pages i nie zmieniaj jej DNS.
5. Dopiero po pomyślnym pierwszym wdrożeniu ustaw dla gałęzi `main` jako
   wymagane kontrole ochrony gałęzi:

   - workflow **Verify**, job `test`
   - workflow **Verify**, job `lint`
   - workflow **Verify**, job `typecheck`
   - workflow **Verify**, job `build`

   Wybierz rzeczywiste kontrole widoczne po uruchomieniu PR w ustawieniach
   GitHub. Powyższe to nazwy workflow i jobs z repozytorium, a nie potwierdzenie,
   że ochrona gałęzi jest już skonfigurowana.

## Bezpieczna diagnostyka

- Jeśli `verify` nie przejdzie, popraw zmianę w pull requeście i poczekaj na
  cztery kontrole workflow **Verify**; nie omijaj ochrony gałęzi.
- Jeśli nie powiedzie się `deploy-supabase`, przejrzyj log kroku migracji i
  sprawdź nazwy oraz uprawnienia sekretów środowiska `production`. Nie uruchamiaj
  ręcznego rollbacku, seedów ani napraw migracji z tego workflow.
- Jeśli nie powiedzie się `deploy-cloudflare` albo kontrola adresu, sprawdź
  nazwę projektu Direct Upload i uprawnienia tokenu Cloudflare. Publikowany jest
  tylko katalog `.output/public`; nie zmieniaj tego na bundle serwera.
- Nie wyświetlaj wartości sekretów ani pełnego środowiska w logach. Do zgłoszeń
  dołączaj identyfikator uruchomienia, nazwę nieudanego kroku i zredagowany
  komunikat błędu.

## Rutynowe użycie

Pull requesty do `main` uruchamiają nieuprzywilejowany workflow **Verify**:
testy, lintowanie, typecheck i kompilację aplikacji bez prerenderingu. Ten build celowo
nie odpyta produkcyjnego Supabase ani nie tworzy sitemapy. Merge do `main`
ponownie wykonuje typecheck, testy i lintowanie, następnie wdraża migracje Supabase, a
dopiero potem wykonuje pełny prerender, kontrolę SEO i wdrożenie statycznego
frontendu do Pages. Ręczne
uruchomienie workflow z innej gałęzi nie wykonuje zadań produkcyjnych.

## Zmiany treści a deploy

CMS zapisuje oferty, metadane galerii, dokumenty PDF i wybór karuzeli w Supabase.
Nowo otwarta strona pobiera aktualną zawartość bez przebudowy Pages. CMS nie
zmienia kodu, stałych opisów stron, danych firmy z `VITE_*` ani katalogu zdjęć.
Takie zmiany wymagają zwykłego PR i deployu z `main`.

## Zdjęcia, fonty i podglądy udostępniania

Po zmianie oryginałów w `src/assets` uruchom:

```bash
bun run images:generate
bun run images:check
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
lokalną, nie osobnym krokiem CI.

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
