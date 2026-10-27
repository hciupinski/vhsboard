# FAQ, galeria i napisy na stronie Kontakt — propozycja zakresu

**Stan:** użytkownik zaakceptował zakres 27.10.2026; realizacja na `codex/faq-gallery-contact` z `origin/main` (`686f062`).

**Źródła:** polecenie użytkownika z 27.10.2026 oraz aktualny [tracker](https://docs.google.com/spreadsheets/d/1MLn5I9EcpKrJRD6PP8rUxh8OoaHaeqMyHkwvmYN6sQQ/edit?gid=1028330015). Dla VHS-044 sprawdzono oryginalny obraz IMG-26 z fragmentu B21 maila, odpowiadający karcie „Obrazy z maila”.

## 1. Jednolita typografia FAQ

Wzorem jest obecne `/wyjazdy`: od 1024 px pytania 20 px, odpowiedzi 18 px; poniżej tego progu oba teksty 16 px. Nagłówki i wstępy zachowują obecne wielkości.

Ustawić te wartości we wspólnym `src/components/public/FaqSection.tsx`, usuwając rozróżnienie `desktopTypography` i jego przekazanie w `src/routes/wyjazdy.index.tsx`. Efekt obejmie `/wyjazdy`, `/obozy`, `/eventy` i `/o-nas`.

Nie zmieniać treści, szerokości odpowiedzi ani sposobu rozwijania. W trackerze opisać wykonany zakres typografii osobno: dopiski FAQ w VHS-038 (ogólny zakres Eventów) i VHS-040 nie oznaczają wykonania pozostałych części tych zgłoszeń. VHS-037 dotyczy szerokości, a VHS-017 treści; nie zamykać ich na podstawie tej zmiany.

## 2. VHS-018 — Galeria

Chodzi o zgłoszenie z kategorią **Galeria**, nie zamknięte zgłoszenie **Typografia** o tym samym ID.

Zmienić istniejący `src/components/offers/OfferGallery.tsx`. Wspólny komponent obsługuje galerie główne i zakwaterowania na `/wyjazdy/:slug` oraz `/obozy/:slug`; wszystkie te użycia otrzymają identyczny podgląd.

- Usunąć brązowy panel modalu, jego padding i ciepły cień. Kontener będzie przezroczysty, zdjęcie otrzyma delikatną czarną ramkę 1 px.
- Zachować istniejące czarne przyciemnienie całej strony za modalem. Jest oddzielone od tła kontenera zdjęcia, które znika.
- Dopasować całą fotografię do ekranu bez kadrowania (`object-contain`), także przy zdjęciach pionowych. Kontrolki i podpis muszą mieścić się w wysokości ekranu.
- Dodać przyciski „Poprzednie zdjęcie” / „Następne zdjęcie”, klawisze lewo/prawo oraz licznik, np. „2 / 8”. Otwieranie miniatury pokazuje dokładnie wybrane zdjęcie.
- Propozycja: nawigacja zapętlona — po ostatnim zdjęciu wracamy do pierwszego. Każda galeria, w tym zakwaterowania, ma własny zestaw zdjęć.
- Dla pojedynczego zdjęcia ukryć strzałki. Zachować zamykanie krzyżykiem i Escape, blokadę przewijania strony, focus wewnątrz modalu oraz powrót do miniatury po zamknięciu.
- Kontrolki minimum 44 × 44 px, widoczny focus, polskie etykiety, aktualizacja opisu dostępna dla czytnika ekranu. Bez automatycznego przewijania.

Zmiana dotyczy podglądu modalnego. Piaskowe tło sekcji z miniaturami pozostaje. Fotografie na O nas i Eventach są obecnie statycznymi figurami; ten zakres nie dodaje im nowego zachowania modalnego.

Wystarczy istniejący Radix Dialog i ikony Lucide. Nie zmieniać globalnych stylów wszystkich dialogów, CMS ani sposobu przechowywania i podpisywania zdjęć.

## 3. VHS-044 — propozycja do zatwierdzenia

IMG-26 pokazuje cztery duże jasnobeżowe słowa **SNOW | SKATE | SKIM | SURF** pod kartami kontaktowymi i przed dokumentami do pobrania. Separatory są cienkie i pomarańczowe. Obecnie tego bloku nie ma w `src/routes/kontakt.tsx`.

**Rekomendacja:** odtworzyć go jako tekst HTML i CSS w małym `src/components/public/ContactDisciplines.tsx`, umieszczonym pomiędzy kartami a `ContactDocuments`.

- Desktop od 1024 px: cztery równe kolumny w jednym rzędzie, duży Bebas Neue, wspólna linia bazowa, trzy pomarańczowe separatory. Pas szerszy od kart kontaktowych, z bezpiecznym marginesem od krawędzi ekranu.
- Szerokość i wielkość liter skalowane płynnie. Punkt startowy: maksymalna szerokość pasa 1440 px, font do 144 px; końcowy rozmiar sprawdzić względem IMG-26 i realnych metryk fontu.
- Poniżej 1024 px: układ 2 × 2, z separatorem między kolumnami w każdym rzędzie. Propozycja zachowuje czytelne rozmiary zamiast ściskać cztery wyrazy na telefonie; mail nie podaje mobilnego odpowiednika tego pasa.
- Użyć istniejących tokenów `text-border` oraz `border-primary`. Delikatny kolor dotyczy wyłącznie dekoracji; dane kontaktowe zachowują czytelny kontrast.
- Element dekoracyjny bez linków, animacji i nowej pozycji w hierarchii nagłówków; `aria-hidden="true"`. To samo odwzorowanie jako obraz byłoby mniej elastyczne przy różnych szerokościach; nie jest potrzebne.
- Zachować dane firmy, linki mailto/tel, odstęp społeczności z VHS-045 i sekcję dokumentów wraz ze stanami ładowania, błędu i pustej listy.

Użytkownik zatwierdził powyższy wygląd VHS-044 i wariant mobilny 2 × 2.

## Weryfikacja i dalsza realizacja

Po akceptacji przygotować plan wykonania i nową gałąź z aktualnego `origin/main`. Bez nowych zależności i zmian Supabase.

Sprawdzić FAQ na wszystkich czterech stronach przy 390 i 1440 px, mierząc rzeczywistą wielkość tekstu otwartych odpowiedzi. Galerię sprawdzić z jednym i wieloma zdjęciami, pionowymi i poziomymi, strzałkami, klawiaturą, zamknięciem oraz powrotem focusu. Kontakt sprawdzić przy 320, 390, 768, 1024 i 1440 px, bez poziomego przewijania i nachodzenia tekstów.

Testy interakcji galerii powinny obejmować otwarcie wybranej miniatury, przejście w obu kierunkach, zapętlenie i pojedyncze zdjęcie. Typografię i dekorację ocenić w przeglądarce; nie dodawać testów powtarzających nazwy klas CSS.

Uruchomić `bun run typecheck`, `bun run test`, `bun run lint` i `bun run build`. Zapisać rzeczywiste screenshoty oraz opis, URL/środowisko, viewport i commit przy właściwych zgłoszeniach. Zachować wcześniejsze dowody i pole akceptacji klientki. Wymóg obrazów osadzonych w komórkach nadal obowiązuje; nie przedstawiać linków jako jego spełnienia ani samego merge jako dowodu wdrożenia.
