# Dokumenty do pobrania — projekt

## Cel

Administrator VHSBOARD może dodawać regulaminy i materiały informacyjne jako
pliki PDF. Opublikowana lista dokumentów pojawia się w sekcji **Do pobrania**
na stronie `/kontakt`; każdy odnośnik otwiera dokument w nowej karcie
przeglądarki.

## Zakres

- Obsługiwany jest wyłącznie format PDF (`application/pdf`) o rozmiarze do
  10 MiB.
- CMS dostaje odrębną pozycję nawigacji oraz trasę `/admin/dokumenty`.
- Administrator podaje nazwę odnośnika, wybiera plik PDF z dysku i przesyła
  go do Supabase Storage.
- Administrator widzi zapisaną listę dokumentów oraz może usunąć wpis i
  powiązany obiekt Storage.
- Strona `/kontakt` pokazuje sekcję wyłącznie wtedy, gdy istnieje przynajmniej
  jeden dokument. Odnośnik korzysta z podpisanego adresu URL i ma
  `target="_blank"` oraz `rel="noreferrer"`.

Poza zakresem pozostają: zewnętrzne adresy URL wpisywane ręcznie, inne formaty
plików, wersjonowanie dokumentów, kategorie oraz rezerwacje i płatności.

## Architektura danych i bezpieczeństwo

Nowa migracja tworzy tabelę `public.contact_documents`:

| Kolumna | Znaczenie |
| --- | --- |
| `id uuid primary key` | Stabilny identyfikator dokumentu. |
| `title text not null` | Nazwa odnośnika dla odwiedzających; po trimie 3–160 znaków. |
| `storage_path text not null unique` | Ścieżka obiektu w Supabase Storage, zgodna z `documents/<uuid>.pdf`. |
| `position integer not null unique` | Deterministyczna kolejność w sekcji do pobrania. |
| `created_at timestamptz not null` | Data dodania. |

Bucket `contact-documents` pozostaje prywatny, ogranicza rozmiar obiektu do
10 MiB i przyjmuje wyłącznie `application/pdf`. Aplikacja nadaje obiektowi
niezgadywalną ścieżkę `documents/<uuid>.pdf` i zapisuje go z MIME type
`application/pdf` — bez wymuszania pobrania, aby przeglądarka mogła wyświetlić
PDF w nowej karcie.

RLS na `contact_documents`:

- `anon` i `authenticated` mogą odczytać dokumenty z tabeli.
- Wyłącznie użytkownik uwierzytelniony, dla którego istniejąca funkcja
  `public.is_cms_admin()` zwraca `true`, może tworzyć, zmieniać i usuwać wiersze.

RLS na `storage.objects` dla bucketu:

- Odczyt przysługuje `anon` oraz `authenticated` tylko dla obiektu, którego
  ścieżka jest zapisana w `contact_documents`.
- Zapis, aktualizacja i usuwanie przysługują wyłącznie administratorowi oraz
  tylko dla ścieżki odpowiadającej dokładnie `documents/<uuid>.pdf`.

Takie reguły nie polegają na ukryciu interfejsu CMS. Wysłany obiekt nie jest
publicznie dostępny, dopóki jego metadane nie zostaną zapisane w tabeli.
Wszystkie wywołania z przeglądarki korzystają tylko z publicznego URL-a i klucza
anon Supabase.

## Warstwa aplikacji

Nowy moduł `src/lib/documents/` rozdziela odpowiedzialności:

- `validation.ts` definiuje kontrakt PDF, limit i komunikaty walidacyjne;
- `path.ts` tworzy oraz sprawdza bezpieczne ścieżki obiektów;
- `repository.ts` obsługuje listowanie, podpisane adresy, upload i usuwanie,
  w tym próbę posprzątania obiektu gdy zapis metadanych nie powiedzie się;
- `types.ts` i ewentualnie `schema.ts` walidują odpowiedzi Supabase na granicy
  aplikacji.

Upload ma kolejność: sprawdzenie danych lokalnie, upload obiektu, insert
metadanych, odświeżenie listy. Jeśli insert nie powiedzie się, repozytorium
usuwa przed chwilą wgrany plik. Przy usuwaniu najpierw kasowany jest wiersz,
a następnie obiekt; niepowodzenie sprzątania pokazuje administratorowi
komunikat z możliwością ponowienia próby.

## CMS

`/admin` zachowuje ekran ofert i dostaje widoczne łącze „Dokumenty”. Nowa
trasa `/admin/dokumenty` jest objęta istniejącym `AdminGuard` i używa tego
samego nagłówka, wylogowania oraz spokojnych komponentów formularzy.

Ekran zawiera:

1. Formularz z polem „Nazwa dokumentu”, kontrolką wyboru pliku ograniczoną do
   PDF oraz przyciskiem „Dodaj dokument”.
2. Czytelny komunikat błędu, jeżeli tytuł lub plik nie spełnia kontraktu albo
   operacja Supabase się nie powiedzie.
3. Listę dokumentów uporządkowaną według `position`, z odnośnikiem „Otwórz”
   i opisanym dostępnie przyciskiem „Usuń”.
4. Dialog potwierdzenia przed usunięciem dokumentu.

Tytuł jest wymagany i po trimie ma 3–160 znaków. Po sukcesie formularz czyści
tytuł oraz kontrolkę pliku, a lista jest odświeżana. Nowe dokumenty otrzymują
następną wolną pozycję. Zmiana kolejności nie wchodzi w ten zakres.

## Strona kontaktowa

`/kontakt` pozostaje stroną marketingową z istniejącymi danymi firmy. Pod
kartami kontaktu pojawia się komponent z nagłówkiem „Do pobrania” i listą
podkreślonych polskich nazw dokumentów, w stylistyce obecnego systemu
(ciepłe tło, `font-display` dla nagłówka, `font-sans` dla linków i widoczny
focus). Na wąskich ekranach lista zachowuje ten sam rytm i nie tworzy poziomego
przewijania.

Komponent pobiera listę przez TanStack Query. Gdy lista jest pusta, nie renderuje
sekcji; w trakcie ładowania informuje semantycznie o postępie; przy błędzie
wyświetla krótki komunikat i przycisk ponowienia. Pozostała zawartość kontaktu
działa niezależnie od tej operacji.

## Testy i weryfikacja

- Testy jednostkowe walidacji obejmą prawidłowy PDF, brak MIME, zły MIME,
  zły sufiks i przekroczenie 10 MiB.
- Testy ścieżek obejmą losową ścieżkę PDF oraz odrzucenie nieprawidłowej.
- Testy repozytorium sprawdzą listowanie, bezpieczny signed URL, udany upload,
  sprzątanie po nieudanym insercie oraz usuwanie i błąd sprzątania.
- Test trasy CMS sprawdzi formularz, walidację, odświeżenie listy i dostępne
  akcje; test `/kontakt` sprawdzi widoczne linki, nową kartę oraz brak sekcji
  dla pustej listy.
- Test SQL w `supabase/tests/cms_security.sql` sprawdzi ograniczenia bucketa,
  publiczny odczyt wyłącznie powiązanych obiektów oraz zakaz operacji dla
  anonimowego i zwykłego uwierzytelnionego użytkownika.
- Przed przekazaniem zmian zostaną wykonane testy ze skonfigurowanymi publicznymi
  zmiennymi środowiskowymi, `bun run lint` i `bun run build`.
