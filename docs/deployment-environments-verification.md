# Weryfikacja przygotowania dwóch środowisk

Data: 2026-11-04. Status: przygotowanie repozytorium i kont; brak wdrożenia
nowego pipeline i brak potwierdzenia działania hostowanego dev.

## Ustawienia kont odczytane lub zapisane

- Istniejące GitHub Environment production: tylko branch main; nazwy pięciu
  deployment secrets obecne. Wartości sekretów nie były odczytywane.
- Utworzono Environment development: custom branch policy tylko develop,
  bez tagów. Odczyt API potwierdził regułę i cztery publiczne variables:
  projekt Pages vhsboard, URL Supabase hrtxiivubihmxsjuxzer, site URL aliasu
  develop oraz indexing=false.
- Repozytoryjne oczekiwane refs: production jiqgcbqsbmzokcmtjtsw,
  development hrtxiivubihmxsjuxzer; sprawdzone jako różne.
- Dodano SUPABASE_PROJECT_ID development ze znanego publicznego refa.
  Brakującą flagę VITE_SEO_INDEXING production uzupełniono jako false.
- Użytkownik potwierdził utworzenie Supabase dev i konfigurację jego Auth.
  Nie wykonano jeszcze testu działania tego Auth przez aplikację.
- Szeroki odczyt wartości produkcyjnych zmiennych odrzucił automatyczny przegląd.
  Bezpieczny odczyt nazw oraz konkretnego, publicznego VITE_SUPABASE_URL został
  dopuszczony; nie odczytywano klucza anon ani wartości prywatnych sekretów.

## Kontrole lokalne

- Bazowy main aa742ec: 615 testów PASS z syntetyczną konfiguracją publiczną.
- Nowe kontrole: 99 testów konfiguracji + 25 testów Pages; RED → GREEN.
- Pełen zestaw po synchronizacji main 8a3aa36: 739 testów / 86 plików PASS.
- Typecheck PASS, lint 0 błędów / 7 wcześniejszych ostrzeżeń.
- Actionlint v1.7.12: oba workflows PASS.
- build:ci PASS; pełny build dev (8 prerenderowanych celów) i check:seo PASS.
- images:check PASS. Lokalny build domeny produkcyjnej z indexing=true i SEO PASS;
  następnie odtworzono dev/noindex i sprawdzono znacznik wersji.
- Niezależny przegląd: poprawiono zgodność grupy concurrency main ze starym
  pipeline i opisano zakaz ponawiania starych runów.
- Buildy używały syntetycznego klucza i danych firmy, nie rzeczywistych kont
  Supabase. Wyniki potwierdzają build/SEO, nie połączenie hostowanego CMS.

## Pozostaje przed deklaracją wdrożenia

- Uzupełnienie nazw i wartości sekretów dev oraz publicznego anon key.
- Przegląd PR i uruchomienie bootstrapu main, potem develop.
- Live kontrola Pages production_branch=main i obu deploymentów przez pipeline.
- Migracje testowego Supabase oraz utworzenie administratora po migracjach.
- Testy przeglądarkowe publicznych tras, refresh, CMS, RLS, resetu hasła i izolacji.
- Rzeczywiste screenshoty 1440×900 i 390×844 w folderze Drive z URL/SHA/run ID.
- Kontrole lokalnego pgTAP/disposable DB, jeśli uruchomienie stosu jest dostępne.
- Ochrona branchy i usunięcie starych kopii konfiguracji dopiero po zielonym bootstrapie.

Nie zmieniono DNS, nie przypisano domeny i nie wykonano migracji hostowanej bazy.
VHS-051 oraz akceptacja klientki pozostają bez zmian.
