# FAQ, galeria i Kontakt — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ujednolicić FAQ, usprawnić oglądanie zdjęć i odtworzyć pas dyscyplin na Kontakt.

**Architecture:** Lokalne zmiany wspólnego FAQ i OfferGallery oraz dekoracyjny ContactDisciplines. Istniejący Radix Dialog zapewnia modalność; galeria samodzielnie obsługuje wybór zdjęcia i nawigację.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Radix UI, Vitest, Playwright do weryfikacji przeglądarkowej.

**Spec:** [Zaakceptowany zakres](2026-10-27-faq-gallery-contact-design.md).

## Global Constraints

- Bez nowych zależności, zmian CMS/Supabase i zmian treści FAQ.
- Desktop FAQ od 1024 px: 20/18 px; mobile: 16/16 px.
- Galeria bez brązowego panelu, z ramką 1 px, czarnym tłem strony, nawigacją zapętloną i kontrolkami min. 44 × 44 px.
- Kontakt: dekoracja SNOW / SKATE / SKIM / SURF, desktop cztery kolumny, poniżej 1024 px układ 2 × 2.
- Wymagane typecheck, test, lint, build oraz screenshoty rzeczywistego działania.

## Review Focus

- Zamknięcie modalu po nawigacji musi przywracać focus do pierwotnej miniatury.
- Brak URL lub zmieniona lista zdjęć nie mogą zostawić pustego, blokującego modalu.
- Pionowe zdjęcie i mała wysokość ekranu nie mogą zasłaniać kontrolek.
- Dwie galerie na jednej stronie muszą nawigować niezależnie.
- Pas Kontakt nie może powodować poziomego scrolla ani zasłaniać dokumentów w żadnym stanie ich ładowania.

### Task 1: Jednolity FAQ

**Files:** `src/components/public/FaqSection.tsx`, `src/routes/wyjazdy.index.tsx`.
**Interfaces:** zachować `FaqSectionProps`, usuwając tylko `desktopTypography`; wszystkie istniejące użycia otrzymują wspólne rozmiary.

- [x] Usunąć wariant i ustawić `lg:text-xl` na pytaniach, `lg:text-lg` na odpowiedziach.
- [x] Uruchomić `bun run test src/components/public/FaqSection.test.tsx`; oczekiwany PASS. Nie dodawać testu powtarzającego klasy dla tej zmiany wizualnej.
- [x] W przeglądarce porównać obliczone font-size otwartych odpowiedzi na czterech stronach przy 390 i 1440 px; zrobić screenshoty.
- [x] Commit `fix: unify FAQ typography across public pages`.

### Task 2: Podgląd galerii

**Files:** `src/components/offers/OfferGallery.tsx`, nowy `src/components/offers/OfferGallery.test.tsx`.
**Interfaces:** publiczne props `images: OfferImage[], title?, description?, id?` bez zmian; stan wyboru po stabilnym ID zdjęcia, nie według zapamiętanego obiektu.

- [x] Napisać testy: otwórz drugą miniaturę, następne/poprzednie i zapętlenie, klawiatura, licznik, Escape i powrót focusu, pojedyncze zdjęcie bez strzałek, pominięte null URL, zmieniona lista i niezależne galerie.
- [x] Uruchomić `bun run test src/components/offers/OfferGallery.test.tsx`; oczekiwany RED dla brakującej nawigacji.
- [x] W istniejącym komponencie dodać strzałki ChevronLeft/Right, licznik live, obsługę klawiszy i jawną referencję do otwierającego przycisku dla focusu. Zmienić wyłącznie styl tego modalu na przezroczysty, bez cienia/paddingu; zdjęcie object-contain z ramką 1 px. Rezerwować wysokość na kontrolki i podpis.
- [x] Powtórzyć testy; oczekiwany PASS. Sprawdzić w przeglądarce desktop/mobile, pion/poziom, niskie okno, focus i dwie galerie.
- [x] Commit `feat: add accessible navigation to photo lightbox`.

### Task 3: Pas dyscyplin Kontakt

**Files:** nowy `src/components/public/ContactDisciplines.tsx`, `src/routes/kontakt.tsx`, `src/styles.css` jeśli potrzebna szerokość pasa poza kontenerem.
**Interfaces:** `ContactDisciplines(): ReactElement`, bez props i danych CMS; blok dekoracyjny aria-hidden, bez linków.

- [x] Dodać cztery słowa jako tekst, Bebas Neue, `text-border`, separatory `border-primary`. Desktop 4 kolumny, mobile 2; skalowanie CSS do 144 px, szerokość do 1440 px.
- [x] Umieścić pod kartami i przed ContactDocuments, zachowując szerokość kart oraz dokumentów.
- [x] Uruchomić istniejące testy publicznych stron; oczekiwany PASS. Sprawdzić 320/390/768/1024/1440 px, geometrię pasa i dokumenty; screenshoty.
- [x] Commit `feat: add contact disciplines typography strip`.

### Task 4: Odbiór i tracker

- [x] Uruchomić `bun run typecheck`, `bun run test`, `bun run lint`, `bun run build`; oczekiwany PASS (wcześniejsze ostrzeżenia lint opisać).
- [x] Zrobić przegląd całej gałęzi przez świeżego recenzenta, poprawić istotne problemy i ponowić odpowiednie kontrole.
- [x] Przechować screenshoty na Dysku projektu; uzupełnić właściwe wiersze po ponownym odczycie ID i kategorii, zachowując stare dowody i akceptację klientki.
- [ ] Osadzenie obrazu w komórce zweryfikować osobno; dopóki niewykonane, nie twierdzić, że wymaganie dowodu jest spełnione.
- [x] Zapisać wynik weryfikacji i wersję w repozytorium. Wystawić PR do przeglądu zgodnie z dotychczasowym trybem współpracy; nie mergować.
