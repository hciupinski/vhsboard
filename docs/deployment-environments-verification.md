# Weryfikacja dwóch środowisk

Data: 2026-11-04. Produkcja i develop są wdrożone i sprawdzone na żywo.
Użytkownik scalił PR #63. Wdrożony commit obu środowisk:
`0fd842d47a3f628dc23ef9f191503a5171716972`.

## Wdrożenia i konfiguracja

| Środowisko  | Stały adres                        | Branch  | Supabase ref         | Wynik                                                                                                 |
| ----------- | ---------------------------------- | ------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| production  | https://vhsboard.pages.dev         | main    | jiqgcbqsbmzokcmtjtsw | [run 41813440072](https://github.com/hciupinski/vhsboard/actions/runs/41813440072) SUCCESS            |
| development | https://develop.vhsboard.pages.dev | develop | hrtxiivubihmxsjuxzer | [run 41813868394, attempt 4](https://github.com/hciupinski/vhsboard/actions/runs/41813868394) SUCCESS |

Oba pipeline potwierdziły konfigurację i head brancha, migracje przed frontendem,
Pages production_branch=main oraz branch/środowisko/SHA przez API Pages i marker
`/_deployment.json` pod konkretnym deploymentem i stałym aliasem. Develop utworzono
z aktualnego main, bez force push. Po testach CMS marker produkcji pozostał bez zmian.

GitHub Environments mają reguły main/develop bez tagów oraz po pięć nazw sekretów.
Wartości prywatnych sekretów nie odczytywano. Publiczne variables Supabase,
site URL, SEO i projekt Pages działają osobno w obu Environments. Oczekiwane refs
są różne. Użytkownik potwierdził konfigurację Auth dev i utworzenie osobnego admina.

Początkowe próby dev zatrzymały się przed migracjami: niepoprawny format PAT,
następnie brak konfiguracji poolera IPv4, później odrzucenie tokenu usuniętego
podczas wydłużania ważności. Po zapisaniu nowego PAT z czterema uprawnieniami
Read (Project Settings, API Keys, API Key Secrets, Connection Pooling) attempt 4
przeszedł bez zmiany workflow. Connection Pooling Read pozwala CLI pobrać pooler;
przy jego braku linkowanie może zignorować błąd pobrania i zgłosić później IPv6.

## Kontrole aplikacji na żywo

- Oba środowiska: strona główna na 1440×900 i 390×844, HTTP 200, brak błędów
  HTTP żądań strony głównej. Hosty Supabase zgodne z tabelą; żółta etykieta
  „WERSJA DEWELOPERSKA” tylko na develop, również na ekranie logowania CMS.
- Baseline i produkcja po wdrożeniu: zimowy motyw i opublikowany obóz
  /obozy/oboz-freestyle-2027 zachowane. Dev początkowo miał pustą bazę i motyw original.
- Na obu adresach przeszły: sześć stron marketingowych, /admin/login,
  /admin/reset-password, bezpośrednie wejście i refresh szczegółów/CMS oraz
  /trips/test-deployment-not-existing → HTTP 301 do /wyjazdy/….
- Istniejący obóz działa na produkcji, a jego brak na dev pokazuje 404 aplikacji.
  Brakujący wyjazd także pokazuje 404. Statyczny shell sam zwraca HTTP 200.
- Noindex w HTML obu środowisk i obu shellach; canonical/sitemap wskazują
  właściwy origin. Preview dodatkowo zwraca X-Robots-Tag: noindex.
  Produkcyjne noindex jest zamierzone przed osobnym przepięciem domeny.

## Testy zalogowanego CMS i izolacji

Użytkownik zalogował się samodzielnie w udostępnionej przeglądarce; hasła i sesji
nie kopiowano do skryptów ani raportu. Wszystkie zapisy poniżej wykonano wyłącznie
w projekcie dev, przez frontend i jego RLS.

1. Utworzono i zapisano szkic „TEST — weryfikacja środowiska develop”, slug
   `test-srodowiska-develop-20261104`. Anonimowy odczyt jego sluga oraz wszystkich
   draftów przez publiczny klucz dev zwrócił zero wierszy.
2. Przesłano istniejące zdjęcie z repozytorium, dodano opis alternatywny i ustawiono
   je jako obraz główny. Galeria i publiczny obraz korzystały z prywatnego Storage.
3. Opublikowano TEST; publiczny detal działał także po refresh. Identyczny adres
   na produkcji pokazał 404. Nie uruchamiano zewnętrznej rezerwacji TripAhead.
4. Cofnięto publikację; TEST pozostaje szkicem. Ponowny anonimowy odczyt zwrócił
   zero wierszy. Zdjęcie pozostaje przy szkicu, do dalszych prób użytkownika.
5. Przesłano poprawny, oznaczony PDF „TEST — plik środowiska develop”. Zapisany
   dokument pojawił się w CMS z linkiem do Storage dev. Testowy PDF pozostawiono
   na dev; nie jest rzeczywistym dokumentem dla klientów. Podpisanych URL nie
   umieszczono w dokumentacji.
6. Zapisano motyw winter przez CMS; publiczny portal dev zastosował go. Następnie
   przywrócono original i potwierdzono ten stan niezalogowanym odczytem API.

Do osobnej ręcznej próby pozostaje pełny reset hasła przez prywatną skrzynkę
użytkownika i ustawienie nowego hasła. Trasa formularza jest sprawdzona,
ale nie deklarujemy wykonania mailowego flow. Negatywne uprawnienia zwykłego
użytkownika sprawdzono lokalnym pgTAP; nie tworzono dodatkowego konta na hostowanym dev.

## Kontrole lokalne i zabezpieczenia pipeline

- 743 testy / 87 plików PASS, w tym 99 konfiguracji i 25 Pages. Typecheck PASS,
  lint 0 błędów / 7 istniejących ostrzeżeń; actionlint 1.7.12 PASS.
- build:ci, pełne buildy production/develop, SEO i images:check PASS.
  Lokalny build przyszłej domeny z indexing=true także przeszedł SEO.
  Buildy lokalne używały syntetycznej konfiguracji publicznej.
- Etykieta develop: RED → GREEN, 4 testy komponentu. Brak etykiety i odstępu
  potwierdzono w produkcyjnym HTML i shellach, obecność w dev. Lokalnie 9 przypadków
  przeglądarkowych PASS na 1440×900, 390×844 i 320×844; menu, sticky i anchor offsets.
  Niezależny przegląd zmiany bez istotnych uwag.
- Zachowano historyczną blokadę production-deploy dla main; develop ma osobną.
  Historycznych workflow sprzed bootstrapu nie ponawiano.
- [Dispatch spoza allowlisty 41814764928](https://github.com/hciupinski/vhsboard/actions/runs/41814764928):
  wszystkie cztery jobs SKIPPED, bez migracji i uploadu.
- Rzeczywisty skrypt kontroli head z workflow uruchomiono przeciw develop:
  stare SHA c8bf88d odrzucone (exit 1), aktualne 0fd842d przyjęte (exit 0),
  bez wykonywania migracji ani modyfikowania refs.
- Ochrona main/develop zapisana i odczytana z API: PR, strict checks
  build/lint/test/typecheck z GitHub Actions app 15368, także dla administratorów,
  zakaz force push/usuwania, wymagane rozwiązanie dyskusji. Brak wymogu drugiego
  recenzenta w jednoosobowym repozytorium.
- Po zielonych deploymentach usunięto pięć starych repository Variables:
  CLOUDFLARE_PAGES_PROJECT, VITE_SEO_INDEXING, VITE_SITE_URL,
  VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_URL. Pełny odczyt z per_page=100 potwierdził
  11 pozostałych nazw: dwa oczekiwane refs i dziewięć wspólnych danych firmy/kontaktu.
  Repository secrets: 0. Właściwe ustawienia pozostają w Environments.
- Verify po cleanup jest sprawdzany przez PR z tym raportem do obu baz;
  bieżący wynik należy odczytać z checks odpowiednich PR.

## Lokalny pgTAP

Zachowano istniejący lokalny stos użytkownika. Osobny projekt
vhsboard-deploy-qa-20261104 w /private/tmp, na portach 580xx, otrzymał kopię
migracji i testów wdrażanego kodu. Po dodaniu gateway wymaganego przez healthcheck
start/reset tej tymczasowej bazy zakończyły się poprawnie.

- db lint --local --fail-on error PASS; jedno wcześniejsze ostrzeżenie
  public.vhs_content_base: IMMUTABLE vs STABLE.
- pgTAP: 4 pliki, 56 testów PASS z bezwzględnej ścieżki do odizolowanej kopii.
- Tymczasowy stos zatrzymano. Istniejące kontenery użytkownika nadal działały.
  Nie resetowano żadnej hostowanej bazy ani istniejącego lokalnego projektu.

## Trwałe dowody

[Folder wdrożenia w projekcie Drive](https://drive.google.com/drive/folders/1f3WgM_bjpTa6zJb7I2DFkcriIiWHEYOV)
zawiera 11 screenshotów. Metadane plików odczytano po uploadzie.
Strona główna i ekran logowania: viewporty 1440×900 i 390×844; test zalogowany:
przeglądarka udostępniona obok czatu. Wersja aplikacji: 0fd842d, data powyżej.

- Produkcja: [desktop](https://drive.google.com/file/d/1s0F3Cb5adhtzPseTPMctGzOIcxP0uc-X/view),
  [telefon](https://drive.google.com/file/d/1Vn3guMIT4hBH5aDqww4dXjEN7BVTtbuX/view).
- Dev: [desktop](https://drive.google.com/file/d/1zz2LSWhhP_gAYzkpXfCxQMrY-l0mvMOg/view),
  [telefon](https://drive.google.com/file/d/1ZkmCR916kg1AsIW_TVu7N3LRVI6Cf4_r/view).
- CMS dev: [desktop](https://drive.google.com/file/d/1r6msP9Jv0m_pSYuvRZMlcJpbaTd98ys4/view),
  [telefon](https://drive.google.com/file/d/1XPkOkkrvHQS1smoYwKugsv9ZbURNZZ1t/view).
- [Publikacja TEST w CMS](https://drive.google.com/file/d/1i6CX8Q53NnFN3jdm5le_MYWB85Pr6f1D/view),
  [publiczny TEST na dev](https://drive.google.com/file/d/1RhDqmO4Pc2JJo1HLjNqqQAYIxVkyxDKS/view),
  [brak TEST na produkcji](https://drive.google.com/file/d/1KIx_s0HA_cnuad2SUbkQFywPb2NDBiEY/view).
- [Upload PDF](https://drive.google.com/file/d/1hLRLVBAAdvGcwnv8Y-zZtFgqc4vvflke/view),
  [zimowy motyw testowy dev](https://drive.google.com/file/d/1iXlfuU_QjoMRL7SdhpH6i_XolKsuBhRa/view).

[Wcześniejsze screenshoty lokalne etykiety](https://drive.google.com/drive/folders/1R0HJq9b3RyMQvWZd7b7KDYHmFJQTvQof)
są dowodem sprzed wdrożenia. Nie zastępują powyższych kontroli na żywo.
Nie zmieniano DNS ani domeny WordPress. VHS-051 i akceptacja klientki pozostają osobnym etapem.
