# Statusy i tagi kart ofert

## Cel

Karty ofert mają jasno odróżniać zakończone wyjazdy i obozy od ofert, dla
których administrator chce zaakcentować ograniczoną liczbę miejsc. Rozwiązanie
obejmuje listy wyjazdów i obozów oraz współdzieloną kartę strony głównej.

## Zakres

- Zakończona oferta jest rozpoznawana automatycznie, gdy jej `endDate` jest
  wcześniejsza niż bieżąca data w strefie `Europe/Warsaw`.
- Karta zakończonej oferty pokazuje obraz w skali szarości i tag
  `Zakończone`, ale nie jest linkiem ani elementem fokusowalnym. Nie pokazuje
  CTA prowadzącego do szczegółów.
- Administrator może włączyć dla oferty tag `Ostatnie miejsca`.
- `Ostatnie miejsca` nie jest wyświetlane, gdy oferta jest zakończona, nawet
  gdy przełącznik pozostaje włączony w CMS.
- Strona główna zachowuje obecny filtr: pokazuje wyłącznie przyszłe oferty.
  Zakończone oferty nie będą tam dodawane.

## Model danych i CMS

Nowa migracja Supabase doda do `public.offers` pole:

```sql
show_last_places_badge boolean not null default false
```

Wartość zostanie dodana do kontraktów Zod, typów publicznej i edytowalnej
oferty, mapperów oraz kolumn wybieranych przez repozytoria publiczne i
administracyjne. Domyślne `false` zachowuje wygląd istniejących ofert.

W zakładce `Podstawy` formularza administracyjnego znajdzie się dostępny
przełącznik `Pokaż tag: Ostatnie miejsca`. Przełącznik steruje wyłącznie
wyświetleniem marketingowego tagu; nie zmienia statusu publikacji, dostępności
ani linku do zewnętrznych zapisów.

## Prezentacja kart

Wspólna, czysta funkcja wyznaczy status karty z oferty i daty warszawskiej,
aby wszystkie trzy implementacje stosowały dokładnie tę samą regułę.

| Stan | Obraz | Tagi | Interakcja |
| --- | --- | --- | --- |
| Przyszła, bez flagi | kolor | typ oferty | link do szczegółów |
| Przyszła, z flagą | kolor | typ oferty, `Ostatnie miejsca` | link do szczegółów |
| Zakończona | grayscale | typ oferty, `Zakończone` | bez linku i CTA |

Komponenty `OfferCard`, `DayCampCard` i `HomeOfferCard` zachowają obecny styl
tagu typu. Dodatkowe tagi zostaną ułożone obok lub pod nim w tym samym
górnym obszarze karty, bez zasłaniania tytułu.

## Bezpieczeństwo i kompatybilność

Pole nie zawiera danych wrażliwych. Istniejące RLS pozostaje bez zmian:
publiczni użytkownicy nadal mogą czytać wyłącznie opublikowane oferty, a zapis
wartości jest możliwy tylko przez istniejące uprawnione operacje CMS.

## Weryfikacja

- Testy mapowania i repozytoriów potwierdzą przesyłanie flagi przez odczyt i
  zapis.
- Test formularza potwierdzi zmianę wartości przełącznika.
- Testy kart pokryją ofertę przyszłą z tagiem `Ostatnie miejsca`, ofertę
  zakończoną z obrazem grayscale oraz brak linku i tagu `Ostatnie miejsca`
  po terminie.
- Pełny zestaw testów, lint i build będą uruchomione po implementacji.
