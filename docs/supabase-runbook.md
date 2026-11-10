# Runbook Supabase

## Wymagania lokalne

Do pracy z lokalną bazą potrzebne są Docker Desktop oraz Supabase CLI. Projekt
nie wymaga żadnego klucza uprzywilejowanego w aplikacji frontendowej; lokalne
klucze wypisywane przez CLI służą wyłącznie do pracy na własnym komputerze i nie
mogą trafić do repozytorium ani plików `VITE_*` poza publicznym anon key.

Uruchomienie lokalnego stosu:

```bash
supabase start
```

Migracje, linter i test bezpieczeństwa uruchamiaj z katalogu głównego projektu:

```bash
supabase db reset
supabase db lint --fail-on error
supabase test db supabase/tests
```

`db reset` usuwa wyłącznie dane z lokalnej bazy Docker i odtwarza ją z migracji.
Nie uruchamiaj go przeciwko połączonemu środowisku z danymi. Po pracy zatrzymaj
lokalne kontenery:

```bash
supabase stop
```

## Ręczne nadanie roli administratora

W aplikacji nie ma publicznej rejestracji ani panelu zarządzania rolami. Dodaj
konto administratora ręcznie w Supabase Auth (w Dashboardzie projektu lub przez
zaufaną procedurę administracyjną), a następnie pobierz jego UUID. W SQL Editor
uruchomionym jako właściciel bazy wykonaj:

```sql
insert into public.profiles (id, role)
values ('UUID-UZYTKOWNIKA-AUTH', 'admin')
on conflict (id) do update
set role = excluded.role;
```

Nie wykonuj tego zapytania z przeglądarki. RLS celowo nie pozwala klientowi
utworzyć ani zmienić rekordu `profiles`; zalogowany użytkownik może odczytać
wyłącznie własny rekord. Tylko `role = 'admin'` w tym rekordzie daje dostęp do
zapisu ofert, metadanych obrazów i obiektów Storage.

## Obrazy ofert

Bucket `offer-images` jest prywatny. Aplikacja pobiera obraz przez podpisany URL
po autoryzowanym `SELECT`; nie używa `getPublicUrl`. Każdy obiekt musi mieć
ścieżkę dokładnie w formacie:

```text
offers/<offer-id>/<uuid>.<ext>
```

Bucket odrzuca pliki większe niż 8 MiB oraz MIME inne niż `image/jpeg`,
`image/png` i `image/webp`. Dozwolone rozszerzenia ścieżki to dokładnie
`.jpeg`, `.png` i `.webp`. Walidacja w przeglądarce przekazuje
administratorowi zrozumiały błąd przed uploadem, ale granica bezpieczeństwa
jest egzekwowana również przez Storage.

Drugi segment musi odpowiadać istniejącemu `public.offers.id`. Obiekt staje się
czytelny publicznie dopiero wtedy, gdy jego pełna ścieżka znajduje się w
`public.offer_images.storage_path`, a powiązana oferta ma status `published`.
Szkice i archiwum nie mogą otrzymać publicznego URL-a.

PostgreSQL odrzuca zmianę statusu na `published`, jeżeli `hero_image` nie
wskazuje rekordu `offer_images` tej samej oferty z opisem alternatywnym mającym
po `trim()` od 5 do 180 znaków. To zabezpieczenie działa również dla
bezpośrednich zapytań administratora, niezależnie od formularza. Kolejność
galerii zmieniaj wyłącznie przez RPC `reorder_offer_images`; funkcja sprawdza
pełną permutację i zapisuje wszystkie pozycje w jednej transakcji.

Przed skasowaniem przestarzałego obiektu sprawdź, czy nie wskazuje go ani hero,
ani żaden zachowany rekord metadanych:

```sql
select not exists (
  select hero_image as storage_path
  from public.offers
  where hero_image = 'offers/<offer-id>/<uuid>.<ext>'
  union all
  select storage_path
  from public.offer_images
  where storage_path = 'offers/<offer-id>/<uuid>.<ext>'
) as safe_to_delete;
```

Usuwaj obiekt dopiero, gdy wynik to `true`. Zawartość `description` pozostaje w
jednym polu JSONB i jest walidowana w kliencie jako obiekt z tablicami
`paragraphs`, `highlights`, `included`, `excluded` oraz `schedule` (`day`,
`text`).

## Dalsze migracje i wdrożenia

Każda migracja jest tylko do przodu. Usunięcie kolumny, zmiana jej typu albo
zaostrzenie constraintu wymaga sekwencji expand → migrate data → switch code →
contract w co najmniej dwóch merge’ach. Najpierw wdrażaj bazę, potem frontend;
w trakcie przejścia publiczna aplikacja musi nadal mieć działający kontrakt i
zwracać wyłącznie opublikowane oferty.

## Dokumenty kontaktowe

Bucket `contact-documents` jest prywatny i służy wyłącznie dokumentom z sekcji
„Do pobrania” na stronie kontaktowej. Akceptuje tylko pliki PDF (`application/pdf`)
o maksymalnym rozmiarze 10 MiB. Każdy obiekt musi otrzymać losową ścieżkę:

```text
documents/<uuid>.pdf
```

Publiczny odczyt obiektu jest możliwy wyłącznie wtedy, gdy dokładna ścieżka jest
zapisana w `public.contact_documents`. Administrator może tworzyć, zmieniać i
usuwać zarówno metadane, jak i obiekty; polityki RLS nie dają tych uprawnień
zwykłemu zalogowanemu użytkownikowi. Aplikacja generuje podpisane adresy URL do
wyświetlenia PDF w nowej karcie — nie używa `getPublicUrl`.

## Przygotowanie nowych zdjęć i diagnostyka CMS

Przeglądarka waliduje plik wejściowy (JPEG z `.jpg` lub `.jpeg`, PNG/WebP,
do 8 MiB), a następnie
przed uploadem poprawnie orientuje obraz, zmniejsza najdłuższą krawędź do
1920 px i zapisuje WebP do 2 MiB. Nie powiększa małych zdjęć. Brak dekodera,
kodera WebP lub zbyt duży wynik kończy operację czytelnym błędem przed zapisem
Storage. Nowe obiekty otrzymują unikalną ścieżkę `.webp`; granica bucketu
8 MiB i istniejące obiekty pozostają bez zmian. Opis alternatywny ma 5–180
znaków. Gdy zapis metadanych po uploadzie zawiedzie, aplikacja próbuje usunąć
osierocony obiekt i zgłasza nieudane sprzątanie.

Podpisane adresy zdjęć i PDF są ważne przez 3600 sekund. Ponowne pobranie
zwraca nowy URL po kontroli RLS. Już wydany link może działać do wygaśnięcia
nawet po wycofaniu oferty; nie przekazuj go jako stałego adresu zasobu.
Publikacja i edycja treści nie wywołują deployu. Po zmianie sprawdź nowo otwartą
stronę publiczną; podgląd administratora ma oddzielny cache i noindex.

Przy błędzie uploadu sprawdź komunikat formularza, MIME/rozmiar pliku, rolę
administratora oraz logi i polityki Storage. Przy błędzie publikacji sprawdź
hero, alt, wymagane dane i zewnętrzny link zapisów. Nie rozwiązuj błędu przez
upublicznienie bucketu lub użycie service-role key w przeglądarce.

## Zdjęcia przy opisie i galeria resortu

Migracja `20261103120000_add_offer_story_images.sql` dodaje
`offer_images.show_in_story`. Wybierz w głównej galerii maksymalnie trzy
zdjęcia do pokazania przy opisie; nie wysyłaj ich ponownie. Flaga jest dozwolona
tylko dla kategorii `gallery`, a trigger pod blokadą oferty pilnuje limitu.
Kolejność wynika z kolejności galerii. Starsza baza bez tej kolumny nadal pozwala
odczytać zdjęcia, lecz zmiana wyboru wymaga migracji. Uruchom
`supabase/tests/offer_story_images.sql` tylko na lokalnej lub jednorazowej bazie.

Migracja `20261104170000_add_resort_gallery_and_rental_pdf.sql` dodaje kategorię
`resort_gallery` i rozszerza RPC kolejności obrazów. Zdjęcia resortu mają własną
kolejność i nie zastępują `resort_map`, hero ani galerii zakwaterowania.
Po zmianach sprawdź osobno te galerie i mapę, także w ofercie z wyłączoną sekcją.

## PDF wypożyczalni

Ta sama migracja tworzy singleton `portal_rental_document` (`id = 1`), osobny
od listy dokumentów kontaktowych. CMS → Portal pozwala przesłać, zastąpić lub
usunąć aktualny PDF wypożyczalni. Plik korzysta z prywatnego bucketu
`contact-documents`, limitu 10 MiB, walidacji PDF i unikalnej ścieżki
`documents/<uuid>.pdf`. Publiczny odczyt Storage dopuszcza aktualnie wskazany
plik; zmiana wskaźnika wymaga administratora.

Przy zastępowaniu frontend najpierw wysyła nowy plik, potem RPC
`replace_portal_rental_document` pod blokadą wiersza zamienia ścieżkę i zwraca
poprzednią do sprzątania. Usunięcie ustawia ścieżkę na `null`. Brak dokumentu
lub błąd pierwszego odczytu pozostawia sekcję wypożyczalni bez publicznego CTA.
Błąd odświeżenia nie usuwa dokumentu już dostępnego w cache. Podpisany URL jest
ważny godzinę. Otwarta strona odpytuje co 30 minut, a powrót do karty odświeża
dane, gdy Query uznaje je za nieświeże. Błędy sprzątania są logowane jako
`rental_document_cleanup_failed`; przed ręcznym usunięciem pliku sprawdź
odwołania zarówno w singletonie, jak i w `contact_documents`. Nie usuwaj
aktywnego dokumentu w celu ponowienia uploadu.

## Karuzela strony głównej

`public.portal_carousel_images` przechowuje wybór i kolejność zdjęć z katalogu
repozytorium. Administrator zapisuje pełną listę przez
`set_portal_carousel_images`; publiczny użytkownik może ją odczytać, ale nie
zmienić. CMS wybiera istniejące ścieżki — nie wysyła nowych plików karuzeli.
Dodanie nowego zdjęcia do katalogu wymaga wygenerowania wariantów i deployu;
zmiana wyboru istniejących zdjęć wymaga tylko zapisu w CMS.

Ścieżki karuzeli są identyfikatorami zapisanymi w bazie. Po zmianie nazw zdjęć
sprawdź `src/lib/portal-carousel/catalogue.ts` i wszystkie odwołania aplikacji
oraz generatora OG. Odczyt mapuje znane stare ścieżki na aktualne, pomija
nieznane wpisy i usuwa powtórzenia z zachowaniem pierwszego wystąpienia.
Pusty wybór publiczny korzysta z zestawu domyślnego. Zapis dopuszcza wyłącznie
unikalne ścieżki z bieżącego katalogu; aliasy służą zgodności odczytu, nie nowym
zapisom. Po wymianie fotografii wykonaj regenerację i kontrole obrazów opisane
w [runbooku wdrożenia](deployment-runbook.md#zdjęcia-fonty-i-podglądy-udostępniania).

## Globalny motyw portalu

`public.portal_settings` przechowuje jeden rekord (`id = 1`) z motywem
`original` albo `winter`. Migracja tworzy ustawienie `original`; wdrożenie
nie przełącza samoczynnie wyglądu produkcji. Następnie administrator wybiera
motyw w CMS → Portal → „Wygląd strony” i naciska „Zapisz i zastosuj globalnie”.
Powrót do „Obecny” przywraca ciepłą paletę.

Odczyt jest publiczny. UPDATE kolumny `theme` wymaga roli `admin`, sprawdzanej
przez RLS; klient nie ma INSERT, DELETE ani prawa zmiany `id` czy `updated_at`.
Trigger bazy aktualizuje czas zapisu. Formularz uznaje sukces dopiero po
otrzymaniu zmienionego rekordu; brak wiersza w odpowiedzi nie oznacza sukcesu.

Otwarte, widoczne strony pobierają zmianę w ciągu 30 sekund lub po powrocie
do karty. Pierwszy odczyt i awaria sieci mają bezpieczny fallback opisany w
[architekturze](architecture.md#global-appearance). Wdrożenie migracji i kodu
wykonuje istniejący pipeline, w kolejności baza → frontend.

Testy `supabase/tests/portal_settings_security.sql` sprawdzają anonimowy
odczyt, brak zapisu dla anon i zwykłego konta, admin-only UPDATE, ograniczenie
wartości oraz ochronę singletona. Test kończy się ROLLBACK i nie zapisuje
trwale wybranego motywu.

## Hosted CLI targets

The deployment workflow pins Supabase CLI to `3.0.0` and logs its version.
CLI v3 defaults database commands to the local stack even after `supabase link`.
Both migration steps explicitly select the linked production project:
`supabase db push --remote --dry-run`, then `supabase db push --remote --yes`.
The second command supplies the hosted-change confirmation required in CI.
The allowlisted branch-to-Environment mapping, expected project ref checks and
database-before-frontend job dependency protect both environments. Review CLI release notes before changing the pin.
After merging a workflow fix, use the deployment run for the new main commit;
rerunning an older failed run still uses that commit's older workflow.

Reference: [Supabase CLI v3 release notes](https://github.com/supabase/cli/releases/tag/v3.0.0).

## Offer sections v2 rollout (VHS-020 / VHS-020a)

Apply `supabase/migrations/20261102120000_add_offer_content_sections.sql` after all
previous migrations, before deploying the matching frontend. It adds v2 validators,
protects against legacy CMS overwrites and creates the resort-map category, unique
index and replacement RPC. It does not enable optional sections or add commercial
insurance/transport content to existing offers.

Old offers are not bulk rewritten. Opening and saving in the new CMS writes v2;
camp term UUIDs are generated once and preserved. Older tabs attempting to save a
v2 offer receive “Odśwież CMS przed zapisaniem oferty.” Refresh before editing again.
To hide an optional section, disable its switch; do not delete its content or images.
An incomplete enabled section can be saved in a draft but cannot be published.

The map RPC requires an existing object in the same offer folder and valid alt text.
It serializes replacements with a row lock. Cleanup failure is recoverable through
the existing CMS retry action, which checks references again before deleting. A
network failure during replacement requires refetching metadata before retrying;
never manually remove a currently referenced object. Maps cannot be hero images.

Run the existing `supabase/tests/cms_security.sql` and the new
`supabase/tests/offer_content_sections.sql` against a local/disposable database with
all migrations applied and pgTAP available. Both files use transactions and roll back
their fixtures. The new suite verifies optional Transport, disabled accommodation,
direct-API publication validation, version protection and map permissions. Never run
QA fixture publication against production. Roll back a deployment by retaining the
forward database migration; do not drop v2 JSON data to make an old CMS writable.

### Zgodność rozszerzonego edytora ofert

Migracja `20261109153000_offer_editor_feedback.sql` rozszerza walidację bez
przepisywania ofert. Zastosuj ją przed wdrożeniem odpowiadającego frontendu.
Dojazd zapisany jako pojedyncze `transport.type` pozostaje obsługiwany.
Zmiana wyboru w nowym CMS zapisuje tablicę `transport.types`. Pole `priceNote`
można wyczyścić w panelu. Zapis, który usuwa klucz `priceNote` albo zastępuje
zapisaną tablicę opcji starszym formatem, otrzyma komunikat o odświeżeniu CMS.
Karty szkolenia są opcjonalne. Usuń rozpoczętą, pustą kartę i zapisz szkic,
jeśli chcesz opublikować tylko wstęp.

Po zapisaniu nowych opcji transportu, zdjęć szkoleniowych lub publikacji
szkoleń bez kart starszy frontend może odrzucić publiczny odczyt tych ofert.
Do cofnięcia wdrożenia użyj buildu z obsługą nowych danych. Zostaw migrację w bazie.

## Odzyskiwanie hasła administratora

Ekran `/admin/login` zawiera link „Nie pamiętasz hasła?”. Trasa
`/admin/reset-password` wysyła natywny mail Supabase i po otwarciu ważnego linku
pozwala ustawić nowe hasło. Wszystkie trasy pozostają `noindex, nofollow`.
Frontend używa wyłącznie publicznego klucza; Supabase Auth autoryzuje zmianę
własnego hasła. Reset nie tworzy kont ani nie nadaje roli administratora.

### Konfiguracja hostowanego projektu Supabase

W **Authentication → URL Configuration → Redirect URLs** dodaj dokładne adresy,
zachowując dotychczasowe wpisy:

```text
https://vhsboard.pages.dev/admin/reset-password
http://localhost:3000/admin/reset-password
http://127.0.0.1:3000/admin/reset-password
```

Pozostaw produkcyjny **Site URL** `https://vhsboard.pages.dev` jako domyślny.
Nie przełączaj globalnego Site URL na localhost. Po zmianie domeny produkcyjnej
zaktualizuj również jej dokładny adres odzyskiwania. Wysyłka z aplikacji podaje
bieżący origin w `redirectTo`; Supabase dopuszcza tylko adresy ze swojej listy.
Lokalny `supabase/config.toml` zawiera analogiczne adresy lokalne i wymaga restartu
lokalnego Auth, by nowe wpisy zaczęły obowiązywać. Ten plik nie aktualizuje
automatycznie konfiguracji hostowanego projektu; nie używaj całego lokalnego pliku
jako konfiguracji produkcyjnej.

Link z Dashboardu może wracać na domyślną stronę główną. Wczesny listener klienta
wychwytuje `PASSWORD_RECOVERY` i kieruje użytkownika do ekranu nowego hasła.
Tak samo obsługiwany jest błąd `otp_expired` z fragmentu adresu: użytkownik widzi
wyjaśnienie i formularz wysłania nowego linku, bez ujawniania surowego opisu błędu.
Nie można odzyskać ważności zużytego tokenu. Używaj najnowszej wiadomości; jeżeli
linki wygasają przed pierwszym kliknięciem, sprawdź logi Auth i skanowanie linków
przez pocztę. Implementacja nie zmienia szablonów maili ani reguł antyspamowych.

### Zachowanie aplikacji

- Kontekst odzyskiwania zapisuje tylko UUID użytkownika i termin ważności w
  `sessionStorage` (do 30 minut i nie dłużej niż sesja). To stan interfejsu,
  nie dodatkowe uprawnienie; `getUser` weryfikuje tożsamość po stronie Auth.
- Zwykła zalogowana sesja bez kontekstu odzyskiwania pokazuje formularz wysyłki.
  Nowy formularz wymaga zgodnych haseł długości co najmniej 8 znaków, nie przycina
  spacji i respektuje dodatkowe wymagania serwera.
- Błędy sieci pozwalają ponowić sprawdzenie lub zapis. Po sukcesie zmiany aplikacja
  usuwa kontekst i wywołuje `signOut({ scope: "global" })`, odwołując sesje Auth,
  a następnie prowadzi do zwykłego logowania z kontrolą `profiles.role` i RLS.
- Jeżeli pierwsza weryfikacja callbacku nie powiedzie się z powodu chwilowej
  awarii Auth lub sieci, zachowujemy oryginalny fragment adresu do ponowienia
  przez przycisk „Odśwież i ponów”. Nie kopiujemy tokenów do własnego magazynu
  ani parametrów query. Po poprawnej inicjalizacji fragment usuwa SDK.
- Błąd wylogowania po skutecznej zmianie hasła jest osobnym ostrzeżeniem. Nie
  sugerujemy wtedy, że hasło nie zostało zapisane.
- Tokeny nie trafiają do własnych logów ani query parametrów. SDK przechowuje
  sesję swoim standardowym mechanizmem; aplikacja nie kopiuje jej tokenów.

Opis API: [resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail),
[updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser),
[Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Oddzielne środowisko development

Produkcja zachowuje projekt `jiqgcbqsbmzokcmtjtsw`. Testowy projekt
`hrtxiivubihmxsjuxzer` ma własne Auth, dane, prywatne buckety i polityki.
GitHub Environment `development` otrzymuje tylko właściwe dla niego URL,
publiczny anon key oraz deployment secrets. Oczekiwane refs obu projektów
są osobnymi repository variables; pipeline porównuje z nimi URL i project ID
przed migracją. Nie kopiujemy automatycznie treści produkcji.

Sama konfiguracja projektu i Auth nie zastępuje testu logowania oraz resetu
na rzeczywiście wdrożonym aliasie.
Dev Site URL: `https://develop.vhsboard.pages.dev`, Redirect URL:
`https://develop.vhsboard.pages.dev/admin/reset-password`. Lokalne callbacki
localhost/127.0.0.1:3000 można dodać do dev. Publiczna rejestracja wyłączona.
Nie wysyłaj całego lokalnego `config.toml` do hostowanego projektu.

Pierwszy deploy develop stosuje wszystkie istniejące migracje. Dopiero po nim
utwórz użytkownika Auth w projekcie dev i nadaj mu rolę admin SQL-em z początku
tego runbooka. Hasło użytkownik wpisuje w zalogowanej przeglądarce; nie w czacie.
Oferty TEST, zdjęcia i PDF-y twórz tylko w dev. Zmiana motywu dev nie powinna
zmienić produkcji. Powtórz testy RLS lokalnie/disposable; nigdy nie wykonuj
`db reset` lub fixture tests przeciw produkcji.
