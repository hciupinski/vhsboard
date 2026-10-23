# Poprawki z uwag klientki — plan realizacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Wykonać 17 jednoznacznych poprawek i zweryfikować 2 zgłoszenia, których oczekiwane zachowanie jest już zapisane w kodzie, z dowodem przy każdym ID w arkuszu.

**Architecture:** Lokalne zmiany istniejących stron i komponentów React. Zachowujemy publiczne zapytania do Supabase, model danych, routing oraz statyczny deploy. Wspólny FAQ otrzyma opcjonalne ustawienia ograniczone do konkretnych stron.

**Tech Stack:** React 19, TypeScript, TanStack Router/Query, Tailwind CSS 4, Radix UI, Vitest, Bun, Supabase.

**Spec:** [Aktualny arkusz, karta „Zgłoszenia”](https://docs.google.com/spreadsheets/d/1MLn5I9EcpKrJRD6PP8rUxh8OoaHaeqMyHkwvmYN6sQQ/edit#gid=1028330015), powiązana karta „Oryginalny mail”, [AGENTS.md](../../AGENTS.md), [design system](../design-system.md) i [architektura](../architecture.md).

**Stan:** Plan zaakceptowany i zrealizowany lokalnie 23.10.2026. Wszystkie 19 ID ma status `Do akceptacji`, opis wyniku, wersję i trwałe linki do dowodów na Dysku. Kod: `cbaa63f`. Bez pushu i wdrożenia.

**Branch:** `fix/20261023`, utworzony po `git fetch origin --prune` z `origin/main` wskazującego `10874679da0e9fad3c17e79b1dbd408f34b7839b`.

## Zakres i podejście

Rekomendacja: najpierw poprawki o kompletnych wymaganiach, z zachowaniem obecnego projektu. Alternatywa obejmująca przebudowę galerii, karuzel, sekcji torów i kolorystyki wymaga decyzji klientki oraz materiałów, dlatego pozostaje poza tym etapem. Poniższe wartości odstępów i rozmiarów są propozycją techniczną do akceptacji razem z planem.

| Grupa           | Zmiany                                                        | Wyłącznie weryfikacja istniejącego zachowania |
| --------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Główna i stopka | VHS-004, VHS-009, VHS-012, VHS-013                            | VHS-008, VHS-010                              |
| FAQ wyjazdów    | VHS-014, VHS-016                                              | —                                             |
| Eventy          | VHS-024, VHS-025, VHS-026, VHS-029, VHS-030, VHS-032, VHS-034 | —                                             |
| Obozy           | VHS-040                                                       | —                                             |
| O nas           | VHS-042, VHS-043                                              | —                                             |
| Kontakt         | VHS-045                                                       | —                                             |

Pozostałe 31 pozycji nie wchodzi do wykonania w tym etapie. Nie zmieniamy ich statusów ani akceptacji.

## Global Constraints

- Arkusz Google Sheets pozostaje bazą zadań; identyfikujemy zgłoszenia po `VHS-###`, nie numerze wiersza.
- Przed rozpoczęciem kodowania potrzebna jest akceptacja tego planu.
- Nie zmieniamy Supabase/RLS, danych produkcyjnych, schematu CMS, tras ani integracji TripAhead.
- Nie dodajemy zależności. Zachowujemy semantyczne tokeny Tailwind, Bebas Neue, Barlow oraz polski tekst.
- Zdjęcia repozytorium obsługujemy przez `getLocalImage` i `ResponsiveImage` oraz istniejący katalog wariantów.
- Zachowujemy keyboard focus, kontrast, reduced motion oraz mobilny układ bez poziomego przewijania całej strony.
- Każde wykonane ID wymaga sprawdzenia w przeglądarce, rzeczywistego screenshota w `Po / dowód` i uzupełnienia wyniku w tym samym wierszu.
- Nie oznaczamy zadań jako zaakceptowanych przez klientkę; po poprawnej weryfikacji używamy `Do akceptacji`.
- Dowód z `localhost` opisujemy jako lokalny. Akceptacja planu nie oznacza wdrożenia na produkcję.

## Review Focus

1. Dotykowe urządzenie bez hover: CTA oferty musi być widoczne przed pierwszą interakcją; weryfikacja w grupie 1.
2. Dwie/trzy oferty, długie tytuły i brak ofert: poziomy układ desktop nie może psuć stanów listy; weryfikacja w grupie 1.
3. Współdzielony FAQ: zmiana wyjazdów i szerokości opisu O nas nie może zmienić zaakceptowanego FAQ Eventów; grupy 2 i 5.
4. Kolejność i semantyka Eventów: przeniesiona sekcja nie może być zdublowana, a usunięta zostawiać pustego odstępu; grupa 3.
5. Sortowanie lub równoczesna edycja arkusza: wynik i screenshot muszą trafić do aktualnego wiersza tego samego ID; procedura dowodów obowiązuje każdą grupę.

## 1. Główna i stopka

**Files:** `src/styles.css`, `src/components/home/HomeUpcomingOffersSection.tsx`, `src/components/home/HomeContactCta.tsx`, `src/components/public/PublicFooter.tsx`.

**Testy istniejące:** `src/components/home/HomeUpcomingOffersSection.test.tsx`, `src/components/home/HomeOfferCard.test.tsx`, `src/components/public/PublicChrome.test.tsx`, `src/lib/offers/home-offers.test.ts`, `src/routes/public-pages.test.tsx`.

**Interfaces:** Zachowane istniejące propsy komponentów oraz model `PublicOffer`. Dane kontaktowe nadal pochodzą z obecnej konfiguracji.

- [x] VHS-004: na desktopie obniżyć tekst kategorii Wyjazdy/Eventy/Obozy o około 16 px, zmniejszając dolny odstęp w istniejącym panelu przy `min-width: 1024px`. Nie zmieniać mobilnego układu, ukośnych paneli ani ujawniania opisu przez hover/focus.
- [x] VHS-009: tytuł sekcji zmienić na `ROZKŁAD JAZDY`; opis na `Sprawdź, co szykujemy w najbliższym czasie i dołącz do przygody.`
- [x] VHS-012: użyć pomarańczowego `KONTAKT` i nagłówka `MASZ PYTANIA? POGADAJMY!`. Zachować obecny opis oraz adresy linków.
- [x] VHS-013: usunąć mobilne ukrywanie istniejącego adresu i hasła stopki; pokazać adres, e-mail, telefon i `Robione między falami a opadami śniegu`. Zachować konfigurację danych, dokumenty i kontrolę cookies.
- [x] VHS-008: przed zmianą sprawdzić na 390 × 844, czy `Sprawdź szczegóły` w przyszłej ofercie jest od razu widoczne. CSS już przewiduje widoczność bez hover. Jeżeli działa, nie zmieniać kodu i wpisać w wynik „Potwierdzono istniejące zachowanie”. Sprawdzić także tablet dotykowy i focus klawiatury na desktopie. Zakończone oferty celowo nie mają tego CTA.
- [x] VHS-010: potwierdzić dwie i trzy przyszłe oferty w jednym desktopowym rzędzie. Obecny kod ma siatkę `md:2 / lg:3` i limit trzech ofert. Nie dodawać slidera ani zwiększać limitu. Jeśli produkcyjne dane nie pozwalają pokazać obu scenariuszy dwóch i trzech ofert, użyć izolowanych, opisanych danych testowych w tymczasowym lokalnym podglądzie komponentu, bez zapisywania ich do CMS ani dodawania trwałej trasy do aplikacji. Sprawdzić też jedną ofertę, zero ofert, długi tytuł oraz stan ładowania/błędu.
- [x] Zaktualizować istniejące asercje tekstów. Uruchomić wskazane testy plików przez `bun run test <ścieżki>`; oczekiwany wynik: wszystkie testy przechodzą.
- [x] W przeglądarce sprawdzić 390 × 844 i 1440 × 900; dodatkowo panele przy 1024 px i stopkę przy 320 px. Zweryfikować brak uciętych tekstów, `mailto:`, `tel:`, focus i brak poziomego scrolla strony.
- [x] Zapisać dowód i wynik osobno dla każdego z sześciu ID według procedury poniżej. Dopiero wtedy przekazać je do akceptacji.

## 2. FAQ wyjazdów

**Files:** `src/components/public/FaqSection.tsx`, `src/routes/wyjazdy.index.tsx`.

**Testy istniejące:** `src/components/public/FaqSection.test.tsx`, `src/routes/wyjazdy.index.test.tsx`.

**Interfaces:** Do `FaqSectionProps` dodać opcjonalne `desktopTypography?: "default" | "large"`, domyślnie `"default"`. Obecne `headingId`, `items`, `headerLabel` i `description` zachowują znaczenie.

- [x] VHS-014: w wariancie `large` od `lg` zastosować 20 px dla pytań i 18 px dla odpowiedzi. Włączyć wariant wyłącznie na `/wyjazdy`. Na mobile pytania i odpowiedzi pozostają 16 px; wielkość nagłówka bez zmian.
- [x] VHS-016: przez istniejący `description` przekazać dokładny tekst: `Zebraliśmy najważniejsze informacje dotyczące wyjazdów na snowboard, narty czy surfing. Masz dodatkowe wątpliwości? Zawsze możesz skontaktować się z nami mailowo lub telefonicznie.` Nagłówek już odpowiada uwadze; nie zmieniać pytań i odpowiedzi VHS-017.
- [x] Sprawdzić istniejące testy FAQ i strony wyjazdów; uaktualnić asercję opisu tam, gdzie dokumentuje treść konkretnej strony. Nie pisać testu, który tylko powtarza nazwy klas CSS.
- [x] Sprawdzić 1440 × 900 oraz 390 × 844, z zamkniętymi i otwartymi odpowiedziami; Enter/Space muszą nadal działać. Porównać `/eventy`, `/obozy`, `/o-nas`, żeby wykryć zmianę domyślnego wariantu.
- [x] Osobno udokumentować VHS-014 i VHS-016 w arkuszu.

## 3. Eventy

**Files:** `src/routes/eventy.tsx`; odpowiednie asercje w `src/routes/public-pages.test.tsx`.

**Testy istniejące:** `src/routes/public-pages.test.tsx`, `src/components/events/EventUseCasesScroller.test.tsx`.

**Interfaces:** Bez zmian API `EventUseCasesScroller` i `EventPlaceholderFigure`. Nie zmieniać współdzielonych fontów ani proporcji wszystkich obrazów.

- [x] VHS-024 i VHS-025: zachować obecne zdjęcie oraz overlay, podmienić H1 na `TOR SKIMBOARDOWY – PRZYCIĄGA LUDZI, WCIĄGA DO ZABAWY.`; etykieta `EVENTY` pozostaje. Proponowany start korekty desktopowej: `lg:py-20`, maksymalny H1 72 px zamiast 96 px, dotychczasowy kierunek kadrowania 65% w poziomie. Ustawić rzeczywiste `sizes="100vw"` dla pełnej szerokości zdjęcia. Zweryfikować kadr w przeglądarce przed uznaniem VHS-024 za poprawione.
- [x] VHS-026: małą etykietę `Strefa Skate` zmienić z `h2` na `p`, a właściwy tytuł sekcji z `h3` na `h2`. Usuwa to dziedziczenie Bebas Neue z etykiety bez zmiany globalnych fontów.
- [x] VHS-034: usunąć cały blok `Czym jest skimboarding?` razem z jego tłem i odstępami.
- [x] VHS-029: przenieść istniejącą Strefę Skate za ostatnią sekcję torów skimboardowych, przed galerię. Nie zmieniać jeszcze zdjęcia i działania przycisku z VHS-027/028.
- [x] VHS-030: użyć `IDEALNY NA LATO`, zachować nagłówek `ATRAKCJA NA KAŻDY EVENT`, a opis i listę podmienić na poniższe. Zachować obecny scroller; zmiana jego projektu VHS-031 pozostaje poza etapem.
- [x] VHS-032: w istniejącej sekcji centrum handlowego zastosować etykietę `SURFING W MIEŚCIE` i poniższy opis. Nie tworzyć duplikatu sekcji i nie dodawać pustego odtwarzacza oczekującego na VHS-033.
- [x] Uaktualnić testy starego H1, hierarchii nagłówków, listy zastosowań, usuniętej sekcji i kolejności Skate. Oczekiwania: jedna sekcja Skate, siedem pozycji listy, brak nagłówka `Czym jest skimboarding?`, bez zmian w FAQ Eventów.
- [x] Uruchomić testy strony i scrollerów. W przeglądarce sprawdzić desktop 1440 × 900, 1920 px i mobile 390 × 844; klawiaturę, końcowe pozycje listy i reduced motion. Nie zmieniać zaakceptowanych pytań FAQ VHS-037.
- [x] Uzupełnić dowód i wynik każdego z siedmiu ID; screenshot po usunięciu sekcji ma pokazać sąsiadujące pozostałe sekcje, a po przesunięciu Skate także jej nowe położenie.

**VHS-030 — opis:**

Mobilny tor skimboardowy sprawdzi się w sezonie letnim na wielu imprezach plenerowych. To świetna atrakcja, która angażuje ludzi, promuje aktywne spędzanie czasu i świetnie wygląda na zdjęciach.

**VHS-030 — siedem zastosowań, w kolejności z maila:**

1. Integracje i pikniki firmowe
2. obchody miast, gmin
3. imprezy plenerowe, festiwale, juwenalia
4. pikniki rodzinne, festyny
5. obozy dla dzieci i młodzieży
6. eventy w galeriach handlowych
7. wydarzenia sportowe, targi

**VHS-032 — opis:**

Tor skimboardowy może stać się głównym punktem letniej strefy w galerii lub parku handlowym. To świetny element kampanii sezonowej, który zachęca do odwiedzin obiektu i tworzy wakacyjny klimat w miejskiej przestrzeni.

## 4. Obozy — dostępne zdjęcie letnie

**Files:** `src/routes/obozy.index.tsx`; istniejący asset `src/assets/carousel/obozy-lato-wakeboard.png`.

**Interfaces:** Zachować `getLocalImage`, `ResponsiveImage`, istniejący alt i katalog wygenerowanych obrazów.

- [x] VHS-040: zmienić wyłącznie `summerCampImage` na `getLocalImage("carousel/obozy-lato-wakeboard.png")`. Zdjęcie zostało rozpoznane jako scena z IMG-22: dziecko w różowych spodenkach, wakepark i biała przeszkoda. Podgląd mailowy wygląda na lustrzane odbicie; wykorzystujemy oryginał z repo, bez automatycznego odwracania i bez obietnicy identycznego kadru miniatury.
- [x] Na 390 × 844 i 1440 × 900 sprawdzić czytelność tekstu oraz widoczność dziecka. Potwierdzić, że hero i zdjęcie zimowe nie zmieniły się. Uruchomić `bun run images:check` oraz właściwe istniejące testy obozów/public pages.
- [x] Uzupełnić VHS-040 wynikiem i screenshotem. Oryginalnego statusu „Czeka na materiały” nie zmieniać na zakończony przed wykonaniem i weryfikacją.

## 5. O nas

**Files:** `src/routes/o-nas.tsx`, `src/components/public/FaqSection.tsx`.

**Testy istniejące:** `src/routes/public-pages.test.tsx`, `src/components/public/FaqSection.test.tsx`.

**Interfaces:** Do `FaqSectionProps` dodać opcjonalne `descriptionClassName?: string`, składane z dotychczasowymi klasami przez istniejące `cn`. Domyślna szerokość pozostaje `max-w-2xl`.

- [x] VHS-042: pierwszy akapit wstępu zmienić na `text-base sm:text-lg`, żeby na mobile wszystkie trzy akapity miały 16 px i ten sam interliniaż. Zachować większy wstęp desktopowy i całą treść.
- [x] VHS-043: tylko na `/o-nas` przekazać `descriptionClassName="lg:max-w-4xl"`. Pozwolić zdaniu naturalnie się układać; na 1440 px `ruszyć w drogę` nie powinno pozostawać samotną końcową linią. Nie wprowadzać `nowrap` ani ręcznych `<br>` dla wszystkich urządzeń.
- [x] Sprawdzić 390 × 844, 1024 px i 1440 × 900; porównać rozmiary trzech akapitów na mobile i łamanie opisu FAQ na desktopie. Pozostałe strony FAQ zachowują dotychczasową szerokość opisu.
- [x] Uruchomić istniejące testy i uzupełnić osobny dowód dla VHS-042 oraz VHS-043. Nie zmieniać położenia zdjęć z VHS-046/047.

## 6. Kontakt

**Files:** `src/routes/kontakt.tsx`; istniejący test kontaktu w `src/routes/public-pages.test.tsx`.

**Interfaces:** Dane firmy, linki i `SocialLinks` bez zmian.

- [x] VHS-045: do istniejącego bloku społeczności z `mt-auto` dodać `pt-8`, zapewniając minimum 32 px oddechu po telefonie bez utraty dolnego wyrównania na desktopie.
- [x] Sprawdzić 320/390/640 px oraz 1440 × 900: wyraźny odstęp, kompletne linki, brak ucięć i zachowany układ desktop. Zachować intencję testu `keeps the social callout at the bottom of the contact card`.
- [x] Uruchomić test strony i zapisać dowód w VHS-045.

## 7. Procedura dowodów i aktualizacji arkusza

Ta procedura jest częścią wykonania każdego ID, także VHS-008 i VHS-010, jeśli potwierdzimy istniejące działanie bez zmiany kodu.

- [x] Odczytać aktualny wiersz po ID; sprawdzić czy zadanie nie zostało już podjęte lub zmienione. Dopiero przy rozpoczęciu zmienić status na `W trakcie`.
- [x] Odtworzyć problem i zapisać stan bazowy przy tych samych danych i szerokości. Zachować klientkowe `Przed`; dodatkowy stan bazowy można podlinkować, nie zastępować oryginału.
- [x] Wykonać zmianę lub potwierdzić istniejące działanie. Sprawdzić kryteria danej grupy, linki, klawiaturę i mobilny układ. Testy DOM nie zastępują sprawdzenia renderu.
- [x] Wykonać prawdziwy screenshot poprawionego fragmentu. Nazwa: `VHS-###-after-mobile-390.jpg` lub `VHS-###-after-desktop-1440.jpg`; stan opisowy dopisać do nazwy, gdy potrzeba kilku ujęć.
- [x] Zachować pliki w podfolderze dowodów w [folderze projektu na Dysku](https://drive.google.com/drive/folders/1DLl4da6hd_u1a20dCIWe98E6TpELG4QH). Zgodnie z późniejszą zgodą użytkownika zapisać trwałe linki do screenshotów w istniejącej komórce `Po / dowód` tego ID, w tym dodatkowe ujęcia desktop/mobile. Dowody mają pozostać dostępne po wygaśnięciu tymczasowych adresów narzędziowych.
- [x] Ponownie odszukać ID w aktualnym arkuszu i uzupełnić `Co poprawiono` opisem rzeczywistego wyniku. Dla weryfikacji bez kodu napisać to wprost.
- [x] Uzupełnić `Weryfikacja / wersja`: URL/środowisko, commit lub wersja, data, viewport, scenariusz i wynik; jawnie oznaczyć testowe oferty w VHS-010. Nie przedstawiać testowych danych jako produkcyjnych.
- [x] Po sprawdzeniu, że screenshot i opis trafiły do właściwego ID, ustawić `Status = Do akceptacji`. Nie uzupełniać za klientkę `Akceptacja klientki`. Nie zamykać częściowo zrealizowanych wymagań.
- [x] Jeśli nie da się potwierdzić zachowania albo osadzić trwałego dowodu, pozostawić zadanie otwarte i opisać konkretny brak. Nie ogłaszać sukcesu wyłącznie na podstawie testu lub obecności kodu.

## 8. Końcowa weryfikacja i organizacja pracy

- [x] Po zmianach wykonać wymagane: `bun run typecheck`, `bun run test`, `bun run lint`, `bun run build`. Każda komenda musi zakończyć się kodem 0; błędy rozwiązać przed podsumowaniem zakończenia.
- [x] Wykonać `bun run images:check` dla zdjęcia VHS-040 oraz `bun run check:seo` po pełnym buildzie. Zachować publiczne CTA TripAhead i noindex admina.
- [x] Ponownie sprawdzić sześć stron publicznych, ze szczególnym uwzględnieniem współdzielonego FAQ i stopki.
- [x] Sprawdzić kompletność dowodów i wyników wszystkich 19 ID, brak przypadkowych zmian w pozostałych wierszach oraz poprawne stany akceptacji.
- [x] Przygotować końcowy diff do przeglądu. Sam ten plan nie zleca pushu, PR ani publikacji.

Proponowana kolejność: grupa 1, wspólne rozszerzenie FAQ z grupy 2, grupa 3, następnie grupy 4–6 i weryfikacja końcowa. Subagenci mogą realizować niezależne strony, ale jeden integrator odpowiada za `FaqSection.tsx`, `public-pages.test.tsx`, końcowe testy i zapisy do arkusza, aby uniknąć kolizji. Używać małych commitów odpowiadających grupom; każdy ID musi wskazywać wersję zawierającą jego zmianę.

## Pozostałe zgłoszenia

- **VHS-001, VHS-037:** zaakceptowane w mailu jako bez zmian; kontrola regresji bez ponownego otwierania.
- **Brak materiałów:** VHS-002, VHS-017, VHS-021, VHS-023, VHS-028, VHS-033, VHS-036, VHS-038, VHS-039, VHS-041, VHS-049. Nie wybieramy zastępczych zdjęć i nie dopisujemy brakujących odpowiedzi FAQ.
- **Decyzje/niejednoznaczne propozycje:** VHS-003, VHS-005, VHS-006, VHS-007, VHS-011, VHS-015, VHS-018, VHS-019, VHS-022, VHS-027, VHS-031, VHS-035, VHS-044, VHS-046, VHS-047, VHS-048, VHS-050. W szczególności nie zmieniamy palety ani nie wybieramy sposobu działania nowych karuzel. VHS-044 pokazuje napis nieobecny w aktualnym kodzie; nie zakładamy, że trzeba go odtworzyć.
- **VHS-020:** tylko zmiana etykiety na `CENA` jest samodzielnie możliwa, lecz pełne zgłoszenie obejmuje sekcje ubezpieczenia i transportu, których nie ma w `TripOfferContent`. Odkładamy całe ID do ustalenia treści i zakresu CMS; nie dodajemy pustych pozycji menu ani nie oznaczamy częściowego wyniku jako zakończenia.

## Akceptacja

Użytkownik zatwierdził zakres 17 poprawek oraz weryfikację VHS-008 i VHS-010. Następnie zatwierdził trwałe linki w obecnym arkuszu zamiast osadzonych obrazów. Akceptacja klientki pozostaje do uzupełnienia przez człowieka.

## Wynik wykonania

- Kod: `cbaa63f`, branch `fix/20261023`; niezależny przegląd bez uwag.
- Testy 447/447; typecheck, lint (0 błędów, 7 wcześniejszych ostrzeżeń Fast Refresh), build, images:check oraz check:seo zakończyły się kodem 0.
- Sprawdzono render sześciu stron publicznych na 1440 × 900 i 390 × 844 oraz wskazane szerokości dodatkowe. FAQ Enter/Space i focus CTA działają. Domyślne FAQ Eventy/Obozy/O nas ma nadal 16 px.
- Dwie/trzy oferty, 0/1 ofertę, długi tytuł i loading/error sprawdzono w tymczasowym lokalnym podglądzie bez zapisu do CMS. Screenshoty są oznaczone jako dane testowe.
- Reduced motion scrollerów potwierdzają istniejące testy komponentu; nie emulowano systemowej preferencji ruchu w przeglądarce.
- Kontakt: odstęp 32 px przy 320/390 i 46 px przy 640/1440. Dane kontaktowe na dowodach pochodzą z lokalnej konfiguracji testowej.
- [Dowody na Dysku](https://drive.google.com/drive/folders/1XhlwknGQfh1N_N8AYhl7zo1lhrS6Lszd): odnośniki przypisano po stabilnych ID. Odczyt zwrotny potwierdził treść i linki 19 zgłoszeń, bez zmian w pozostałych 31 pozycjach, oryginalnych zgłoszeniach i akceptacji klientki.
- Wcześniejszy `IMAGE` miał wygasający URL, a próbna formuła `HYPERLINK` błąd lokalizacji. Zastąpiono je natywnymi trwałymi hiperłączami tekstowymi. Żadna komórka dowodu z tej partii nie zawiera formuły ani błędu.
