# Poprawki klientki 2026-10-27 — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Użytkownik zatwierdził plan i implementację 27.10.2026. Kod wykonany; odbiór czeka na osadzenie obrazów w komórkach.

**Goal:** Zrealizować i udokumentować osiem wybranych zgłoszeń klientki: VHS-003, VHS-005, VHS-008a, VHS-010, VHS-012, VHS-018 — menu, VHS-023a i VHS23-b.

**Architecture:** Zmiany w istniejącym frontendzie React, z natywnym scrollerem ofert i osobną sekcją innych opublikowanych wyjazdów. Zachowujemy model CMS, publiczne repozytorium Supabase, obecny routing i statyczny deploy. Kod listy innych ofert nie blokuje loadera szczegółów.

**Tech Stack:** React 19, TypeScript, TanStack Router/Query, Tailwind CSS 4, istniejące Radix UI, Vitest/Testing Library, Bun, Supabase.

**Spec:** [Zakres i zachowanie do akceptacji](2026-10-27-client-feedback-design.md), [AGENTS.md](../../AGENTS.md), [design system](../design-system.md), [architektura](../architecture.md).

**Wynik:** [raport weryfikacji i dowody](2026-10-27-client-feedback-verification.md). Wersja aplikacji `7a8af20`; testy i pełny build przechodzą. Statusy nadal `W trakcie`, ponieważ brakuje obrazów osadzonych w komórkach. Checklisty obejmujące odbiór nie oznaczają zamkniętych zadań.

**Branch:** lokalne `fix/20261027`, utworzone z pobranego 27.10.2026 `origin/main` = `3f95fd15fdf664b1688cb3b3cdac799dc24999bc`. Docelowa referencja zdalna: `origin/fix/20261027`. Gałąź nie jest jeszcze wypchnięta.

## Global Constraints

- Bez nowych zależności, migracji Supabase i zmian CMS/RLS.
- Zachowujemy routing, publiczne zapytania tylko o opublikowane oferty oraz osobne zapytania podglądu administratora.
- Zapisy prowadzą do istniejącego `offer.bookingUrl` w TripAhead. Bez formularza rezerwacji ani płatności w VHSBOARD.
- Polskie teksty, semantyczne tokeny, Barlow i Bebas Neue, `ResponsiveImage` dla fotografii repozytorium, widoczny focus i reduced motion.
- Poza pakietem: VHS-018 Galeria, VHS-019 uppercase, VHS-020 nowe pozycje menu, pozostałe zgłoszenia i materiały.
- Implementacja dopiero po akceptacji specyfikacji i tego planu. Plan nie zleca pushu, PR ani publikacji.
- Reguły responsywności: mobile < 768 px, tablet 768–1023 px, desktop od 1024 px. Dolne CTA działa poniżej 1024 px.
- Wynik każdego ID wymaga zachowania w przeglądarce, rzeczywistego screenshota i opisu wersji w aktualnym wierszu trackera.

## Review Focus

1. Czwarta i kolejne oferty: nie mogą zniknąć przez dawny limit trzech, błąd przewijania lub zmianę szerokości. Zadanie 4, test selekcji i scenariusz resize.
2. Jasne zdjęcia i długie teksty: lokalne panele muszą zachować kontrast, mieścić pełny tekst i odsłaniać fotografię. Zadania 1–2, pomiary i screenshoty.
3. Wspólne komponenty: stałe CTA strony głównej i większe menu wyjazdów nie mogą zmienić list ofert, galerii ani menu obozów. Zadania 3 i 6, regresja komponentów i tras.
4. Wąski ekran, safe area, cookies i modal: dolne CTA nie zasłania ostatniej treści ani elementów prywatności i nie akceptuje wadliwego URL. Zadanie 7, testy adresu i rzeczywista obsługa nakładek.
5. Pusta/błędna lista innych ofert i podgląd administratora: szczegóły nadal działają, brak bieżącej oferty, obozów i szkiców w poleceniach. Zadanie 8, test selekcji i izolacji zapytań.

## Mapa plików i odpowiedzialności

| Plik                                                    | Odpowiedzialność i zmiana                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/routes/index.tsx`                                  | Lokalny panel hero, mobilna zawartość i warstwy kafelków kategorii.                 |
| `src/styles.css`                                        | Wyłącznie mobilny układ paneli kategorii; zachowanie istniejących reguł desktop.    |
| `src/components/home/HomeOfferCard.tsx`                 | CTA zawsze widoczne, wysokość karty/linku dopasowana do rzędu.                      |
| `src/lib/offers/home-offers.ts`                         | Usunięcie limitu trzech z selekcji najbliższych ofert.                              |
| `src/components/home/HomeUpcomingOffersSection.tsx`     | Stany listy i przekazanie wybranych ofert do nowego układu.                         |
| `src/components/home/HomeOffersList.tsx` — nowy         | Jedna lista DOM: siatka lub responsywny scroller, sterowanie i granice przewijania. |
| `src/components/home/HomeContactCta.tsx`                | Usunięcie jednego końcowego linku.                                                  |
| `src/components/offers/TripSectionNavigation.tsx`       | Opcjonalna klasa linków do powiększenia menu tylko wyjazdów.                        |
| `src/lib/offers/booking-url.ts` — nowy                  | Wspólny strażnik HTTPS dla dotychczasowego i mobilnego CTA.                         |
| `src/components/offers/OfferFacts.tsx`                  | Użycie wspólnego strażnika bez zmiany wyglądu i reguł istniejącego CTA.             |
| `src/components/offers/MobileTripBookingCta.tsx` — nowy | Stały pasek „Zapisz się” i odpowiadająca mu rezerwa miejsca.                        |
| `src/lib/offers/related-trips.ts` — nowy                | Wybór do trzech innych najbliższych wyjazdów z publicznej listy.                    |
| `src/components/offers/RelatedTripsSection.tsx` — nowy  | Niezależne zapytanie, istniejące `OfferCard`, stany sekcji innych wyjazdów.         |
| `src/routes/wyjazdy.$slug.tsx`                          | Większe menu, mobilny pasek oraz sekcja innych wyjazdów po galerii.                 |

Testy modyfikowane lub dodawane wskazano przy zadaniach. Nie zmieniamy `query-options.ts`, publicznego repozytorium, `OfferCard.tsx`, modelu ofert ani trasy obozów.

## 1. VHS-003 — hero bez filtra fotografii

**Files:** modify `src/routes/index.tsx`; regression `src/components/public/HeroCarousel.test.tsx`, `src/routes/public-pages.test.tsx`.

**Interfaces:** dotychczasowe `HeroCarousel({ images })`, konfiguracja karuzeli i fallback bez zmian.

- [ ] Usunąć pełny overlay `bg-foreground/55` w hero głównej; nie zmieniać overlayów na innych stronach. Dodać pod istniejącą grupą tekstów lokalny panel o wartościach ze specyfikacji.
- [ ] Uruchomić `bun run test -- src/components/public/HeroCarousel.test.tsx src/routes/public-pages.test.tsx`; oczekiwane PASS. Nie dodawać testu, który wyłącznie sprawdza obecność klasy CSS.
- [ ] W przeglądarce obejrzeć każdy aktualny slajd i fallback przy 390 × 844 i 1440 × 900. Potwierdzić brak pełnego filtra oraz kontrast tekstu co najmniej 4,5:1 dla zwykłego i 3:1 dla dużego tekstu; sprawdzić focus i reduced motion.
- [ ] Zapisać dowody VHS-003 i commit ograniczony do tego zadania, np. `fix: brighten homepage hero photos (VHS-003)`.

## 2. VHS-005 — kompaktowe panele kategorii mobile

**Files:** modify `src/routes/index.tsx`, `src/styles.css`; regression `src/routes/public-pages.test.tsx`.

**Interfaces:** `entryPoints`, ich teksty, `to`, `ResponsiveImage` i cały kafelek jako `Link` pozostają bez zmian.

- [ ] Przy < 768 px ukryć wizualny podpis akcji i strzałkę; schować pełny gradient fotografii. W istniejącym mobilnym media query ustawić panel według specyfikacji: max. 384 px, boczne odstępy min. 20 px, dół 16 px, symetryczne paddingi, wyśrodkowanie, lokalny blur i ciemne tło. Uwzględnić obecny `py-8`, aby padding rodzica nie dodawał drugiego dolnego odstępu.
- [ ] Zachować reguły skosów i rozwijania od 768 px oraz obniżenie paneli od 1024 px. Nie dodawać testów klas udających odbiór layoutu.
- [ ] Uruchomić `bun run test -- src/routes/public-pages.test.tsx`; oczekiwane PASS. Sprawdzić trzy działające linki i polskie alty.
- [ ] Obejrzeć 320/390 px, granicę 767/768 px i desktop 1440 px, także z klawiaturą i reduced motion. Screenshoty mają pokazać wszystkie trzy panele, tekst bez ucięć i odsłonięte zdjęcia.
- [ ] Zapisać dowody VHS-005; commit `fix: compact mobile category captions (VHS-005)`.

## 3. VHS-008a — stałe CTA na kartach głównej

**Files:** modify `src/components/home/HomeOfferCard.tsx`; regression `src/components/home/HomeOfferCard.test.tsx`, `src/components/offers/OfferCard.test.tsx`.

**Interfaces:** `HomeOfferCard({ offer }: { offer: PublicOffer })` i oba adresy szczegółów pozostają bez zmian.

- [ ] Usunąć `offer-card-action` tylko z CTA `HomeOfferCard`, zachowując wygląd przycisku. Pozostawić wspólne reguły CSS dla `OfferCard` i galerii. Nie wprowadzać zagnieżdżonego przycisku/linku.
- [ ] Uruchomić `bun run test -- src/components/home/HomeOfferCard.test.tsx src/components/offers/OfferCard.test.tsx`; oczekiwane PASS, w tym brak CTA i linku dla zakończonej karty.
- [ ] Przy 1024/1440 px, fine pointer i kursorem poza kartą potwierdzić `opacity = 1` i brak przesunięcia tekstu CTA; kliknąć kartę oraz przejść do niej Tab/Enter. Sprawdzić też 390 px i obie kategorie ofert.
- [ ] Zapisać dowody VHS-008a; commit `fix: keep homepage offer actions visible (VHS-008a)`.

## 4. VHS-010 — wszystkie terminy i karuzela desktop

**Files:** modify `src/lib/offers/home-offers.ts`, `src/lib/offers/home-offers.test.ts`, `src/components/home/HomeUpcomingOffersSection.tsx`, `src/components/home/HomeUpcomingOffersSection.test.tsx`, `src/components/home/HomeOfferCard.tsx`; create `src/components/home/HomeOffersList.tsx`, `src/components/home/HomeOffersList.test.tsx`.

**Interfaces:** `selectUpcomingHomeOffers(offers: PublicOffer[], today: string): PublicOffer[]` zwraca wszystkie pasujące oferty; usuwamy parametr `limit`. `HomeOffersList({ offers }: { offers: PublicOffer[] })` otrzymuje już posortowaną listę, bez pobierania danych. Sekcja zachowuje obecne propsy.

- [ ] Zmienić istniejący test selekcji na oczekiwanie wszystkich pięciu przyszłych ofert: `Dzisiaj`, `Alfa`, `Zeta`, `Obóz wake`, `Później`; miniony i bez daty odrzucone. Dodać asercję, że kolejność tablicy wejściowej się nie zmienia. Uruchomić `bun run test -- src/lib/offers/home-offers.test.ts`; oczekiwane FAIL przez limit trzech.
- [ ] Usunąć `.slice(0, limit)` i parametr `limit`; zachować filtr, datę Warszawy i sortowanie. Ponownie uruchomić ten test; oczekiwane PASS.
- [ ] Dodać testy sekcji/listy dla 0/1/3/4/6 ofert: czwarta i szósta mają działające linki, przy trzech nie ma kontrolek karuzeli, loading/error nie pokazują starych kart. Test sterowania na zamockowanych wymiarach: początek → środek → koniec, wyłączone strzałki, aktualizacja po resize, przesunięcie o szerokość karty + 24 px; `event.detail === 0` lub reduced motion daje `behavior: "auto"`, kliknięcie wskaźnikiem przy dozwolonym ruchu `"smooth"`. Uruchomić nowe testy i potwierdzić FAIL przed implementacją.
- [ ] Zbudować `HomeOffersList`: jeden `ul/li`, dotychczasowa siatka do trzech ofert, przy 4+ od 1024 px flex + overflow-x-auto + scroll snap i po trzy karty w obszarze listy. Strzałki tylko na desktopie; stan granic aktualizowany po scroll, resize i zmianie ofert. Rejestrowane obserwatory/listenery czyszczone przy unmount. Bez autoplay, pętli i zmiany wspólnego `ui/carousel.tsx`.
- [ ] Zapewnić `h-full` linku i artykułu `HomeOfferCard`, aby długi tytuł nie rozrywał wyrównania rzędu. Przy focusie odsłaniać kartę tylko poziomo, natychmiast; nie używać `scrollIntoView` powodującego pionowy skok całej strony. Po przejściu na tablet/mobile zresetować pozostały poziomy scroll.
- [ ] Uruchomić `bun run test -- src/lib/offers/home-offers.test.ts src/components/home/HomeUpcomingOffersSection.test.tsx src/components/home/HomeOffersList.test.tsx src/components/home/HomeOfferCard.test.tsx`; oczekiwane PASS.
- [ ] Na jawnych fixture'ach sprawdzić 0/1/2/3/4/6 ofert, długi tytuł, loading/error; 390/768/1024/1440 px, przejście desktop → mobile → desktop, Tab do ostatniej karty i z powrotem, strzałki i reduced motion. Dowody VHS-010 mają obejmować początek i koniec karuzeli oraz pionowy mobile. Nie zapisywać fixture'ów do CMS.
- [ ] Commit `feat: scroll all upcoming offers on desktop (VHS-010)`.

## 5. VHS-012 — jeden przycisk w kontakcie głównej

**Files:** modify `src/components/home/HomeContactCta.tsx`, `src/routes/public-pages.test.tsx`.

**Interfaces:** `HomeContactCta()` nadal bez propsów; przycisk `/kontakt` i cała treść pozostają.

- [ ] W istniejącym teście końcowego CTA zamienić asercję wymagającą linku „Zobacz wyjazdy” na `queryByRole(...).not.toBeInTheDocument()`, ograniczoną przez `within(contactSection)`. Uruchomić `bun run test -- src/routes/public-pages.test.tsx`; oczekiwane FAIL na obecnym linku.
- [ ] Usunąć ten link z `HomeContactCta`; nie usuwać CTA o tym samym tekście z hero i stanów listy.
- [ ] Ponowić test; oczekiwane PASS. Na 390/1440 px sprawdzić działanie „Napisz do nas” oraz brak pustego miejsca po linku. Zapisać dowód VHS-012; commit `fix: simplify homepage contact action (VHS-012)`.

## 6. VHS-018 — większe menu wyjazdu

**Files:** modify `src/components/offers/TripSectionNavigation.tsx`, `src/routes/wyjazdy.$slug.tsx`; regression `src/components/offers/TripSectionNavigation.test.tsx`, `src/routes/wyjazdy.$slug.test.tsx`, `src/routes/obozy.$slug.test.tsx`.

**Interfaces:** opcjonalne `linkClassName?: string` w propsach `TripSectionNavigation`, składane przez obecne `cn`; domyślnie bez zmiany. Tylko trasa wyjazdu przekazuje `linkClassName="lg:text-lg"`.

- [ ] Dodać opcjonalną klasę i przekazać ją w trasie wyjazdu. Zachować nazwy sekcji, ich kotwice, pomiar `--trip-nav-height`, `--trip-header-height`, resize, aktywną sekcję i focus. Nie rozszerzać tego zadania o uppercase ani galerię.
- [ ] Uruchomić `bun run test -- src/components/offers/TripSectionNavigation.test.tsx 'src/routes/wyjazdy.$slug.test.tsx' 'src/routes/obozy.$slug.test.tsx'`; oczekiwane PASS, szczególnie bezpośredni hash po załadowaniu fontów i zmiana wysokości.
- [ ] Zmierzyć w przeglądarce 14 px przy 390/768/1023 px oraz 18 px przy 1024/1440 px na wyjeździe; kontrolnie menu obozu pozostaje 14 px. Kliknąć kotwice, wejść przez URL z hashem i sprawdzić dłuższe etykiety. Nagłówki i aside nie nachodzą na sticky menu.
- [ ] Zapisać dowody pod VHS-018 + `Typografia`, nie pod zdublowanym zgłoszeniem galerii. Commit `fix: enlarge desktop trip section labels (VHS-018)`.

## 7. VHS-023a — mobilne „Zapisz się”

**Files:** create `src/lib/offers/booking-url.ts`, `src/components/offers/MobileTripBookingCta.tsx`, `src/components/offers/MobileTripBookingCta.test.tsx`; modify `src/components/offers/OfferFacts.tsx`, `src/routes/wyjazdy.$slug.tsx`, `src/routes/wyjazdy.$slug.test.tsx`.

**Interfaces:** `isValidBookingUrl(value: string): boolean` przenosi obecną regułę HTTPS z `OfferFacts`. `MobileTripBookingCta({ bookingUrl }: { bookingUrl: string })` renderuje pasek i spacer tylko dla poprawnego URL. Nie dodaje logiki rezerwacji ani nowych reguł dat oferty.

- [ ] Dodać testy: prawidłowy HTTPS → „Zapisz się” z dokładnym URL, `_blank` i `noopener noreferrer`; `http:`, `javascript:`, pusty i nieparsowalny adres → brak linku oraz rezerwy. Uruchomić `bun run test -- src/components/offers/MobileTripBookingCta.test.tsx`; oczekiwane FAIL przed implementacją.
- [ ] Przenieść istniejącą walidację do `booking-url.ts`, użyć w obu komponentach. Dodać komponent: spacer 80 px + safe area i dolny pasek `fixed`, `lg:hidden`, `z-30`, przycisk 48 px i padding 12 px. Spacer też `lg:hidden` i `shrink-0`.
- [ ] Zamontować go po `PublicFooter` w korzeniu szczegółów wyjazdu, aby rezerwa chroniła również dolne linki stopki. Po zmianie sluga pasek ma otrzymać aktualny URL; nie dodawać go do `/obozy/:slug`.
- [ ] Dodać integracyjny test właściwego adresu na trasie i jego aktualizacji po przejściu na inny wyjazd. Uruchomić `bun run test -- src/components/offers/MobileTripBookingCta.test.tsx src/components/offers/OfferCard.test.tsx 'src/routes/wyjazdy.$slug.test.tsx'`; oczekiwane PASS, także dotychczasowy test `OfferFacts` odrzucający HTTP.
- [ ] Sprawdzić 320/390/768/1023/1024 px, przewijanie od hero po stopkę, focus, safe area w obsługiwanej przeglądarce, cookies przed decyzją i po decyzji, ustawienia cookies, galerię oraz otwarte menu. Baner/dialog pozostaje nad paskiem i w pełni obsługiwalny. Pasek nie przykrywa treści po doscrollowaniu; desktop nie ma paska ani spaceru.
- [ ] Zweryfikować handoff do dokładnego `bookingUrl`, bez wysyłania rezerwacji. Zapisać dowody VHS-023a; commit `feat: keep trip registration handy on mobile (VHS-023a)`.

## 8. VHS23-b — inne wyjazdy na końcu oferty

**Files:** create `src/lib/offers/related-trips.ts`, `src/lib/offers/related-trips.test.ts`, `src/components/offers/RelatedTripsSection.tsx`, `src/components/offers/RelatedTripsSection.test.tsx`; modify `src/routes/wyjazdy.$slug.tsx`, `src/routes/wyjazdy.$slug.test.tsx`.

**Interfaces:** `selectRelatedTrips(offers: PublicOffer[], currentOfferId: string, today: string): TripOffer[]` → maks. trzy wyjazdy, według reguł specyfikacji i nowej nieobcinającej selekcji z zadania 4. `RelatedTripsSection({ currentOfferId }: { currentOfferId: string })` → `useQuery(publishedOffersQueryOptions("trip"))` i istniejące `OfferCard({ offer: TripOffer })`. Nie przyjmuje danych z repozytorium admina.

- [ ] Dodać test selekcji: wejście z aktualnym ID, innymi wyjazdami, obozem, minionym terminem i brakiem daty; oczekiwane trzy najbliższe inne wyjazdy w kolejności data/tytuł, w tym start dzisiaj; bez mutacji wejścia, wynik 0/1/2 gdy tyle pasuje. Uruchomić `bun run test -- src/lib/offers/related-trips.test.ts`; oczekiwane FAIL przed implementacją.
- [ ] Zaimplementować selekcję: `selectUpcomingHomeOffers(offers, today)` z zadania 4, następnie `.filter((offer): offer is TripOffer => offer.offerKind === "trip" && offer.id !== currentOfferId)` i końcowe `.slice(0, 3)`. Jawny type guard po wspólnej selekcji zapewnia wynik `TripOffer[]`. Nie dodawać osobnego sortowania ani zapytania do bazy.
- [ ] Dodać testy sekcji: właściwe karty i `/wyjazdy`, trzy szkielety w loading, sam link bez nagłówka przy pustej liście, komunikat i link po błędzie. Zamockować publiczne repozytorium i potwierdzić argument `"trip"`; podgląd szczegółów nadal korzysta z osobnego klucza administratora i nie zasila listy poleceń. Uruchomić testy nowego komponentu; oczekiwane FAIL przed implementacją.
- [ ] Zbudować sekcję według specyfikacji; zapytanie niezależne od loadera szczegółów. Zamontować na końcu `main`, po wszystkich warunkowych blokach zakwaterowania i galerii. Kafelki w siatce 1/2/3 kolumny; bez kolejnej karuzeli.
- [ ] Rozszerzyć test trasy o położenie sekcji po galerii/przed stopką oraz działające szczegóły i CTA mimo błędu listy. W istniejącym mocku publicznego repozytorium dodać `listPublishedOffers` z domyślnym `[]`, aby dawne testy nie wykonywały realnych zapytań. Obsłużyć również wariant bez galerii/zakwaterowania.
- [ ] Uruchomić `bun run test -- src/lib/offers/related-trips.test.ts src/components/offers/RelatedTripsSection.test.tsx 'src/routes/wyjazdy.$slug.test.tsx' src/routes/offer-preview-navigation.test.ts`; oczekiwane PASS.
- [ ] Sprawdzić 390/1024/1440 px: kolejność sekcji, linki kart, 0/1/3/4+ kandydatów, brak zdjęcia, długi tytuł i błąd pobrania. Bez błędów JS przy zmianie sluga. Kontrola publicznego filtra `published` pozostaje objęta istniejącymi testami repozytorium.
- [ ] Zapisać dowody pod dokładnym ID `VHS23-b`; commit `feat: suggest other trips after offer details (VHS23-b)`.

## 9. Pełna weryfikacja i dowody w trackerze

- [ ] Odczytać aktualny tracker przed rozpoczęciem realizacji, potwierdzić opis po ID i dla VHS-018 także kategorię. Status `W trakcie` ustawiać dopiero przy faktycznym rozpoczęciu, nie przy planowaniu.
- [ ] Każdy wynik powyżej sprawdzić w rzeczywistej przeglądarce i zapisać screenshot właściwego fragmentu. Fixture'y muszą być jawnie opisane jako testowe, z zamrożoną datą i bez zapisów do CMS. Zachować oryginalne zgłoszenia i `Przed`.
- [ ] Uruchomić wymagane `bun run typecheck`, `bun run test`, `bun run lint`, `bun run build`. Każde musi zakończyć się kodem 0; błędu środowiska nie opisywać jako udanego testu. Po buildzie `bun run check:seo`, dodatkowo `bun run images:check`.
- [ ] Sprawdzić publiczne strony `/`, `/wyjazdy`, `/eventy`, `/obozy`, `/o-nas`, `/kontakt`, detale wyjazdu i kontrolny obóz. Potwierdzić brak poziomego overflow całej strony i brak niezamierzonych zmian poza pakietem; przewijanie lokalnego rzędu ofert jest celowe.
- [ ] Przygotować w folderze projektu na Dysku podfolder dowodów tej partii. Nazwy `VHS-003-after-desktop-1440.png`, `VHS-018-menu-after-desktop-1440.png` itd. Screenshoty mają pozostać dostępne klientce, bez wygasających URL narzędziowych.
- [ ] Bezpośrednio przed każdym zapisem do trackera ponownie znaleźć aktualny wiersz po ID; dla VHS-018 sprawdzić `Szczegóły wyjazdu` + `Typografia`. Nie polegać na zapisanym numerze wiersza. Zachować wcześniejsze dowody VHS-010/VHS-012 i dopisać nową wersję.
- [ ] Osadzić główny screenshot w `Po / dowód` i podlinkować dodatkowe viewporty z tego samego wiersza, zachowując dotychczasowe trwałe linki. Jeżeli nie można osadzić trwałego dowodu, opisać brak i pozostawić zadanie otwarte; nie przenosić automatycznie wyjątku dla partii 23.10 na nową partię.
- [ ] Uzupełnić `Co poprawiono` i `Weryfikacja / wersja`: data, realny URL i środowisko, viewport, scenariusz, wynik, commit zawierający zmianę. Lokalnie pisać `LOKALNIE — niewdrożone`.
- [ ] Dopiero po komplecie dowodów ustawić osiem zadań na `Do akceptacji`; nie zmieniać `Akceptacja klientki` ani oznaczać częściowego wyniku jako zakończonego.
- [ ] Przejrzeć końcowy diff pod kątem zakresu i wyżej opisanych pięciu ryzyk; przekazać wynik oraz listę ewentualnych braków. Push, PR, merge i produkcyjny deploy pozostają osobnymi krokami.

## Kolejność i przegląd planu

Zadania 1–8 realizować kolejno w bieżącym wątku, z osobnymi commitami po sprawdzeniu danego rezultatu. Zadanie 8 korzysta z selekcji zmienionej w zadaniu 4. Zadania 6–8 dotykają tej samej trasy, dlatego wykonujemy je sekwencyjnie. Zrzuty i opisy gromadzimy przy każdym zadaniu, a kompletność wyników kontrolujemy w zadaniu 9.

Plan sprawdzono względem ośmiu zgłoszeń i aktualnego kodu bazowego: każde ID ma pliki, kryterium odbioru i dowód; nie włączono zdublowanego VHS-018 Galeria. W tym etapie nie uruchamiano testów aplikacji ani nie wykonano kodu produktu. Po akceptacji przed implementacją należy sprawdzić, czy `origin/main` nie przesunął się ponownie; ewentualną aktualizację bazy wykonać świadomie, zachowując dokumentację i podając nowy SHA.
