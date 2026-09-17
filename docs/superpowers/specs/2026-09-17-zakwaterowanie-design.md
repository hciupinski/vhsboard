# Zakwaterowanie w ofertach — projekt techniczny

## Cel

Administrator może opcjonalnie włączyć dla każdego wyjazdu (`trip`) lub obozu
(`day_camp`) sekcję „Zakwaterowanie”, uzupełnić jej krótki opis oraz zarządzać
jej osobną galerią zdjęć. Publiczna oferta pokazuje kompletną sekcję w spójnej
kolejności i nawigacji kotwicowej.

## Zakres

- Dotyczy obu istniejących rodzajów ofert: wyjazdów i obozów.
- Nie zmienia zewnętrznego procesu rezerwacji, tras ani publicznego modelu
  dostępu do ofert.
- Nie wprowadza nowych usług ani zależności. Wykorzystuje obecny Supabase
  Storage bucket `offer-images`, tabelę `offer_images` oraz obrazowy interfejs
  CMS.

## Model danych i zasady publikacji

Treść oferty w kolumnie `offers.description` otrzyma opcjonalne pole:

```ts
type AccommodationContent = {
  description: string;
};

// Brak pola oznacza, że sekcja jest wyłączona.
type TripOfferContent = ExistingTripOfferContent & {
  accommodation?: AccommodationContent;
};

type DayCampContent = ExistingDayCampContent & {
  accommodation?: AccommodationContent;
};
```

Przełącznik w CMS zapisuje sekcję jako brak pola (`undefined`) lub obiekt z
opisem. Włączenie nie wymaga zdjęć ani opisu na etapie roboczego szkicu, żeby
administrator mógł tworzyć zawartość w dogodnej kolejności. Włączona sekcja
jest jednak kompletna przy publikacji wyłącznie wtedy, gdy opis ma od 3 do 500
znaków, a jej galeria zawiera co najmniej jedno zdjęcie.

Tabela `offer_images` dostanie kolumnę `category` z dopuszczalnymi wartościami
`gallery` oraz `accommodation`, domyślnie `gallery`. Dotychczasowe zdjęcia
pozostaną zwykłą galerią. Unikalność pozycji zostanie zmieniona z
`(offer_id, position)` na `(offer_id, category, position)`, aby każda galeria
mogła mieć niezależną kolejność. Ścieżki w Storage pozostaną unikalne i
związane z ofertą, więc obecne polityki RLS nadal ograniczają odczyt do zdjęć
opublikowanych ofert, a zapis do administratorów.

Migracja rozszerzy funkcję `reorder_offer_images` o kategorię i będzie
porządkować wyłącznie obrazy wskazanej kategorii. Spust publikacji sprawdzi,
czy oferta z `description.accommodation` zawiera poprawny opis i przynajmniej
jeden rekord `offer_images.category = 'accommodation'`. Dzięki temu klient nie
może opublikować niepełnej sekcji przez ominięcie walidacji formularza.

## Dostęp do danych i mapowanie

Typ `OfferImage` zyska kategorię, a `PublicOffer` zyska listę zdjęć
zakwaterowania wyprowadzoną z wierszy kategorii `accommodation`. Główna
galeria i wybór zdjęcia hero będą nadal używać wyłącznie kategorii `gallery`.
Zapytania publiczne i podgląd administratora pobiorą oba zbiory obrazów, lecz
ich identyfikatory i pozycje będą walidowane z kategorią.

Repozytorium administratora przy uploadzie zapisze wybraną kategorię, pobierze
następną pozycję w obrębie tej kategorii i wywoła kategoriowy RPC podczas
przesuwania zdjęć. Usuwanie nadal najpierw usuwa rekord i obiekt Storage,
następnie odświeża listę. Komunikaty błędów pozostają po polsku.

## CMS

Edytor otrzyma kartę „Zakwaterowanie” dla obu rodzajów ofert. Zawiera ona:

1. przełącznik „Pokaż sekcję zakwaterowania”; po wyłączeniu usuwa dane
   zakwaterowania z treści oferty, ale nie kasuje przesłanych zdjęć;
2. tekstarea z krótkim opisem, widoczna po włączeniu przełącznika;
3. istniejący komponent menedżera obrazów uruchomiony dla kategorii
   `accommodation`, z dodaniem, zmianą kolejności, usunięciem i opisem alt.

Usunięcie zdjęcia jest trwałe i używa obecnego dialogu potwierdzenia. Zdjęcia
pozostawione po wyłączeniu sekcji nie są dostępne publicznie; administrator
może je zachować na później lub usunąć. Opisy alternatywne są nadal wymagane
w języku polskim, zgodnie z obecną walidacją obrazów.

## Widok publiczny

W stronach `/wyjazdy/:slug` i `/obozy/:slug` po harmonogramie, a przed
zwykłą galerią, pojawi się sekcja `#zakwaterowanie`. Ma nagłówek
„Zakwaterowanie”, opis i ten sam dostępny, otwierany w dialogu układ galerii,
który już wykorzystuje `OfferGallery`. Nie będzie renderowana, gdy sekcja jest
wyłączona lub nie ma dostępnych zdjęć. Dla wyjazdów zostanie dodana do
`TripSectionNavigation`; dla obozów zostanie uwzględniona w ich odpowiedniku
nawigacji tylko przy widocznej treści.

## Testy i kryteria akceptacji

- Schematy edytora akceptują wyłączone zakwaterowanie, normalizują opis i
  odrzucają niepoprawny opis włączonej sekcji.
- Mapper rozdziela galerie według kategorii i nie używa zdjęcia zakwaterowania
  jako hero ani w zwykłej galerii.
- Repozytoria wysyłają i zmieniają kolejność obrazów z właściwą kategorią.
- Testy komponentów CMS sprawdzają przełącznik, opis i przekazanie galerii
  zakwaterowania do menedżera obrazów.
- Testy stron publicznych obu rodzajów ofert sprawdzają widoczność sekcji,
  obrazy, kotwicę/nawigację oraz brak sekcji przy wyłączonych danych.
- Test SQL migracji sprawdza niezależne pozycje galerii i blokadę publikacji
  niepełnego zakwaterowania przy zachowaniu RLS.

## Wykluczenia

- Brak rezerwacji, płatności, dostępności, kont klientów i danych uczestników.
- Brak nowego bucketu, usługi backendowej lub zmian nazw tras.
- Brak automatycznego usuwania zdjęć po wyłączeniu sekcji.
