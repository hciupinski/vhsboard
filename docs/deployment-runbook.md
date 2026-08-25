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
   - `VITE_CONTACT_EMAIL`
   - `VITE_CONTACT_PHONE`
   - `VITE_BUSINESS_NAME`
   - `VITE_BUSINESS_STREET`
   - `VITE_BUSINESS_POSTAL_CODE`
   - `VITE_BUSINESS_CITY`
   - `VITE_BUSINESS_NIP`
   - `VITE_BUSINESS_REGON`
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
   `verify` (testy i lint), potem `deploy-supabase`, a na końcu
   `deploy-cloudflare` (pełny build, kontrola SEO i upload do Pages).
3. W podsumowaniu zadania wdrożenia otwórz adres Pages `*.pages.dev` zwrócony
   przez krok `pages_deploy`. Potwierdź, że korzysta z HTTPS, ładuje stronę
   główną oraz zawiera właśnie zmergowaną zmianę.
4. Osobno otwórz `https://vhsboard.pl` i potwierdź, że nadal obsługuje ją
   WordPress. Nie dodawaj tej domeny do projektu Pages i nie zmieniaj jej DNS.
5. Dopiero po pomyślnym pierwszym wdrożeniu ustaw dla gałęzi `main` jako
   wymagane kontrole ochrony gałęzi:

   - `verify / test`
   - `verify / lint`
   - `verify / build`

## Bezpieczna diagnostyka

- Jeśli `verify` nie przejdzie, popraw zmianę w pull requeście i poczekaj na
  trzy kontrole `verify`; nie omijaj ochrony gałęzi.
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
testy, lintowanie i kompilację aplikacji bez prerenderingu. Ten build celowo
nie odpyta produkcyjnego Supabase ani nie tworzy sitemapy. Merge do `main`
ponownie wykonuje testy i lintowanie, następnie wdraża migracje Supabase, a
dopiero potem wykonuje pełny prerender, kontrolę SEO i wdrożenie statycznego
frontendu do Pages. Ręczne
uruchomienie workflow z innej gałęzi nie wykonuje zadań produkcyjnych.
