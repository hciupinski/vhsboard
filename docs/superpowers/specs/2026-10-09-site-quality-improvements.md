# VHSBOARD — zakres wybranych poprawek

Data: 2026-10-09. Branch: `codex/site-quality-improvements`, utworzony z
`feature/mobile-tweaks` na commicie `0d67969`. Dokument opisuje planowane
zmiany; nie potwierdza ich wdrożenia.

## Decyzje użytkownika

Do wykonania wybrano zadania **1, 4, 5, 11, 12, 14, 15, 16, 17, 18**.
Numeracja pozostaje zgodna z listą audytu.

- Oferty pozostają pobierane przez JavaScript z Supabase.
- Nie generujemy osobnego HTML dla każdej oferty ani procesu rebuild po jej edycji.
- Nie wdrażamy rezerwacji, zaliczek, płatności ani kont klientów.
- Zachowujemy zewnętrzne CTA TripAhead.
- Nie zmieniamy domeny, DNS, produkcyjnych danych ani ustawień kont usług.
- Nie realizujemy pozostałych zadań audytu, w tym dynamicznej sitemapy,
  migracji WordPress, nowego stagingu, backupów, alertowania i nowego rollbacku.

## Wymagania wspólne

- React 19, TypeScript, Vite, TanStack Router/Start/Query, Tailwind 4 i Radix pozostają podstawą aplikacji.
- Hosting pozostaje statycznym Cloudflare Pages; bez Workers i osobnego backendu.
- Supabase Auth, PostgreSQL, Storage i RLS pozostają źródłem danych i kontroli dostępu.
- Nie osłabiamy `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` ani RLS.
- Publiczne dane zawierają wyłącznie opublikowane oferty; podgląd administratora pozostaje autoryzowany.
- Treści i znaczące opisy alternatywne pozostają po polsku.
- Zachowujemy semantyczne tokeny OKLCH, zdjęcia, Bebas Neue i Barlow oraz obecny charakter marki.
- Nowe zależności: tylko `sharp` jako narzędzie developerskie oraz pakiety fontów `@fontsource/bebas-neue` i `@fontsource/barlow`.
- Każda zmiana aplikacji wymaga testów adekwatnych do zachowania, `bun run lint` i pełnego `bun run build`.

## Stan potwierdzony w kodzie

Kontrola `bunx tsc --noEmit` zgłasza **119 błędów w 26 plikach**. Aż 72 to
odczyty właściwości przez kropkę przy `noPropertyAccessFromIndexSignature`.
Pozostałe obejmują nullable dane, typy testów i kontrakt loaderów routera.
Samo `vite build` nie gwarantuje poprawnego typowania.

HTML wspólnego shellu ofert dziedziczy z root `noindex, nofollow` niezależnie
od `VITE_SEO_INDEXING`. Ten sam shell jest przepisywany dla `/admin`.
Marketing ma sześć prerenderowanych stron. Szczegóły ofert nie są prerenderowane.

Źródłowe fotografie dochodzą do około 7,5 MB. Karuzela używa katalogu ze
stabilnymi kluczami `carousel/...`, przechowywanymi również w Supabase.
Zmiana formatu obrazu nie może unieważnić tych kluczy.

Nagłówek przełącza na pełne menu już przy 640 px, co powoduje kolizje na
tablecie. Globalne `*:focus { outline: none }` usuwa domyślny fokus.
Pomarańczowy przycisk z jasnym tekstem ma zbyt niski kontrast dla małych etykiet.
Fonty są pobierane z Google. Metadane nie zawierają `og:image`.

## Kryteria dla poszczególnych zadań

| Nr  | Rezultat i granice                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Przy `VITE_SEO_INDEXING=true` publiczny shell ma `index, follow`; przy `false` ma `noindex, nofollow`. Osobny shell administratora zawsze ma `noindex, nofollow`. Podglądy, błędy i brak oferty nie zyskują index po wykonaniu JS. Nie obiecujemy pozycji w Google ani usunięcia ograniczeń renderowania JS.                                                                                                                                                   |
| 4   | Lokalne zdjęcia dostają WebP/AVIF oraz szerokości 480, 960 i 1600 px, bez powiększania źródła. Wariant 480 px ma najwyżej 180 KiB, każdy większy najwyżej 450 KiB. Stabilne klucze karuzeli pozostają niezmienione. Pierwszy hero jest priorytetowy, kolejne slajdy i fotografie poniżej pierwszego ekranu są lazy. Nowe zdjęcia CMS są zmniejszane do 1920 px i konwertowane do WebP o rozmiarze najwyżej 2 MiB; istniejących obiektów Storage nie migrujemy. |
| 5   | `bun run typecheck` kończy się kodem 0 przy zachowaniu rygorystycznego tsconfig i pokryciu `scripts/**/*.ts`. PR ma osobny job `typecheck`; w produkcji typecheck odbywa się w `verify` przed migracjami. Naprawiamy wszystkie wykazane błędy, również w testach.                                                                                                                                                                                              |
| 11  | Pełne menu jest widoczne od 1024 px; poniżej działa menu Radix. Nagłówek bez otwartego menu ma najwyżej 73 px wysokości przy 100% zoom. Nie ma poziomego przepełnienia przy 320, 390, 640, 768, 1024 i 1440 px. Kotwice ofert nadal uwzględniają rzeczywistą wysokość nagłówka.                                                                                                                                                                                |
| 12  | Tekst zwykły na CTA osiąga 4,5:1, duży 3:1, fokus co najmniej 3:1 względem otoczenia. `--primary` i `--ring`: `oklch(0.56 0.17 42)`. Jasny tekst pozostaje na primary; etykiety gradientowe używają `text-sunset-foreground`. Fokus ma 2 px i 3 px offset, z zachowaniem dostępnych ringów komponentów.                                                                                                                                                        |
| 14  | Kliknięcie dostaje delikatny feedback `scale(0.98)` na aktywnym, dostępnym przycisku. Interakcje są krótkie: 160 ms dla press/hover, menu 200 ms wejście / 150 ms wyjście. Nie animujemy rozmiaru i paddingu. Hover ruchu działa wyłącznie dla `(hover: hover) and (pointer: fine)`. Reduced motion wyłącza przesunięcia, skalowanie i autoplay, także po zmianie preferencji podczas sesji. Dotyk i klawiatura nie wymagają hover do odkrycia CTA.            |
| 15  | Fonty są serwowane z własnego buildu, z `font-display: swap`, bez requestów do Google Fonts. Bebas Neue 400; Barlow normal 400/500/600/700 oraz italic 400. Obecne polskie znaki i układ pozostają prawidłowe.                                                                                                                                                                                                                                                 |
| 16  | Sześć marketingowych stron ma osobne obrazy JPEG 1200×630, do 300 KiB, oraz komplet OG i Twitter. Oferty mają wspólny, publiczny, trwały obraz 1200×630 dostępny już w publicznym shellu. Nie używamy wygasających signed URL. Indywidualny tytuł i opis oferty nadal aktualizuje JS; bot bez JS otrzyma dane ogólne.                                                                                                                                          |
| 17  | Usuwamy całe dekoracyjne etykiety `01 / W podróż`, `02 / Ruch`, `03 / Dla młodych` z sekcji wyboru na home. Pozostają tytuły, opis, zdjęcia i CTA oraz poprawna hierarchia nagłówków.                                                                                                                                                                                                                                                                          |
| 18  | AGENTS, architektura oraz runbooki opisują rzeczywiste trasy `/wyjazdy` i `/obozy`, Supabase CMS, build i ograniczenia SEO. Instrukcja utrzymania wskazuje komendy, zmienne, odpowiedzialność usług i diagnostykę bez ujawniania sekretów.                                                                                                                                                                                                                     |

Budżety obrazów i czasy animacji są decyzjami tego planu, a nie pomiarami
już wdrożonej wersji. W razie niespełnienia budżetu poprawiamy eksport/crop;
nie obniżamy automatycznie czytelności fotografii ani kryteriów odbioru.

## Podział prac i zależności

Trzy osobne plany umożliwiają niezależne wykonanie i ocenę podsystemów:

1. [Technika i SEO](../plans/2026-10-09-quality-technical.md): 5 → 1;
   zadanie 18 kończy całość po pozostałych planach.
2. [Media](../plans/2026-10-09-quality-media.md): 4 → 15 → 16.
3. [Interfejs](../plans/2026-10-09-quality-ui.md): 11 → 12 → 14 → 17.

Najpierw naprawiamy typy. Zadania SEO/OG współdzielą `seo.ts` i root;
media/UI współdzielą home i karuzelę. W jednym checkout wykonujemy je kolejno,
aby nie nadpisywać równocześnie tych samych plików. Zalecana kolejność:
**5, 1, 4, 15, 16, 11, 12, 14, 17, 18**.

## Odbiór całości

- Przejście typecheck, testów, lint, build:ci i pełnego build oraz check:seo.
- Osobny pełny build i check:seo dla obu wartości `VITE_SEO_INDEXING`,
  z legalnymi lokalnymi wartościami env; bez wdrożenia i bez wypisywania sekretów.
- Inspekcja wyjściowego HTML obu shellów przed JS oraz marketingowych meta OG.
- Inspekcja publicznych ekranów na sześciu szerokościach, klawiatury,
  coarse pointer i reduced motion; porównanie z wersją bazową.
- CMS: zalogowany administrator, podgląd szkicu, publikacja/edycja i wgranie
  zdjęcia testowane mockami; ewentualny ręczny zapis tylko w lokalnym/testowym Supabase.
- W raporcie końcowym rozróżniamy pomiary lokalne od rzeczywistego wdrożenia.

## Źródła decyzji projektowych

- [Design system projektu](../../design-system.md).
- [design-taste-frontend](/Users/hciupinski/.agents/skills/design-taste-frontend/SKILL.md):
  czytelne CTA, semantyczny fokus, spójna marka, brak dekoracyjnej numeracji.
- [emil-design-eng](/Users/hciupinski/.agents/skills/emil-design-eng/SKILL.md):
  krótkie interakcje, transform/opacity, reduced motion i warunkowy hover.
- [Fontsource — instalacja](https://fontsource.org/docs/getting-started/install)
  i [subsets](https://fontsource.org/docs/getting-started/subsets): lokalne
  pakiety fontów i obsługa glyphów poprzez `unicode-range`.

## Ustalenie wykonawcze — obrazy pionowe

Eksport zachowuje pełny kadr i limit jakości. Dla zdjęć pionowych wysokość
ograniczamy do 1920 px, więc największa szerokość może być mniejsza niż
1600 px. Pozwala to zachować budżet 450 KiB bez pogorszenia jakości poniżej
ustalonego minimum i bez dodatkowego kadrowania.
