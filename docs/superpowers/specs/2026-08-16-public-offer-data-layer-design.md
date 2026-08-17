# Publiczna warstwa danych ofert — specyfikacja

## Cel

Zastąpić statyczny kontrakt danych ofert typowaną warstwą publicznego odczytu
z Supabase. Warstwa ma zwracać wyłącznie opublikowane oferty, nie ujawniać
szkiców ani archiwów oraz bezpiecznie obsługiwać prywatne obrazy Storage.

## Zakres

Task 020 tworzy moduły danych ofert i ustawia cache TanStack Query. Nie
przepina jeszcze stron `/` ani `/trips/:slug` ze statycznego `trips.ts`;
migracja ich konsumentów należy do Tasku 070. Dzięki temu publiczne widoki
zaczną używać gotowego, przetestowanego kontraktu, bez kopiowania zapytań,
walidacji lub reguł podpisanych URL-i.

## Architektura

`src/lib/supabase.ts` jest jedynym punktem importującym
`@supabase/supabase-js`. Tworzy pojedynczy klient z
`getPublicSupabaseConfig().url` oraz `getPublicSupabaseConfig().anonKey`.

Moduły w `src/lib/offers/` rozdzielają odpowiedzialności:

- `types.ts` definiuje publiczny kontrakt domenowy: `PublicOffer`,
  `OfferContent`, `OfferImage`, aktywność i status.
- `schema.ts` waliduje przez Zod dane SQL przed mapowaniem. Schemat listy nie
  zawiera `description` ani relacji obrazów; schemat szczegółu zawiera oba.
- `mapper.ts` normalizuje `snake_case` do kontraktu domenowego, sprawdza
  status, HTTPS `booking_url`, kompletność opisu oraz rosnącą, unikalną
  kolejność pozycji galerii.
- `public-repository.ts` wykonuje minimalne publiczne zapytania, podpisuje
  ścieżki obrazów wyłącznie w przeglądarce i mapuje błędy na lokalny
  `OfferRepositoryError`.
- `formatters.ts` zawiera formatery walut, terminów i liczebności grupy dla
  polskiego interfejsu.

## Przepływ danych

`listPublishedOffers()` wybiera wyłącznie pola niezbędne dla listy i zawsze
wywołuje `.eq('status', 'published')`. Nie pobiera `description` ani galerii.
Ponieważ wymagany typ zwracany to `PublicOffer[]`, mapper listy ustawia
`content` na obiekt z pustymi tablicami oraz `images` na pustą tablicę.
Obraz hero jest podpisywany, jeśli aplikacja działa w przeglądarce.

`getPublishedOfferBySlug(slug)` wybiera wszystkie pola szczegółu, filtruje
zarówno po `slug`, jak i `status = published`, a następnie pobiera obrazy
zawsze z `.order('position', { ascending: true })`. Wynik jest walidowany
przed połączeniem z podpisanymi URL-ami.

`resolvePublishedImageUrls(paths)` zwraca pustą mapę po stronie serwera i nie
wywołuje Supabase Storage. W przeglądarce wywołuje
`storage.from('offer-images').createSignedUrls(paths, 3600)`. Błędny lub
brakujący URL obrazu daje `null` w `heroImageUrl` lub `OfferImage.signedUrl`;
nie jest logowany ani wysyłany do telemetrii.

## Błędy i cache

Każdy błąd Supabase, niepoprawna odpowiedź SQL oraz problem podpisywania,
który uniemożliwia wykonanie zapytania, jest opakowany w
`OfferRepositoryError`. Komunikat przeznaczony dla UI jest bezpieczny i po
polsku; pierwotna przyczyna pozostaje jako `cause` dla narzędzi
deweloperskich.

`src/router.tsx` ustawia domyślny `staleTime` QueryClient na 45 minut. To
krócej niż jednogodzinny TTL podpisanych URL-i i wymusza odświeżenie danych,
zanim URL standardowo wygaśnie.

## Testowanie

Testy Vitest obejmą:

- pełne mapowanie danych SQL, odrzucenie błędnego opisu, nieopublikowanego
  statusu, nie-HTTPS `booking_url` oraz niewłaściwych pozycji obrazów;
- jawną obecność filtra `status = published` w zapytaniu listy i szczegółu,
  brak pola długiego opisu na liście oraz sortowanie galerii;
- brak podpisywania po stronie serwera i kontrolowane `null` dla błędnego
  podpisywania w przeglądarce;
- format ceny w PLN, pojedynczą datę, zakres dat oraz oba warianty
  liczebności grupy.

## Kryteria gotowości

Nowy kod nie importuje `Trip` ani `trips`. Każdy publiczny odczyt zawiera
jawny filtr statusu. `bun run test`, `bun run lint` oraz `bun run build`
przechodzą przed przekazaniem zmiany.
