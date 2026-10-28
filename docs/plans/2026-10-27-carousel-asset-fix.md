# Naprawa po wymianie zdjęć karuzeli

**Baza:** `origin/main` — `7034945d9ac62a766c651febda9b28a70417cc04`. Gałąź: `codex/fix-carousel-assets`.

## Przyczyna

Commit `ebe790b` usunął stare zdjęcia karuzeli i ich wygenerowane warianty, pozostawiając odwołania do tych nazw na stronie głównej, w sekcji letnich Obozów, generatorze OG i testach. [Deploy production po mergu PR #44](https://github.com/hciupinski/vhsboard/actions/runs/40589537227) zatrzymał się na testach. Lokalnie odtworzono błędy: 10 plików testowych nie przechodziło, w tym błędy importu tras przez brakujące `carousel/eventy.jpg` oraz `carousel/obozy-lato-wakeboard.png`.

## Zmiana

- Domyślna karuzela używa pięciu nowych fotografii; pierwsza to `carousel/1karuzela_snb.png`.
- Odczyt zapisanej konfiguracji CMS mapuje stare ścieżki surf/snow/event na aktualne odpowiedniki, zachowując kolejność pierwszego wystąpienia i usuwając duplikaty. Zapis przyjmuje wyłącznie bieżący katalog. Usunięty wpis wakeboardowy, który nie ma odpowiednika w nowej karuzeli, pozostaje pomijany jak inne nieaktualne wpisy. Przy pustej konfiguracji działa zestaw domyślny.
- Fotografię wakeboardową nadal używaną w Obozach zachowano jako `src/assets/obozy-lato-wakeboard.png`, poza katalogiem karuzeli. Obraz nie wraca do opcji wyboru karuzeli w CMS; wygląd sekcji letniej zachowano. Wygenerowano AVIF/WebP i katalog aplikacji.
- Generator OG wskazuje istniejącą nową fotografię surfową. Istniejących gotowych plików OG nie zmieniano.
- Testy panelu CMS używają rzeczywistych wpisów bieżącego katalogu. Dodano regresje dla domyślnego zestawu, siedmiu starych ścieżek oraz deduplikacji konfiguracji.

## Weryfikacja

- Odtworzono błędy przed naprawą. Nowe regresje najpierw nie przechodziły, po poprawce są zielone.
- `bun run test`: 71 plików, 479/479 testów OK.
- `bun run typecheck`: OK.
- `bun run lint`: 0 błędów, 7 wcześniejszych ostrzeżeń Fast Refresh.
- `bun run build`: OK, prerenderowanie i sitemap ukończone.
- `bun run images:check` i `bun run check:seo`: OK.
- Generowanie wszystkich 7 grafik OG w katalogu tymczasowym: OK.
- Przegląd kodu przez niezależnego recenzenta: bez uwag.
- Przeglądarka, lokalnie `http://127.0.0.1:3000/`, 1440×900 i 390×844: pięć slajdów domyślnych, brak brakujących plików i błędów strony. Izolowana konfiguracja CMS ze starymi ścieżkami: trzy poprawnie znormalizowane i unikalne slajdy. `/obozy`, 390×844: zdjęcie wakeboardowe załadowane.

Nie wykonywano zapisów do CMS ani wdrożenia produkcyjnego. Screenshoty i raport przeglądarkowy: `.superpowers/evidence/2026-10-27-carousel-fix/` (lokalne pliki ignorowane przez Git).
