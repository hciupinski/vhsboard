# CMS ofert administratora — specyfikacja

## Cel

Zastąpić prototypowy magazyn ofert w `localStorage` autoryzowanym edytorem
Supabase. Administrator może tworzyć i edytować szkice, publikować kompletne
oferty, cofać publikację i archiwizować ofertę bez fizycznego usuwania danych.
Zakres pozostaje wyłącznie marketingowym CMS-em; nie obejmuje rezerwacji,
płatności ani dostępności.

## Zakres i granice

- UI `/admin` i `/admin/:slug` pozostaje za istniejącym `AdminGuard`; RLS z
  migracji Supabase jest jedyną ochroną operacji zapisu.
- Oferta jest zapisywana w tabeli `offers`; komponent nie używa
  `src/lib/adminStore.ts` ani `localStorage`.
- Task 050 nie implementuje uploadu plików, zmiany kolejności obrazów ani
  usuwania obrazów. Te operacje należą do Tasku 060.
- Formularz zachowuje obecne zakładki. Zakładka zdjęć informuje, że zarządzanie
  plikami zostanie podłączone przez Task 060, zamiast udawać zapis adresów URL.
- Publikacja wymaga istniejącej ścieżki hero (`hero_image`) oraz rekordu
  `offer_images` tej samej oferty o tej ścieżce i poprawnym opisie alternatywnym.
  Oznacza to, że oferta bez wgranego obrazu pozostaje szkicem. Task 060 dostarczy
  UI, które utworzy taki rekord i ustawi hero; nie zostaną dodane pola ani kolumny
  duplikujące `offer_images.alt_text`.

## Model i walidacja

`EditableOffer` jest publicznym kontraktem edytora:

```ts
type EditableOffer = Omit<PublicOffer, "heroImageUrl" | "images"> & {
  status: OfferStatus;
  heroImagePath: string | null;
};
```

`EditableOfferInput` ma pola edytowalne z powyższego typu, bez `id`, statusu i
odczytowych dat audytowych. `editor-schema.ts` jest pojedynczym źródłem prawdy
dla formularza i repozytorium. Najpierw przycina tekst i usuwa puste elementy
tablic; następnie waliduje ograniczenia SQL oraz wymagania publikacji.

- `slug`: mały kebab-case.
- Teksty: wymagane, z limitami tabeli (`title` 3–120, `subtitle` 3–280,
  `shortDescription` 20–500, `location` 2–120); `durationDays` 1–60,
  liczebność grupy 1–99 albo `null`, a `priceFrom` jest dodatnią liczbą całkowitą.
- `bookingUrl` jest poprawnym URL-em HTTPS.
- Daty mają format ISO, data końcowa nie jest wcześniejsza od początkowej, a
  minimum grupy nie przekracza maksimum.
- `content.paragraphs` ma co najmniej jeden niepusty akapit. Każda lista po
  normalizacji składa się z niepustych elementów, a harmonogram zawiera dzień i
  opis.
- Zapis szkicu wymaga poprawnego wejścia do bazy; publikacja dodatkowo wymaga
  hero z opisem alternatywnym pobranym z `offer_images`.

Wszystkie komunikaty walidacji i błędów widoczne w UI są po polsku. Błąd
unikalnego sluga PostgreSQL (`23505`) staje się komunikatem
„Taki adres oferty już istnieje”; inne błędy zachowują bezpieczny komunikat
repozytorium i oryginalną przyczynę w `cause`.

## Repozytorium

`src/lib/offers/admin-repository.ts` udostępnia:

```ts
listAdminOffers(): Promise<EditableOffer[]>
getAdminOffer(slug: string): Promise<EditableOffer | null>
createOffer(input: EditableOfferInput): Promise<EditableOffer>
updateOffer(id: string, input: EditableOfferInput): Promise<EditableOffer>
setOfferStatus(id: string, status: OfferStatus): Promise<EditableOffer>
archiveOffer(id: string): Promise<void>
```

Lista i odczyt nie filtrują statusu — administrator widzi szkice, publikacje i
archiwum. Zapisy mapują camelCase na nazwy kolumn SQL i walidują wejście przed
wywołaniem Supabase. Zmiana statusu na `published` najpierw sprawdza pełną
ofertę oraz powiązany rekord hero; cofnięcie publikacji zmienia status na
`draft`, a archiwizacja na `archived`. Trigger bazy utrzymuje `published_at` i
`updated_at`.

Do miniatur administracyjnych repozytorium zwraca wyłącznie ścieżki; komponent
uzyskuje krótkotrwałe, podpisane URL-e dla widocznych ścieżek za pomocą
wydzielonego helpera. Nie trafiają one do trwałego modelu oferty ani publicznego
cache.

## Interfejs administratora

Lista ofert używa TanStack Query, pokazuje tytuł, lokalizację, zaktualizowaną
datę, miniaturę hero i tekstową etykietę każdego statusu. „Nowa oferta” tworzy
tylko lokalny stan formularza; pierwszy „Zapisz szkic” tworzy rekord ze statusem
`draft`. Nie są rezerwowane slugi w przeglądarce. Link „Podgląd” istnieje tylko
dla statusu `published`.

`OfferEditorForm` przejmuje zakładki i pola prototypu, przekazuje czyste dane
oraz błędy do trasy i nie czyści wartości po błędzie. `ListField` dostanie
polskie etykiety działań oraz stabilne, dostępne etykiety przycisków.

`OfferStatusActions` zawiera osobne przyciski: „Zapisz szkic”, „Opublikuj” i
„Cofnij publikację”. Wyłącza akcję publikacji, dopóki lokalna walidacja nie
przejdzie lub hero z altem nie jest dostępny. Każda mutacja blokuje powtórne
kliknięcia. Po powodzeniu unieważnia cache listy administratora; publikacja,
cofnięcie publikacji i archiwizacja unieważniają również klucze publicznych
ofert.

`DeleteOfferDialog` jest `AlertDialog`, nie usuwa rekordu, pokazuje tytuł
oferty oraz wyjaśnia, że archiwizacja ukryje ją publicznie, ale nie skasuje.
Anulowanie nie wykonuje mutacji.

## Obsługa błędów i dostępność

Trasa prezentuje błąd przy formularzu przez `role="alert"`; nie wyświetla
niebezpiecznych szczegółów Supabase i zachowuje niezapisane pola. Wszystkie
interakcje są natywnymi przyciskami lub linkami z istniejących prymitywów UI.
Status jest czytelny tekstowo, a akcje destrukcyjne pozostają dostępne z
klawiatury i wymagają potwierdzenia.

## Testy i weryfikacja

- Testy schematu pokrywają pełną ofertę oraz każdy warunek kontraktu, w tym
  HTTP, niepoprawny slug, odwrócony zakres dat i puste listy.
- Testy repozytorium potwierdzają mapowanie `23505` i brak fałszywego mapowania
  innych błędów na konflikt.
- Testy komponentów potwierdzają blokadę i poprawne wywołanie publikacji,
  potwierdzenie archiwizacji oraz brak linku podglądu dla szkicu i archiwum.
- Po wdrożeniu należy uruchomić `bun run test`, `bun run lint` i `bun run build`.
