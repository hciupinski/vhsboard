# VHSBOARD: produkcja i środowisko testowe

Data: 2026-11-04. Status: implementacja pipeline przygotowana w branchu roboczym;
konfiguracja GitHub w toku. Nowy pipeline, hostowany dev i przepięcie domeny
nie zostały uruchomione.

## Cel i uzgodnienia

Jedno repozytorium i jeden projekt Cloudflare Pages `vhsboard` obsługują dwie
wersje aplikacji. `main` publikuje stabilną wersję na
`https://vhsboard.pages.dev`, docelowo na `https://vhsboard.pl`. `develop`
publikuje wersję testową na `https://develop.vhsboard.pages.dev`. Testowanie CMS
oraz migracji nie zmienia danych produkcyjnych.

Zachowujemy GitHub Actions i Pages Direct Upload, statyczny katalog
`.output/public` oraz istniejący frontend i CMS. Bez Workers i dodatkowego backendu.
Każda oferta nadal kieruje do zewnętrznego TripAhead. Testowanie nie obejmuje
wykonywania rezerwacji w zewnętrznym systemie.

## Obecny stan i granice rozpoznania

- `.github/workflows/deploy-pages.yml`: push `main` / ręczne uruchomienie,
  main-only guards, verify → migracje → pełny build i SEO → Direct Upload.
- `.github/workflows/verify.yml`: PR-y tylko do `main`; cztery jobs `test`,
  `lint`, `typecheck`, `build`. Testy częściowo czytają repozytoryjne `vars`.
- Supabase CLI `3.0.0`, migracje przez `db push --remote --dry-run` i
  `db push --remote --yes`. Migracje tworzą też prywatne buckety i RLS.
- `VITE_*` są wbudowane podczas kompilacji; ustawienia Cloudflare nie zmienią
  artefaktu zbudowanego przez GitHub Actions.
- `src/lib/auth/password-recovery.ts` przekazuje bieżący origin i
  `/admin/reset-password`. Hostowany Supabase wymaga własnej listy Redirect URLs.
- Odczyt konektora potwierdził publiczne repo `hciupinski/vhsboard` i uprawnienia
  admin podłączonego konta. Nie potwierdzono istniejących GitHub Environments,
  sekretów, reguł ochrony, ustawień Pages ani projektów Supabase. CLI GitHub
  nie połączyło się z API w obecnej piaskownicy; to nie dowód braku uprawnień.
- Tracker odczytano przez Google Sheets 2026-11-04. `VHS-051` dotyczy dostępów
  do hostingu WordPress i domeny; pozostaje oddzielnym warunkiem migracji domeny.
  Ten plan infrastruktury nie zamyka żadnego zgłoszenia klientki.

## Rozważone podejścia

1. Dwa projekty Pages: umożliwiają osobny główny adres `pages.dev` dla dev,
   ale nie są potrzebne po zaakceptowaniu adresu z prefiksem `develop`.
2. Jeden projekt Pages z produkcją `main` i preview `develop`: wybrany przez
   użytkownika. Zachowuje obecny hosting i pipeline oraz stały alias testowy.
3. Wspólny Supabase dla obu wersji: mniej konfiguracji, ale testowy CMS i
   migracje zmieniałyby produkcję. Nie spełnia celu bezpiecznych testów.

## Decyzje projektowe proponowane przez agenta

### Środowiska

| Pole                                   | production                          | development                          |
| -------------------------------------- | ----------------------------------- | ------------------------------------ |
| Ref Git                                | `refs/heads/main`                   | `refs/heads/develop`                 |
| Pages branch                           | `main`                              | `develop`                            |
| Pages production branch                | `main`                              | ten sam projekt, deployment preview  |
| Supabase                               | zachowujemy obecny projekt i treści | nowy projekt `vhsboard-dev`          |
| `VITE_SITE_URL` teraz                  | `https://vhsboard.pages.dev`        | `https://develop.vhsboard.pages.dev` |
| `VITE_SEO_INDEXING` teraz              | `false`                             | `false`                              |
| `VITE_SITE_URL` po migracji domeny     | `https://vhsboard.pl`               | bez zmiany                           |
| `VITE_SEO_INDEXING` po migracji domeny | `true`                              | `false`                              |

Nowy projekt dev zaczyna bez kopii ofert, kont i plików produkcyjnych. Migracje
odtwarzają schemat, buckety i polityki. Osobne konto administratora i jawnie
oznaczone dane testowe powstają dopiero po migracjach. Git nie synchronizuje
treści CMS ani Auth/Storage. Obecny Supabase pozostaje źródłem treści produkcji.

### Konfiguracja GitHub

Environment `production` dopuszcza wyłącznie branch `main`; `development`
wyłącznie branch `develop`, bez tagów. Każdy ma własne environment variables:

- `CLOUDFLARE_PAGES_PROJECT=vhsboard`;
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` właściwego projektu;
- `VITE_SITE_URL`, `VITE_SEO_INDEXING` według tabeli;
- wszystkie istniejące `VITE_CONTACT_*` i `VITE_BUSINESS_*` z `.env.example`.

Każdy ma environment secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`,
`SUPABASE_PROJECT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
Sekrety pozostają poza repozytorium i rozmową. Nie dodajemy `service_role`.
Cloudflare Account ID i project ref nie są kluczami uprzywilejowanymi; zachowujemy
dotychczasową konwencję ich przechowywania w secrets.

Repozytoryjne publiczne variables `SUPABASE_PRODUCTION_PROJECT_REF` i
`SUPABASE_DEVELOPMENT_PROJECT_REF` zapisują dwa różne, zweryfikowane project refs
jako oczekiwane cele kontroli przed migracją. Pozostałe współdzielone kopie
zmiennych zależnych od środowiska usuwa się dopiero po skutecznym przejściu.

Oddzielne nazwy tokenów nie dowodzą izolacji uprawnień. Token Pages może mieć
uprawnienia do całego konta, a oba deploymenty są w jednym projekcie. Token
Supabase konta mającego dostęp do obu projektów może pozwalać na oba.
W tym zakresie oddzielamy dane i rutynowe wdrożenia; nie deklarujemy odporności
produkcji na złośliwy workflow z dostępem do takiego tokenu. Używamy najwęższych
dostępnych uprawnień i chronimy oba branche. Silniejsza izolacja kont/projektów
hostingu byłaby osobnym zakresem.

### Pipeline

Rozszerzamy istniejący plik deployu bez powielania całego workflow:

1. `resolve-target`: bez sekretów, dopuszcza tylko pełne refy `main` i
   `develop`, wystawia stałe outputs `environment` i `branch`.
2. `verify`: typecheck, test, lint i build:ci; wyłącznie syntetyczne publiczne
   dane testowe, bez GitHub Environment i sekretów.
3. `deploy-supabase`: Environment z allowlisty, walidacja konfiguracji i
   aktualności commita, jawne połączenie z właściwym Supabase, dry-run i migracje.
4. `deploy-cloudflare`: ten sam Environment i commit, ponowna walidacja,
   pełny `bun run build`, `bun run check:seo`, upload `.output/public`
   z jawnym `--branch=main` albo `--branch=develop`. Przed każdym uploadem
   odczyt API Pages musi potwierdzić `production_branch = main` i projekt
   `vhsboard` z subdomeną `vhsboard.pages.dev`; niezgodność zatrzymuje upload.
   Sam parametr `--branch=develop` nie gwarantuje wdrożenia preview przy
   błędnej konfiguracji projektu na koncie.
5. Weryfikacja konkretnego deployment URL oraz stabilnego aliasu; podsumowanie
   z SHA, środowiskiem, URL i wynikiem. Nie utożsamiamy merge z wdrożeniem.

Ręczny dispatch nie otrzymuje parametru wyboru środowiska: określa je ref.
Nieobsługiwany ref nie uruchamia jobs z Environment ani migracji/uploadu.
Nie używamy `pull_request_target` do wykonywania kodu PR z sekretami.
Concurrency osobne dla brancha: zachowujemy `production-deploy` dla main jako
zgodność z istniejącymi runami; develop używa `pages-deploy-refs/heads/develop`. `cancel-in-progress: false`, aby nie przerywać
migracji. Przed migracją i przed uploadem weryfikujemy, że commit jest nadal
aktualnym headem odpowiedniego brancha; ponowienie nieaktualnego commita w nowym workflow nie cofa serwisu.
Przed bootstrapem trzeba zakończyć trwające runy produkcji; runów starego workflow
nie ponawiamy, ponieważ nie otrzymują nowych zabezpieczeń wstecz.
GitHub może zastąpić oczekujące uruchomienie nowszym; nie obiecujemy deployu każdego commita.

Kontrola konfiguracji odrzuca pustą wartość, niezgodność ref/Environment,
niezgodność URL Supabase i `SUPABASE_PROJECT_ID` z oczekiwanym project ref,
równe project refs dla obu środowisk i dev z indeksowaniem lub złym originem.
Produkcja dopuszcza tylko origin Pages z `false` albo `vhsboard.pl` z `false/true`;
zmiana domeny pozostaje oddzielną operacją. Kontrola nie wypisuje wartości
kluczy, haseł ani tokenów, również w komunikatach błędów.

Workflow Verify obejmuje PR-y do obu branchy i zachowuje istniejące nazwy jobs.
Ochrona obu branchy wymaga tych czterech kontroli. Po awaryjnym hotfixie w
`main` agent synchronizuje zmianę do `develop` przez PR.

### Auth, SEO i domena

Dev Auth Site URL: `https://develop.vhsboard.pages.dev`. Redirect URL:
`https://develop.vhsboard.pages.dev/admin/reset-password`. Rejestracja publiczna
wyłączona; konto testowe otrzymuje `profiles.role = 'admin'` po migracjach.
Localhost kierujemy do dev; nie kopiujemy wildcardów preview do produkcyjnego Auth.
Produkcja zachowuje obecne ustawienia do migracji domeny. Hostowanego Auth nie
konfigurujemy przez bezrefleksyjne wysłanie lokalnego `supabase/config.toml`.

Dev zawsze ma meta noindex; sprawdzamy też rzeczywisty nagłówek preview
`X-Robots-Tag`. Admin zawsze ma noindex. Preview jest domyślnie publiczne;
Cloudflare Access jest opcjonalnym osobnym ustawieniem, nie warunkiem tej pracy.

Przepięcie domeny nie jest częścią uruchomienia dev. Osobny etap wymaga dostępów
z VHS-051, audytu dotychczasowych URL WordPress i przekierowań, zachowania DNS
poczty, dodania Custom domain w Pages i kontroli TLS. Następnie aktualizujemy
Auth produkcji i zmienne buildu, sprawdzamy canonicale/sitemapę/robots oraz
przekierowanie dokładnie `vhsboard.pages.dev` do domeny, bez wildcarda obejmującego
`develop.vhsboard.pages.dev`.

## Podział odpowiedzialności i kolejność

1. Agent: przygotowuje kod pipeline, testy, dokumentację i PR; może rozpocząć
   pracę bez sekretów dev. W tej sesji powstają tylko spec i plan.
2. Użytkownik: tworzy projekt Supabase dev, zachowuje hasło bazy i generuje
   wymagane tokeny. Agent może skonfigurować GitHub Environments, reguły i publiczne
   variables przez API po potwierdzeniu dostępu; brak dostępu skutkuje instrukcją
   wykonania tych konkretnych ustawień, bez ujawniania sekretów.
3. Użytkownik: wpisuje environment secrets i publiczny klucz anon w odpowiednich
   ustawieniach GitHub; przekazuje agentowi jedynie potwierdzenie i publiczny
   dev project ref. Obecnych sekretów production nie trzeba odczytywać ani zmieniać.
4. Agent: weryfikuje przygotowanie, konfiguruje obsługiwane ustawienia GitHub,
   przygotowuje branch `develop` od świeżego `main` i przeglądalne PR-y.
   Pierwszy merge nowego pipeline do `main` wdraża tylko dotychczasową produkcję
   z niezmienionym originem i Supabase; wszystkie warunki muszą być gotowe wcześniej.
5. Agent: po zielonym deployu production przenosi pipeline na `develop` bez
   przepisywania historii i wdraża dev (na pierwszym uruchomieniu migracje tworzą
   schemat). To bootstrap; późniejsze zmiany przechodzą najpierw przez develop.
6. Użytkownik: po migracjach tworzy konto Auth dev i nadaje rolę admin w SQL
   Editor. Agent dostarcza dokładny SQL; użytkownik nie udostępnia hasła w czacie.
7. Agent: weryfikuje działanie i izolację; operacje wymagające zalogowanej sesji
   wykonuje w udostępnionej sesji przeglądarki po ręcznym zalogowaniu użytkownika.
   Jeżeli takiej sesji brak, testy Auth pozostają jawnie niewykonane, zamiast
   deklaracji ukończenia.

## Akceptacja i dowody

- PR do main i do develop przechodzi Verify bez sekretów i dostępu do danych.
- Wdrożenie develop aktualizuje wyłącznie preview i testowy Supabase; URL
  `vhsboard.pages.dev` i produkcyjne dane pozostają sprawdzone odczytem.
- Nowa oferta TEST i testowe zdjęcie/PDF istnieją tylko w dev; publiczny dev
  nie pokazuje draftu, zwykłe konto nie może wykonywać operacji admina.
- Bezpośrednie wejście i refresh szczegółu oferty oraz `/admin` działają;
  odzyskiwanie hasła wraca do właściwego środowiska.
- Screenshoty prawdziwych stron na 1440×900 i 390×844, adres, commit, run CI i
  porównanie sieciowych hostów Supabase trafiają do raportu i folderu projektu
  Drive. Bez tokenów, fragmentów recovery i podpisanych URL w dowodach tekstowych.
- Błąd migracji zatrzymuje deploy frontendu. Rollback frontendu nie cofa bazy;
  zachowujemy migracje kompatybilne wstecz i naprawiamy bazę migracją do przodu.
- Nie zmieniamy statusu VHS-051 ani Akceptacji klientki po samym uruchomieniu dev.

## Źródła

- [Pages Direct Upload: branch i alias](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Pages preview: alias i noindex](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [GitHub Environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [Supabase: środowiska i migracje](https://supabase.com/docs/guides/deployment/managing-environments)
- [Supabase Auth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Pages Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Tracker: dostęp hosting/domena VHS-051](https://docs.google.com/spreadsheets/d/1MLn5I9EcpKrJRD6PP8rUxh8OoaHaeqMyHkwvmYN6sQQ/edit)
