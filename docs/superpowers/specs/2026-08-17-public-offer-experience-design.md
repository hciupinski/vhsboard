# Public Offer Experience — Design

## Cel

Zastąpić statyczne oferty na stronie publicznej danymi `PublicOffer` z
Supabase, zachowując editorialny charakter VHSBOARD, dostępność oraz wyłącznie
zewnętrzny handoff do TripAhead.

## Zakres

- Strona główna pobiera opublikowane oferty przez TanStack Query i nie używa
  `src/lib/trips.ts` jako źródła ani fallbacku.
- Szczegół `/trips/:slug` pobiera ofertę opublikowaną przez Query; brak rekordu
  prowadzi do `notFound()`, a problem sieciowy do standardowego błędu aplikacji.
- Zostają utworzone małe komponenty: `OfferCard`, `OfferFacts`, `OfferGallery`
  i `OfferListState`.
- Formularz w bloku kontaktowym na stronie głównej zostaje usunięty. Pozostają
  bezpośrednie dane kontaktowe oraz konkretny tekst dla prywatnych ekip.
- Element HTML głównej powłoki ma `lang="pl"`.

## Dane i hydratacja

Funkcje repozytorium z Task 020 pozostają źródłem danych. Route loader
szczegółu używa cache `QueryClient`, a komponenty używają tych samych kluczy
zapytań. Zapytania są ponawiane przy pierwszym montowaniu po hydratacji,
ponieważ odpowiedź SSR zawiera `null` dla podpisanych adresów obrazów. W ten
sposób prerenderowany HTML pokazuje bezpieczne placeholdery i nie utrwala URL-i
Storage ważnych 3600 sekund; po hydratacji `resolvePublishedImageUrls` jest
wywoływane przez istniejące repozytorium w przeglądarce.

## Interfejs strony głównej

Sekcja ofert otrzymuje `OfferListState`, który renderuje:

- siatkę szkieletów podczas ładowania;
- polski stan pusty, gdy lista nie zawiera ofert;
- błąd z `role="alert"` i natywnym przyciskiem „Spróbuj ponownie”, który
  wywołuje `refetch` i jest dostępny z klawiatury.

`OfferCard` pokazuje hero (albo dekoracyjny placeholder), aktywność,
lokalizację, tytuł, opis, długość, wielkość grupy, cenę i jeden link do
szczegółów. Korzysta z polskich formatterów, `rounded-3xl`, tokenów
semantycznych oraz ograniczonego efektu hover wskazanego w design systemie.

## Interfejs szczegółu oferty

Hero, panel faktów i treść szczegółu wynikają z jednego `PublicOffer`.
`OfferFacts` pokazuje lokalizację, termin, długość, grupę oraz cenę. Sekcje
akapitów, highlightów, harmonogramu, elementów w cenie/poza ceną i galerii są
renderowane tylko przy niepustej treści. Galeria używa obrazów z altami z bazy,
`loading="lazy"` oraz stabilnego proporcjonalnego kontenera.

CTA jest natywnym `<a>` z tekstem „Przejdź do rezerwacji w TripAhead”,
`target="_blank"` i `rel="noopener noreferrer"`. Jest widoczne wyłącznie dla
poprawnego URL-a `https:`. Nieprawidłowa wartość nie generuje informacji na
stronie publicznej ani zastępczego formularza; walidacja administracyjna
pozostaje obowiązkiem panelu CMS w jego osobnym zakresie.

## Dostępność i bezpieczeństwo

Wszystkie elementy interaktywne pozostają natywnymi linkami lub przyciskami z
widocznym focusem. Obrazy treści używają altów z bazy, a placeholdery
`alt=""`. Nie jest używane `dangerouslySetInnerHTML`. Układ jest mobile-first,
bez poziomego przewijania na wąskich ekranach.

## Testy

Testy komponentowe sprawdzają formatowanie i link szczegółu w `OfferCard`,
brak obrazka dla braku URL-a, zachowanie altu, brak `innerHTML`, atrybuty i
walidację CTA TripAhead oraz błąd listy z ogłoszeniem i ponowieniem klawiaturą.
Całość jest weryfikowana przez `bun run test`, `bun run lint` i `bun run build`.
