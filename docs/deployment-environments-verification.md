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

- Nazwy pięciu sekretów dev oraz publicznego anon key w Variables zostały
  potwierdzone po konfiguracji użytkownika; poprawność wartości zweryfikuje pipeline.
- Przegląd PR i uruchomienie bootstrapu main, potem develop.
- Live kontrola Pages production_branch=main i obu deploymentów przez pipeline.
- Migracje testowego Supabase oraz utworzenie administratora po migracjach.
- Testy przeglądarkowe publicznych tras, refresh, CMS, RLS, resetu hasła i izolacji.
- Rzeczywiste screenshoty 1440×900 i 390×844 w folderze Drive z URL/SHA/run ID.
- Kontrole lokalnego pgTAP/disposable DB, jeśli uruchomienie stosu jest dostępne.
- Ochrona branchy i usunięcie starych kopii konfiguracji dopiero po zielonym bootstrapie.

Nie zmieniono DNS, nie przypisano domeny i nie wykonano migracji hostowanej bazy.
VHS-051 oraz akceptacja klientki pozostają bez zmian.

## Znacznik środowiska develop

Dodano stałą etykietę „WERSJA DEWELOPERSKA” w lewym górnym rogu strony publicznej
oraz CMS. Warunek korzysta z VITE_SITE_URL równego dokładnie
https://develop.vhsboard.pages.dev, także w produkcyjnym trybie buildu Vite.
Nie wymaga kolejnej zmiennej w GitHub. Zarezerwowane 24 px uwzględniają nagłówki,
nawigacja sekcji oferty i przesunięcie kotwic. Etykieta nie przechwytuje kliknięć.

- Test komponentu: RED → GREEN, 4 przypadki (develop, root Pages, domena, localhost).
- Końcowy zestaw: 743 testy / 87 plików PASS; typecheck PASS; lint 0 błędów
  i 7 wcześniejszych ostrzeżeń.
- Pełny build i check:seo PASS osobno dla root Pages oraz develop.
  Sprawdzono obecność etykiety i atrybutu body w trzech wygenerowanych plikach
  dev (index oraz publiczny i administracyjny shell), a ich brak w produkcji.
- Lokalny test przeglądarkowy: http://127.0.0.1:4188, statyczny build develop,
  trasy /, /admin/login i /wyjazdy/qa-development-label. API Supabase zastąpione
  lokalnymi fiksturami; bez operacji na hostowanej bazie.
- Viewporty 1440×900, 390×844 i 320×844: 9 przypadków PASS. Sprawdzono pozycję
  etykiety, brak poziomego overflow, nagłówek po przewinięciu, nawigację oferty
  i otwieranie/zamykanie menu mobilnego. Siedem screenshotów wykonano dla
  szerokości 1440 i 390 px; screenshot menu po zakończeniu animacji.
- Niezależny przegląd zmiany: bez istotnych uwag.
- [Trwałe screenshoty lokalnej weryfikacji w folderze projektu Drive](https://drive.google.com/drive/folders/1R0HJq9b3RyMQvWZd7b7KDYHmFJQTvQof).
  Metadane folderu i wszystkich siedmiu plików odczytano po zapisie.

Ta weryfikacja dotyczy zmiany znacznika w PR #63, przed wdrożeniem. Testowanie
hostowanego develop oraz obu baz pozostaje do wykonania po aktywacji pipeline.
