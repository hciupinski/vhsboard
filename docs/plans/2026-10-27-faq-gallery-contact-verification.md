# FAQ, galerie i Kontakt — weryfikacja 27.10.2026

**Kod wykonany i sprawdzony lokalnie.** [PR #44](https://github.com/hciupinski/vhsboard/pull/44) pozostaje otwarty; nie potwierdzono wdrożenia publicznego. Wymaganie obrazów osadzonych w komórkach trackera pozostaje niewykonane.

## Wersje

- Baza `origin/main`: `686f062cfef4d31e446ac3c3d6e54ccea1c9a182`.
- Gałąź: `codex/faq-gallery-contact`.
- FAQ: `0d32d3d`; galeria: `b696470`; Kontakt: `c8385c6`.
- [Zaakceptowany zakres](2026-10-27-faq-gallery-contact-design.md), [plan wykonania](2026-10-27-faq-gallery-contact.md).

## Wyniki

| Element               | Środowisko i viewport                                                                           | Wynik                                                                                                                                                                                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VHS-052 — wspólny FAQ | `http://127.0.0.1:3000/wyjazdy`, `/obozy`, `/eventy`, `/o-nas`; każda strona 1440×900 i 390×844 | Obliczone font-size pytań/odpowiedzi: 20/18 px desktop i 16/16 px mobile. Otwarta odpowiedź, bez poziomego overflow. Treści i szerokość bez zmian.                                                                                                                                                         |
| VHS-018 — Galeria     | `http://127.0.0.1:3000/wyjazdy/qa-gallery`; 1440×900, 390×844, 320×568, 844×390                 | Przezroczysty kontener bez brązowego panelu i widocznego cienia, ramka 1 px, pełne proporcje pionowych i poziomych zdjęć. Strzałki i krzyżyk 44×44 px, licznik, klawiatura, zapętlenie, focus wewnątrz i powrót do miniatury: OK. Zakwaterowanie ma niezależną galerię; przy jednym zdjęciu brak strzałek. |
| VHS-044 — Kontakt     | `http://127.0.0.1:3000/kontakt`; 320×844, 390×844, 768×900, 1024×900, 1440×900                  | Cztery kolumny od 1024 px, poniżej układ 2×2. Bebas Neue, jasnobeżowy kolor i pomarańczowe separatory. Brak overflow. Dokumenty: normalny/pusty/loading/error zachowują poprawny układ.                                                                                                                    |

Galeria została sprawdzona na izolowanych odpowiedziach API i rzeczywistych lokalnych fotografiach. `qa-gallery` nie jest ofertą publiczną. Kontakt pokazuje lokalne dane konfiguracji oraz testowy dokument. Nie wykonano zapisów do CMS. Wspólny komponent galerii jest używany również przez obozy i galerie zakwaterowania.

Nowe testy interakcji galerii najpierw wykazały cztery błędy brakującej nawigacji i nieaktualnych danych zdjęcia, następnie wszystkie przeszły. Zachowano wcześniejszy test dostępnej nazwy modalu. Końcowy przegląd całej gałęzi przez niezależnego recenzenta: bez uwag i bez odłożonych usterek.

## Kontrole

- `bun run typecheck`: OK.
- `bun run test`: 71 plików, 471 testów, wszystkie OK.
- `bun run lint`: 0 błędów; 7 wcześniejszych ostrzeżeń Fast Refresh w niezmienionych komponentach.
- `bun run build`: OK, w tym prerenderowanie i sitemap.
- GitHub Verify dla kodu `c8385c6`: test, lint, typecheck i build — PASS.
- `git diff --check`: OK.
- Przegląd screenshotów Kontakt desktop/mobile, FAQ i pionowego podglądu galerii: OK.

## Tracker i dowody

W [trackerze](https://docs.google.com/spreadsheets/d/1MLn5I9EcpKrJRD6PP8rUxh8OoaHaeqMyHkwvmYN6sQQ/edit?gid=1028330015) uzupełniono opisy i weryfikację VHS-018 **Galeria** oraz VHS-044. Dla nowego wspólnego zadania FAQ dodano VHS-052; dopiski przy VHS-038 i VHS-040 wskazują wykonany zakres. VHS-038 z pozostałą przebudową Eventów pozostaje otwarte. Zgłoszenie menu o powielonym ID VHS-018 zachowano. Oryginalne raporty, wcześniejsze dowody i pole akceptacji klientki zachowano.

VHS-018 Galeria, VHS-044 i VHS-052 mają status `W trakcie`, ponieważ obrazy nadal wymagają osadzenia w `Po / dowód`. Dostępne narzędzia nie udostępniają trwałego natywnego osadzania, nie ma podłączonej sesji dokumentu Sheets, a użytkownik wcześniej wskazał brak możliwości zalogowania do przeglądarki. Kolumny z obrazami nie zastąpiono formułami ani linkami. W `Weryfikacja / wersja` zapisano trwałe linki do dodatkowych materiałów i jawnie opisano brak osadzenia.

[Folder dowodów](https://drive.google.com/drive/folders/1hMDfg4zBTVGCy5tYSOtJwt9x6jcg1Vws): początkowe 16 screenshotów, 2 ujęcia pierwszej korekty VHS-005 oraz 2 ujęcia finalnego gradientu. Upload i zawartość początkowej partii potwierdzono odczytem. Lokalne kopie i pomiary zachowano w `.superpowers/evidence/2026-10-27-faq-gallery-contact/` (ignorowane przez Git).

- [FAQ-wyjazdy-1440.png](https://drive.google.com/file/d/1rVKknGFEpP-oGuacRdxETM0UqNBY1CDr/view?usp=drivesdk)
- [FAQ-wyjazdy-390.png](https://drive.google.com/file/d/1I1OdX3OFev34X5ykAApF6It6fSfgPMXp/view?usp=drivesdk)
- [FAQ-obozy-1440.png](https://drive.google.com/file/d/1kYaWqHQSXJJqFj8zlEKNQ--nu58-5rbJ/view?usp=drivesdk)
- [FAQ-obozy-390.png](https://drive.google.com/file/d/15kVrh2FrE8M9pOS1a-TqShRxeS0i7SCY/view?usp=drivesdk)
- [FAQ-eventy-1440.png](https://drive.google.com/file/d/1CHpzC5mF1XwRh7oOK2VAraICafmp1OLQ/view?usp=drivesdk)
- [FAQ-eventy-390.png](https://drive.google.com/file/d/1kpOomjdLJQlyZlWQJ1z_KWuacwPcMTPW/view?usp=drivesdk)
- [FAQ-o-nas-1440.png](https://drive.google.com/file/d/12h1B9Tqo5VuERJFFZHjPgI6TMnySLHrQ/view?usp=drivesdk)
- [FAQ-o-nas-390.png](https://drive.google.com/file/d/1G4RQcMCYEMf0ytJc8zMIYfTLe51SEGw2/view?usp=drivesdk)
- [VHS-044-contact-1440.png](https://drive.google.com/file/d/1gVWp-j5S7aDslRfwpMDZfoXFCTqQX7O1/view?usp=drivesdk)
- [VHS-044-contact-390.png](https://drive.google.com/file/d/18lVXfDJO8uqsz8pQep9J0BY_lSZm_hRU/view?usp=drivesdk)
- [VHS-044-contact-320.png](https://drive.google.com/file/d/1OPNj5Ka7tWk2TjrWyton_99QEt7Wic_4/view?usp=drivesdk)
- [VHS-018-gallery-portrait-1440x900.png](https://drive.google.com/file/d/1TdHH7tmBX-RRS9PLyG2qhi5W79lKDKuy/view?usp=drivesdk)
- [VHS-018-gallery-portrait-390x844.png](https://drive.google.com/file/d/15wHwMqIQd0ZoDTVDcWWoMIzSP95bfw_r/view?usp=drivesdk)
- [VHS-018-gallery-portrait-320x568.png](https://drive.google.com/file/d/1Lj54QNW9ZKYfZldaqVP4cyWaTsv36L1-/view?usp=drivesdk)
- [VHS-018-gallery-portrait-844x390.png](https://drive.google.com/file/d/1pXy_ZN8WuCDZ_x2b5XRsN6YucCnRg0MT/view?usp=drivesdk)
- [VHS-018-gallery-landscape-1440.png](https://drive.google.com/file/d/1__AnjI_waGs9jlHJLrO_1buiDfz_OflU/view?usp=drivesdk)

## Korekta VHS-005 po uwadze użytkownika

Ten wariant zastąpiono gradientem opisanym w następnej sekcji.

Użytkownik zgłosił zbyt wysokie podpisy kategorii na mobile i brązowe wypełnienie. Przyczyną było tło `oklch(0.22 0.03 60 / 0.8)` dodane w poprzedniej partii.

Poniżej 768 px zmniejszono odstęp tytuł–opis z 12 do 4 px oraz pionowy padding z 16 do 12 px. Usunięto kryjący brąz: tło ma neutralny czarny kolor z kryciem 10%, przywrócono wcześniejszy blur 1,6 px. `brightness(0.4)` przyciemnia obraz wyłącznie pod panelem, utrzymując czytelność tekstu i prześwitywanie fotografii. Pozycja paneli, tytuły, opisy i ukryte mobilne CTA zachowano.

Weryfikacja rzeczywistą przeglądarką na `http://127.0.0.1:3000/`: 320, 390, 594 i 767 px — każdy panel niższy dokładnie o 16 px, bez poziomego overflow. Przy 390 px wysokość spadła ze 121,89 do 105,89 px. Przy 768 i 1440 px porównanie parametrów przed/po potwierdziło niezmieniony desktop. Sprawdzono screenshoty trzech kategorii przy 390 i 594 px. Lokalne kopie i pomiary: `.superpowers/evidence/2026-10-27-mobile-captions/`.

Po korekcie: typecheck OK, 471/471 testów OK, lint 0 błędów / 7 wcześniejszych ostrzeżeń, pełny build OK. Nowy dowód nadal wymaga osadzenia w komórce trackera; materiały dodatkowe:

- [VHS-005 — mobile 390](https://drive.google.com/file/d/1n_vLh7VuIAaDAkULf5h9LuVFBrb3e9c0/view?usp=drivesdk)
- [VHS-005 — mobile 594](https://drive.google.com/file/d/1fjf1a_wpXTDZTpZRP7EEnthiZG3DT_aP/view?usp=drivesdk)

## Aktualny VHS-005 — zaakceptowany gradient mobilny

Użytkownik wybrał gradient i po obejrzeniu wyniku zaakceptował wysłanie poprawki do PR. Kod: `764b4bd` na `codex/faq-gallery-contact`, [PR #44](https://github.com/hciupinski/vhsboard/pull/44).

Poniżej 768 px usunięto prostokątny panel, blur i cień. Neutralny czarny gradient obejmuje pełną szerokość dolnej części fotografii i dopasowuje wysokość do tekstu. W obszarze tekstu ma krycie co najmniej 72%, schodzące do 90% przy dolnej krawędzi. Górna część zdjęcia pozostaje odsłonięta. Tytuł i opis wyrównano do lewej, 20 px od brzegu; opis ma 16 px i pełne krycie, odstęp tytuł–opis 4 px. Cały kafelek pozostaje linkiem, bez dodatkowego mobilnego CTA.

Weryfikacja na `http://127.0.0.1:3000/`: wszystkie trzy kafelki przy szerokościach 320, 390, 594, 640 i 767 px — gradient na pełną szerokość, brak panelu i blura, brak poziomego overflow. Przy 768 i 1440 px parametry desktopowe są identyczne z wcześniejszym pomiarem. Obliczony minimalny kontrast opisu na najjaśniejszym możliwym tle (białe zdjęcie pod najsłabszą częścią gradientu obszaru tekstu) wynosi 8,92:1. To obliczenie graniczne, nie odczyt pikseli fotografii. Screenshoty rzeczywistych zdjęć sprawdzono wizualnie.

Kontrole po zmianie: typecheck OK, 71 plików / 471 testów OK, lint 0 błędów / 7 wcześniejszych ostrzeżeń, pełny build OK. Dane i pomiary: `.superpowers/evidence/2026-10-27-mobile-gradient/`. Nowe obrazy nadal wymagają osadzenia w komórce trackera; wcześniejsze dowody pozostawiono.

- [VHS-005 — gradient mobile 390](https://drive.google.com/file/d/1oP89r6bxb3I_n2fPXIjraCh9TN1oYB6m/view?usp=drivesdk)
- [VHS-005 — gradient mobile 594](https://drive.google.com/file/d/1uboUhL4XDrozgFD0nbyIxO3owMK5NNQ3/view?usp=drivesdk)
