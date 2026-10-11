# VHSBOARD Public UI Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poprawić nawigację tabletową, kontrast, fokus i drobne interakcje bez przebudowy wizualnej marki.

**Architecture:** Zmieniamy istniejące komponenty i semantyczne tokeny, zachowując Radix, routing i układ stron. CSS odpowiada za krótkie interakcje; obecny efekt karuzeli reaguje na preferencje ruchu i widoczność dokumentu. Proste zmiany wizualne sprawdzamy w browser, funkcjonalne regresje przez Vitest.

**Tech Stack:** React 19, Tailwind 4, CSS media queries, Radix Sheet/Dialog, Embla, Testing Library, Vitest.

**Spec:** [Wspólny zakres i kryteria](../specs/2026-10-09-site-quality-improvements.md).

## Global Constraints

- Treści i znaczące opisy alternatywne pozostają po polsku.
- Zachowujemy semantyczne tokeny OKLCH, zdjęcia, Bebas Neue i Barlow oraz obecny charakter marki.
- Zachowujemy zewnętrzne CTA TripAhead.
- Nie wdrażamy rezerwacji, zaliczek, płatności ani kont klientów.
- Każda zmiana aplikacji wymaga testów adekwatnych do zachowania, `bun run lint` i pełnego `bun run build`.

## Review Focus

- Tablet 640–1023 px nie może zgubić menu lub dostać scrolla poziomego — macierz viewportów w zadaniu 11.
- Menu po Escape oddaje fokus triggerowi; kliknięcie linku zamyka je — PublicChrome test w zadaniu 11.
- Gradient oraz hover CTA muszą być czytelne, nie tylko stan domyślny — pomiar stanów w zadaniu 12.
- Reduced motion włączone w trakcie sesji zatrzymuje timer; unmount usuwa listenery — HeroCarousel test w zadaniu 14.
- Urządzenie dotykowe i klawiatura muszą odkryć akcję bez hover — ręczny odbiór kart i topic selector w zadaniu 14.

---

## Mapa plików

| Pliki                                                                                                                                                                                        | Odpowiedzialność                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/components/public/PublicHeader.tsx`, `src/components/Brand.tsx`, `src/components/public/PublicChrome.test.tsx`                                                                          | Kompaktowy header, breakpoint i menu.                                            |
| `src/styles.css`, `src/components/ui/button.tsx` i użycia `bg-sunset-gradient`                                                                                                               | Kontrast i fallback focus.                                                       |
| `src/components/ui/{sheet,dialog}.tsx`, `src/components/public/HeroCarousel{,.test}.tsx`                                                                                                     | Krótkie overlay motion i cykl życia autoplay.                                    |
| `src/components/offers/{OfferCard,DayCampCard,OfferGallery}.tsx`, `src/components/home/HomeOfferCard.tsx`, `src/routes/index.tsx`, `src/components/events/EventUseCasesScroller{,.test}.tsx` | Touch/keyboard CTA, warunkowy hover i przewijanie bez ruchu przy reduced motion. |
| `src/routes/public-pages.test.tsx`, `docs/design-system.md`                                                                                                                                  | Zachowanie publicznej treści i reguły designu.                                   |

### Task 11: Header i nawigacja na tablecie

**Files:** Modify `PublicHeader.tsx`, `Brand.tsx`, `PublicChrome.test.tsx` z mapy. Istniejący `TripSectionNavigation.test.tsx` pozostaje testem regresji kotwic.

**Interfaces:** `PublicHeader(): ReactElement` i `Brand({className?, size?: 'default' | 'large'})` zachowują kontrakty. Atrybut `data-public-header` pozostaje dla pomiaru sticky offsets.

- [ ] W browser przed zmianą na 640 i 768 px sprawdzić przepełnienie i zmierzyć wysokość nagłówka. W PublicChrome dodać interakcję: open → Escape → trigger ma fokus; open → link Kontakt → menu jest zamknięte. Uruchomić test przed edycją; funkcjonalne przejście bazowe jest dopuszczalne, błąd wizualny udowadnia pomiar.
- [ ] Zmienić pełne menu/SocialLinks z `sm:flex` na `lg:flex`, trigger z `sm:hidden` na `lg:hidden`. W large Brand ustawić image 48×48 / size-12, usunąć mb-3 i użyć text-3xl; default Brand dla CMS zostaje. Zachować py-3: 48+24+1 px = 73 px nagłówka.
- [ ] Sprawdzić home, wyjazdy, szczegóły oferty i kontakt na 320/390/640/768/1024/1440 px: `document.documentElement.scrollWidth <= innerWidth`, zamknięty header height ≤73 px. Poniżej 1024 dostępne menu, od 1024 wszystkie linki mieszczą się. Przy 200% zoom nadal dostępna nawigacja i bez uciętych nazw.
- [ ] Uruchomić `bun run test -- src/components/public/PublicChrome.test.tsx src/components/offers/TripSectionNavigation.test.tsx`, typecheck, lint i pełny build. W browser aktywować kotwicę oferty: nagłówek sekcji nie jest zasłonięty, pomiar reaguje na resize.
- [ ] Commit: `fix: make public navigation fit tablet layouts`.

### Task 12: Kontrast CTA i widoczny fokus

**Files:** Modify `src/styles.css`, `src/components/ui/button.tsx`, `docs/design-system.md`, `src/components/offers/DayCampCard.tsx`, `src/routes/{wyjazdy,obozy}.$slug.tsx` oraz `src/routes/kontakt.tsx`. Dekoracyjne gradienty w OfferCard/HomeOfferCard pozostają bez zmian.

**Interfaces:** Tokeny zachowują nazwy. `--primary` i `--ring` stają się `oklch(0.56 0.17 42)`. Przy gradientowych etykietach foreground to istniejący `--sunset-foreground`, bez zmiany dekoracyjnego gradientu.

- [ ] Zapisać kontrast obecnego CTA i gradientowego badge oraz przejście Tab na logo, menu, kartę, FAQ, kontakt. Oczekiwana bazowa porażka: mały jasny tekst CTA <4,5:1 i brak fallback outline na części linków. Nie dodawać testów sprawdzających dosłowne klasy CSS.
- [ ] Zmienić tokeny primary/ring, etykiety gradientowe i tekst na gradientowej sekcji kontaktu na sunset-foreground. Usunąć `*:focus {outline:none}`; w base dodać `:where(a,button,input,select,textarea,[tabindex]):focus-visible` z outline 2 px solid var(--ring), offset 3 px. Istniejące prawidłowe focus-visible ring mogą go zastąpić. Na ciemnych zdjęciach stosować ring kontrastujący i offset, aby fokus nie ginął w tle.
- [ ] Zmierzyć computed kolory normal/hover/focus dla primary, outline, secondary, tekstowego linku i gradientu na home/kartach/detalach/CMS. Minimalnie tekst 4,5:1 lub 3:1 dla dużego, fokus 3:1. Na jasnym primary wyliczenie startowe wynosi około 4,87:1; przeglądarka i rzeczywiste stany rozstrzygają. Jeśli opacity hover łamie próg, użyć jednolitego ciemniejszego tła zamiast blend przez opacity.
- [ ] Przejść całą nawigację klawiaturą: widać fokus, bez podwójnych ringów i ucięć przez overflow/clip-path. Sprawdzić również auth/editor CMS po globalnej zmianie. Uruchomić testy PublicChrome, typecheck, lint i pełny build; zaktualizować tabelę tokenów w design-system.
- [ ] Commit: `fix: improve CTA contrast and keyboard focus`.

### Task 14: Press, hover, reduced motion i touch

**Files:** Modify `src/styles.css`, `src/components/ui/{button,sheet,dialog}.tsx`, `src/components/public/HeroCarousel{,.test}.tsx`, `src/components/offers/{OfferCard,DayCampCard,OfferGallery}.tsx`, `src/components/home/HomeOfferCard.tsx`, `src/routes/index.tsx`, `src/components/events/EventUseCasesScroller{,.test}.tsx`. Obecne testy kart zachować.

**Interfaces:** HeroCarousel nadal przyjmuje `{images: readonly PortalCarouselImage[]}`. Autoplay pozostaje co 7000 ms wyłącznie przy ≥2 obrazach, widocznym dokumencie i braku reduced motion. Publiczny kontrakt przycisków/galerii nie zmienia się.

- [ ] Dodać HeroCarousel testy fake timers: toggle media query false→true zatrzymuje scrollNext; true→false wznawia pojedynczy timer; hidden dokument zatrzymuje timer i visible wznawia; unmount usuwa interval oraz change/visibilitychange listeners. Uruchomić test pliku; nowe przypadki mają FAIL.
- [ ] W EventUseCasesScroller testować Enter na przycisku oraz reduced motion: `scrollBy` dostaje `{left: +/- clientWidth * 0.8, behavior: 'auto'}`; normalny pointer bez reduced motion nadal używa smooth. Uruchomić test pliku; nowe przypadki mają FAIL.
- [ ] Rozszerzyć obecny efekt karuzeli o listener MediaQueryList change i document visibilitychange. Funkcja wewnątrz efektu zawsze kasuje poprzedni timer przed ewentualnym startem. Cleanup usuwa oba listenery i timer; w reduced motion karuzela pozostaje statyczną dekoracją.
- [ ] W EventUseCasesScroller lokalne `scroll(direction: 1 | -1, instant: boolean): void` wybiera auto, gdy instant lub matchMedia reduced motion; click przekazuje `event.detail === 0` jako instant dla aktywacji klawiaturą. Nie zmieniać szerokości kroku ani natywnego poziomego scrolla.
- [ ] Button dostaje press scale(.98), transition transform 160 ms ease-out tylko gdy enabled. Ruch hover kart/zdjęć zamknąć w media `(hover:hover) and (pointer:fine)`; reduced motion wyłącza same scale/translate, nie tylko transition. Zachować dostępne focus states; nie dodawać dekoracyjnych animacji scroll ani bibliotek motion.
- [ ] Topic selector przestaje animować inline-size/padding/max-block-size. Istniejące compact/expanded rozmiary mogą przełączać się natychmiast; opis używa opacity/transform 160 ms. Dla focus-visible treść pojawia się natychmiast bez przesunięcia. Dla coarse pointer opis i CTA są stale widoczne; karty otwierają ofertę przy pierwszym tapie. Poprawić gallery `transition-all` na konkretne properties.
- [ ] Sheet/dialog: wejście 200 ms ease-out, wyjście 150 ms; reduced motion bez slide/zoom, opcjonalne krótkie opacity. Zamienić widoczną dla czytnika etykietę zamknięcia Sheet `Close` na `Zamknij`. Radix zachowuje focus trap, Escape i focus restoration.
- [ ] Uruchomić testy HeroCarousel, PublicChrome oraz kart, typecheck, lint i pełny build. Browser: hover i rapid clicks nie powodują skoków; reduced motion również po zmianie preferencji blokuje ruch; coarse pointer nie wymaga pierwszego tap do reveal. Tab pokazuje CTA bez opóźnienia. Disabled button nie skaluje się i nie wywołuje akcji.
- [ ] Commit: `fix: respect motion and touch interaction preferences`.

### Task 17: Usunięcie dekoracyjnych etykiet sekcji

**Files:** Modify `src/routes/index.tsx`; Test regression `src/routes/public-pages.test.tsx`.

**Interfaces:** `entryPoints` zachowuje to/title/text/action/image/imageAlt. Usuwa pole eyebrow i odpowiadający mu element p; nagłówki pozostają h3 pod h2 sekcji.

- [ ] Wykonać bazową inspekcję sekcji: obecne trzy etykiety 01/02/03. Usunąć pole eyebrow, jego destructuring i p; zlikwidować zbędny mt-3 na h3, aby nie zostawić pustej przestrzeni.
- [ ] Sprawdzić 390 i 1440 px: brak całych etykiet, zachowane tytuły Wyjazdy/Eventy/Obozy, opisy i akcje z tymi samymi URL. Klawiatura/touch nadal pokazują całość zgodnie z zadaniem 14. Nie usuwać znaczących eyebrow z innych sekcji.
- [ ] Uruchomić `bun run test -- src/routes/public-pages.test.tsx`, typecheck, lint i pełny build. Bez dodatkowych testów odtwarzających prostą zmianę copy.
- [ ] Commit: `design: remove numbered homepage section labels`.
