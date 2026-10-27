# Poprawki 2026-10-27 — wynik implementacji i weryfikacji

Kod wszystkich ośmiu zgłoszeń wykonano lokalnie na `fix/20261027`, na bazie `origin/main` `3f95fd1`. Wersja aplikacji: `7a8af20`. Bez pushu, PR, merge i wdrożenia.

## Pozostały warunek odbioru

Użytkownik wymaga **obrazów osadzonych w komórkach**, a 27.10 odrzucił propozycję zastąpienia ich trwałymi linkami. Połączenie Google Drive/Sheets pozwala przesyłać screenshoty i edytować komórki, ale dostępne API nie udostępnia trwałego wstawiania obrazów do komórek. Przeglądarka Codex pokazuje logowanie do Google; użytkownik poinformował, że nie może teraz się zalogować. Nie użyto wygasających adresów narzędziowych ani nie rozszerzono udostępniania plików.

W arkuszu zapisano `Co poprawiono` oraz `Weryfikacja / wersja`, z URL, viewportami, wynikiem, commitem i pomocniczymi linkami do screenshotów. Komórki `Po / dowód` i wcześniejsze linki pozostawiono bez zmian. Wszystkie osiem statusów pozostaje `W trakcie`; `Akceptacja klientki` nietknięta. Nie jest to zakończony odbiór zadań.

Do dokończenia: zalogowana sesja arkusza → wstawienie głównych screenshotów jako obrazów w odpowiednich komórkach I → wizualne sprawdzenie → usunięcie adnotacji o oczekiwaniu z J → dopiero wtedy `Do akceptacji`. Przy VHS-018 wybierać kategorię Typografia, nie Galeria. Przy zamianie I dla VHS-010/VHS-012 zachować historyczne linki z 23.10; ich kopie z działającymi hiperłączami są już też w J. Numery wierszy mogą się zmieniać i nie są identyfikatorem.

## Testy i pomiary

- `bun run typecheck`: PASS.
- `bun run test`: 70 plików, 467 testów PASS.
- `bun run lint`: kod 0, 0 błędów, 7 istniejących ostrzeżeń react-refresh w dotychczasowych komponentach.
- `bun run build`: PASS, pełny prerender ośmiu stron/powłok i generacja sitemap.
- `bun run check:seo`, `bun run images:check`: PASS.
- Rzeczywista przeglądarka Chromium, 320/390/767/768/1023/1024/1440 px; główne zrzuty 390 × 844 i 1440 × 900. Bez poziomego overflow dokumentu.
- Hero: brak filtra obrazu i pełnego overlayu; najgorszy wariant kontrastu tekstu akapitu na białym tle pod panelem: 6,98:1.
- Kategorie mobile: panel 350 px przy 390 px ekranu, tekst wyśrodkowany, blur 4 px, brak dodatkowego podpisu CTA, dolne odstępy 16 px.
- Karuzela: 0/1/2/3/4/6 ofert; dla sześciu przy 1440 px listę 1112 px wypełniają karty po 354,66 px; ostatnia pozycja scrollLeft=1136 px. Klawiatura ujawnia ostatnią kartę bez pionowego skoku, a resize na mobile resetuje poziomy scroll. Reduced motion sprawdzony w przeglądarce i testach sterowania.
- Menu: 14 px poniżej 1024 px, 18 px od 1024 px. Zachowane kotwice i wspólne testy obozów.
- Mobilne CTA: zgodny bookingUrl, właściwy target/rel, brak przy błędnym adresie, rezerwa po stopce 80,13 px. Sprawdzono dialog ustawień cookies i otwarte menu nad paskiem. Fizyczne urządzenie z niezerowym safe area nie było dostępne; implementacja używa env(safe-area-inset-bottom).
- Inne wyjazdy: trzy inne najbliższe wyjazdy, bez obozów/aktualnego ID; po galerii i przed stopką. Błąd listy nie blokuje opisu i zapisów. Testy obejmują też pustą listę i loading.
- Dane testowe ofert były izolowane na poziomie odpowiedzi API w przeglądarce, z terminami w 2099 roku, bez zapisów do CMS. Trasa `/wyjazdy/qa-trip-0` działała tylko w tej izolacji.
- Dodatkowo bez izolacji: sześć publicznych stron oraz rzeczywiste `http://127.0.0.1:3000/wyjazdy/marocco-2026` — jedna H1 na stronie, brak overflow, menu desktop 18 px, mobilny adres zapisów zgodny z OfferFacts, brak błędów JS.

## Przegląd i decyzje techniczne

Niezależny przegląd całej gałęzi wskazał jeden istotny konflikt CSS: utility py-8/sm:py-10 nadpisywały mobilny padding z warstwy components. Pomiar w przeglądarce wykazał 32 px zamiast 16 px (RED); po ograniczeniu utility do md:py-10 pomiar daje 16 px (GREEN), pełne testy i build przechodzą.

Odłożona drobna uwaga: osobny test jednostkowy przejścia desktop → mobile i focusu poza widocznym obszarem można rozszerzyć; rzeczywiste przejście i brak pionowego skoku sprawdzono w przeglądarce.

Decyzje odnotowane podczas pracy: pozostawiono zaakceptowany checkout/gałąź; screenshoty zebrano po integracji zmian, żeby sprawdzić ich współdziałanie; zachowano dotychczasową regułę dowolnego HTTPS bookingUrl i CTA historycznych szczegółów, zgodnie z zaakceptowanym zakresem. Te reguły nie zostały rozszerzone o nowe zasady domen/dat.

## Dowody na Dysku

[Folder projektu — 20 screenshotów](https://drive.google.com/drive/folders/1GuGDIJaLR8elZTwtCaaO_kO1JHpcUAXi). Pliki potwierdzono odczytem zawartości folderu po przesłaniu. Nie włączano publicznego udostępniania ani nie zmieniano uprawnień. Dostęp klientki do samych plików nie został osobno potwierdzony; odbiór dowodów w arkuszu pozostaje otwarty.

### VHS-003

Usunięto pełny filtr przyciemniający zdjęcia głównej karuzeli. Czytelność zachowuje lokalne tło wyłącznie pod tekstem; fotografie poza nim bez filtra.

- [VHS-003-after-desktop-1440.png](https://drive.google.com/file/d/1l-Di6JGPD7K2EUqg9wYU0AfyEuOGorMp/view?usp=drivesdk)
- [VHS-003-after-mobile-390.png](https://drive.google.com/file/d/1cP06f781pZ7LSoKultEtsOqKW1bDwjCw/view?usp=drivesdk)

### VHS-005

Na mobile wyśrodkowano i zmniejszono panele kategorii; pozostają tytuł i opis. Usunięto mobilne podpisy CTA i pełny gradient zdjęcia. Blur tylko pod panelem. Dolny odstęp 16 px; desktop zachowany.

- [VHS-005-after-mobile-390.png](https://drive.google.com/file/d/1Tk-BctWAMtkaneXYI-1Nn7l7VJh50Kby/view?usp=drivesdk)
- [VHS-005-after-mobile-390-1.png](https://drive.google.com/file/d/1LniDmXj6ZRw7aRMXn6BS_Rj43WZgXfLd/view?usp=drivesdk)
- [VHS-005-after-mobile-390-2.png](https://drive.google.com/file/d/1TPqKB3-Uj36oBBx2Ch1J-eEBIL1Z1ySl/view?usp=drivesdk)

### VHS-008a

Przycisk „Sprawdź szczegóły” na kartach głównej pozostaje widoczny także na desktopie, bez hover i focus. Cała karta nadal prowadzi do odpowiedniej oferty.

- [VHS-008a-after-desktop-1440.png](https://drive.google.com/file/d/15XN78JGETVQ4TmJbpGtLMBNkItccUhp1/view?usp=drivesdk)

### VHS-010

Usunięto limit trzech najbliższych ofert. Przy 4+ ofertach desktop ma przewijany rząd po trzy karty, strzałki i blokadę na krańcach. Na mobile oferty pionowo; tablet zachowuje dwie kolumny.

- [VHS-010-after-desktop-1440-start.png](https://drive.google.com/file/d/1qigfYwT2E2kIVQbrpF0UPFQ3TdJo6zQD/view?usp=drivesdk)
- [VHS-010-after-desktop-1440-end.png](https://drive.google.com/file/d/1R6_a_8gqN7Xd9t3OXtXc9X-YDZSsRjK5/view?usp=drivesdk)
- [VHS-010-after-mobile-390.png](https://drive.google.com/file/d/1PrN9IjYywJXD8dKISKBxRefIUBl3cCVP/view?usp=drivesdk)

### VHS-012

Usunięto tylko dodatkowy link „Zobacz wyjazdy” z końcowej sekcji kontaktowej. Zachowano nagłówek, opis i „Napisz do nas”; CTA hero i stanów listy bez zmian.

- [VHS-012-after-desktop-1440.png](https://drive.google.com/file/d/1fiXTmtiUCnkSa-RR7dRgyWO8ogIOCkxY/view?usp=drivesdk)
- [VHS-012-after-mobile-390.png](https://drive.google.com/file/d/1G1LrtEqL-AZGbeU15nGJyfxjkt_jwcjc/view?usp=drivesdk)

### VHS-018 — menu

Tylko w menu sekcji szczegółów wyjazdu zwiększono tekst do 18 px od 1024 px. Poniżej pozostaje 14 px. Zachowano etykiety, kotwice i pomiar wysokości sticky menu.

- [VHS-018-menu-after-desktop-1440.png](https://drive.google.com/file/d/1AjNriwfpvkS95zeK9f4J4ULBG_tRHHn9/view?usp=drivesdk)
- [VHS-018-menu-after-mobile-390.png](https://drive.google.com/file/d/1rd0YYq_di09ANdm1Yj9ukXB6L1EHve7v/view?usp=drivesdk)

### VHS-023a

Dodano dolny, stały pasek „Zapisz się” poniżej 1024 px na szczegółach wyjazdu. Korzysta z aktualnego adresu TripAhead i walidacji HTTPS. Uwzględnia safe-area oraz rezerwę miejsca pod stopką.

- [VHS-023a-after-mobile-390.png](https://drive.google.com/file/d/1ghK6FREI4YCAXNbRYTMGs0awgAAxAeW9/view?usp=drivesdk)
- [VHS-023a-after-mobile-390-footer.png](https://drive.google.com/file/d/1g9Z4V8HbYmv6XjmtkRFSnL16-VUGf7WQ/view?usp=drivesdk)
- [VHS-023a-after-mobile-390-cookies.png](https://drive.google.com/file/d/12Q5fZtyci6V-5Fsu-xrp94fBg9K8_1V0/view?usp=drivesdk)
- [VHS-023a-after-mobile-390-menu.png](https://drive.google.com/file/d/1sB3GfPNb2MxwgtDnIIIOBfWpdBgtfYqF/view?usp=drivesdk)

### VHS23-b

Dodano na końcu szczegółów wyjazdu, po galerii i zakwaterowaniu, sekcję „Zobacz inne wyjazdy”. Maksymalnie trzy najbliższe inne opublikowane wyjazdy i link do pełnej listy. Niezależne pobieranie nie blokuje szczegółów.

- [VHS23-b-after-desktop-1440.png](https://drive.google.com/file/d/1UBr8pigWZv5OZ1htPyURFxHbCR62Ctx-/view?usp=drivesdk)
- [VHS23-b-after-mobile-390.png](https://drive.google.com/file/d/1biZ9D42K9i1LQ4agCdfs71NOi6eOxaYe/view?usp=drivesdk)
- [VHS23-b-after-desktop-1440-error.png](https://drive.google.com/file/d/1C714DQOSxtWxABs2BQsU9fteO9HRnQAP/view?usp=drivesdk)

## Wznowienie

Plan: [2026-10-27-client-feedback.md](2026-10-27-client-feedback.md). Do czasu osadzenia obrazów pozostawiono roboczy ledger i pliki dowodów w ignorowanym katalogu `.superpowers/sdd/2026-10-27-client-feedback/`. Nie wykonywać ponownie już zapisanych zmian aplikacji; wznowić wyłącznie brakujący etap dokumentowania w arkuszu.
