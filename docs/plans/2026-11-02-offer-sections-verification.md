# VHS-020 / VHS-020a — weryfikacja implementacji

Data: 02.11.2026. Branch: `codex/vhs-020-offer-sections`, baza `origin/main`
`888c0a0`. Implementacja: `7af10c4` oraz następujący po nim commit poprawki
odświeżania gotowości publikacji. Zmiany lokalne, bez publikacji produkcyjnych ofert.

## Zakres

- Wspólny porządek CMS, menu i treści ofert wyjazdów oraz obozów: O wyjeździe /
  O obozie, W programie, Cena, Zakwaterowanie, Resort, Szkolenia, Transport,
  Ubezpieczenie, Galeria.
- Pięć opcjonalnych sekcji z zachowaniem treści po wyłączeniu. Transport jest
  opcjonalny również w nowych ofertach, zgodnie z korektą użytkownika.
- Resort: opis, mapa w prywatnym Storage, bez kadrowania, modal powiększenia,
  opcjonalny bezpieczny link do oficjalnej mapy. Szkolenia: karty zakresu/poziomu
  i informacja cenowa. Ubezpieczenie: pakiety, zakresy ochrony i rozszerzenia;
  formularz nie zawiera fikcyjnego ubezpieczyciela ani stawek ze screena.
- Transport: wspólny rodzaj i opis, wyjazd/powrót dla każdego turnusu obozu
  przypisane do trwałego UUID. Dojazd własny nie wymaga dat. Zachowano istniejące
  zewnętrzne CTA, harmonogramy, turnusy, wideo i starsze kotwice podsekcji.
- Kontrakt JSON v2 i walidacja SQL publikacji; starsze oferty nadal działają bez
  uzupełniania nowych sekcji. Baza odrzuca nadpisanie v2 przez stary CMS.

## Wyniki

- `bun run typecheck`: OK.
- `bun run test`: 537 testów / 77 plików, OK po poprawce z przeglądu.
- `bun run lint`: 0 błędów, 7 wcześniejszych ostrzeżeń Fast Refresh.
- `bun run build`: OK, 8 stron prerenderowanych i sitemap.
- `bun run images:check`, `bun run check:seo`: OK.
- Lokalny PostgreSQL/Supabase: 27 nowych asercji pgTAP oraz istniejący zestaw
  10 scenariuszy CMS/RLS/Storage, OK. Wszystkie migracje i dane testowe wykonano
  wewnątrz transakcji zakończonych `ROLLBACK`; bez zmian produkcyjnej bazy.

Testy bazy obejmują publikację z wyłączonym niekompletnym Transportem i
Zakwaterowaniem, odmowę publikacji włączonego niekompletnego Transportu przez
bezpośrednie API, zachowanie poprzedniej treści po błędzie, ochronę wersji v2,
uprawnienia mapy, jej atomową podmianę i publiczny odczyt wyłącznie po publikacji.
Testy TypeScript obejmują m.in. wszystkie 32 kombinacje przełączników,
przypisanie transportu po zmianie kolejności/nazwy/usunięciu turnusu, kompletność
sekcji, limity kart, ceny i bezpieczną kompensację uploadu. W razie niejednoznacznego
błędu sieciowego nowy plik mapy nie jest automatycznie usuwany.

## Rzeczywista przeglądarka

Playwright: zbudowane statyczne trasy
`http://127.0.0.1:3048/wyjazdy/qa-sekcje` i
`http://127.0.0.1:3048/obozy/qa-sekcje`, API ofert/Storage przechwycone w izolowanym
kontekście przeglądarki. To lokalne fikstury, nie publiczne oferty.

- 12 scenariuszy nowych ofert: oba typy, obie palety, 320×844, 390×844 i 1440×900.
  Kolejność sekcji, długie tytuły / 6 pakietów na 320 px, brak poziomego
  przepełnienia, mapa w modalu, Escape i powrót fokusu, starsze hashe: OK.
- Dodatkowo 8 scenariuszy ofert legacy i wszystkich nowych sekcji wyłączonych:
  oba typy, obie palety przy 390×844. Zachowanie starych treści i kotwic: OK.
- Izolowany rzeczywisty komponent CMS na `http://127.0.0.1:3049/`: wyłączenie
  Transportu, zapis JSON do localStorage, przeładowanie, ponowne włączenie i
  odzyskanie tekstu, błędy włączonej pustej sekcji oraz ich brak po wyłączeniu: OK.
  Nie był to pełny przepływ zalogowanego CMS do prawdziwej bazy; trwałość i
  uprawnienia sprawdzono osobno w SQL i testach repozytoriów/route.

Screenshoty znajdują się lokalnie w
`.superpowers/evidence/2026-11-02-offer-sections/` (folder ignorowany przez Git).
Wybrane dowody w folderze projektu na Dysku:

- [Ubezpieczenie — mobile, paleta zimowa](https://drive.google.com/file/d/1-dheAXj3XWBy4cR1PG08meBPFnKSMdNI/view).
- [CMS — walidacja opcjonalnego Transportu](https://drive.google.com/file/d/1Zikehj6Gu7rAbV8DOUEtsPbRCsbjN9jM/view).
- [Kolejność menu — desktop, obóz](https://drive.google.com/file/d/1oP1FlIHBWAHjTy1ql2e5Vt9Kpy_aYrTN/view).

## Końcowy przegląd

Niezależny przegląd `888c0a0..7af10c4`: brak uwag krytycznych i drobnych, jedna
ważna uwaga dotycząca pamiętanej gotowości publikacji po edycji treści. Poprawka
odświeża ją po zapisaniu oferty i rozróżnia niekompletne sekcje od brakujących
zdjęć. Test zamontowanego edytora odtworzył blokadę po wyłączeniu niekompletnych
Szkoleń (RED), po poprawce pozwala publikować bez przeładowania (GREEN).

## Decyzje implementacyjne

- Opcjonalność Transportu dla starych i nowych ofert wynika z wyraźnej zgody
  użytkownika; administrator sam decyduje o pokazaniu tej sekcji.
- Praca w istniejącym checkout na nowym branchu odpowiada dyspozycji użytkownika;
  nie utworzono dodatkowego worktree. Koszt: bieżący checkout pozostaje na branchu.
- Powiązane zadania modelu/CMS/map/renderowania zapisano jednym atomowym commitem
  po wspólnej integracji, zamiast osobnych niekompletnych etapów. Koszt: większy
  pierwszy diff do przeglądu.
- Starszy tekst transportu dla rodzica pozostaje edytowalny i widoczny w O obozie,
  dopóki nowa sekcja Transport jest wyłączona; jej włączenie usuwa powielenie na
  stronie. Koszt: aby ukryć cały wcześniejszy opis, należy również wyczyścić pole
  wcześniejszego transportu dla rodzica.
- Istniejące Program/Cena pozostały kompozycją w formularzu, nowe sekcje korzystają
  ze wspólnych pól i kart. Typy/schemat/normalizacja współdzielą `content-v2.ts`.
  Koszt: dalszy rozwój pojedynczej sekcji może uzasadnić kolejne wydzielenie pliku.

## Przekazanie i ograniczenia

Wdrożenie wymaga najpierw nowej migracji Supabase, potem odpowiadającego jej
frontendu. Migracji produkcyjnej ani deployu nie wykonywano. PR i merge pozostają
na dalszą dyspozycję użytkownika, zgodnie z zaakceptowanym planem.

W trackerze należy zachować status `W trakcie` do osadzenia obrazów w komórkach.
Automatyczna kontrola odrzuciła próbę wstawienia lokalnego URL do `IMAGE`, ponieważ
Google Sheets nie ma do niego dostępu. Żadnej komórki dowodowej nie nadpisano.
Dowody na Dysku są materiałem dodatkowym; nie zastępują wymaganego obrazu w komórce.
Akceptacja klientki pozostaje dla człowieka.
