# Home Conversion Sections Design

## Goal

Rozbudować stronę główną VHSBOARD po selektorze „Wyjazdy / Eventy / Obozy” o trzy sekcje, które prowadzą odbiorcę od inspiracji do konkretnej oferty lub kontaktu: najbliższe terminy, wiarygodną historię marki oraz końcowe wezwanie do działania.

## Scope and constraints

- Strona główna otrzymuje wyłącznie trzy nowe sekcje: „Najbliższe na radarze”, „Dlaczego VHSBOARD” i końcowe CTA kontaktowe.
- „Najbliższe na radarze” pokazuje maksymalnie trzy opublikowane wyjazdy i obozy z datą rozpoczęcia przypadającą dziś lub w przyszłości. Oferty są sortowane rosnąco po `startDate`, a przy tym samym terminie alfabetycznie po tytule.
- Eventy nie trafiają do listy „Najbliższe na radarze”, ponieważ w obecnym modelu są usługą na zapytanie, a nie publikowaną ofertą z terminem. Pozostają dostępne przez istniejący selektor i kontakt.
- Brak terminów oraz błąd pobierania mają własne, czytelne stany z linkami do pełnych list wyjazdów i obozów. Ładowanie pokazuje trzy dekoracyjne szkielety kart, aby nie powodować skoku układu.
- Historia marki używa wyłącznie obecnych, potwierdzonych informacji ze strony „O nas”: VHSBOARD działa od 2017 roku, organizuje wyjazdy snowboardowe i surfingowe, eventy z torem skimboardowym oraz obozy dla dzieci i młodzieży; ma charakter lokalnego biura podróży i kameralnych wyjazdów. Nie dodajemy opinii, liczników ani niezweryfikowanych obietnic.
- Końcowe CTA prowadzi przede wszystkim do `/kontakt`; drugie, wyraźnie drugorzędne przejście prowadzi do `/wyjazdy`. Nie powstaje mechanizm rezerwacji ani formularz na stronie głównej.
- Treść jest po polsku, korzysta z istniejących tokenów Tailwind, komponentów UI i ma semantyczną strukturę nagłówków. Wszystkie nowe obrazy mają opisowy polski `alt` lub są świadomie dekoracyjne.
- Nie dodajemy migracji Supabase, nowego panelu administracyjnego, nowej zależności, nowego typu oferty ani dodatkowego JSON-LD. Obecne `Organization` i `WebSite` pozostają bez zmian.

## Architecture

### Najbliższe na radarze

`src/lib/offers/home-offers.ts` wprowadza czystą funkcję `selectUpcomingHomeOffers(offers, today, limit)`. Przyjmuje opublikowane `PublicOffer[]`, odrzuca rekordy bez `startDate` i rekordy rozpoczęte przed `today`, sortuje wynik deterministycznie i zwraca maksymalnie trzy elementy. Parametr `today` jest przekazywany przez warstwę widoku, aby testy nie zależały od daty uruchomienia.

`src/lib/offers/query-options.ts` otrzyma `homeOffersQueryOptions()`. Zapytanie pobierze równolegle istniejące listy `trip` i `day_camp`, połączy je bez modyfikowania publicznego repozytorium oraz będzie używane tylko przez stronę główną.

`HomeUpcomingOffersSection` otrzyma wynik oraz stany ładowania i błędu. `HomeOfferCard` będzie wspólną, lekką kartą dla obu rodzajów ofert; sam wybierze prawidłowy adres szczegółu (`/wyjazdy/:slug` albo `/obozy/:slug`) i pokaże aktywność, lokalizację, termin, cenę oraz obraz hero. Nie rozszerzamy istniejących kart list wyjazdów i obozów, aby zachować ich obecne, wyspecjalizowane układy.

### Historia marki

`HomeBrandStory` będzie statyczną sekcją obraz/tekst po liście ofert. Użyje istniejącego zdjęcia `src/assets/about-us/mario-vhs.jpg` i odsyłacza „Poznaj VHSBOARD” do `/o-nas`. Nagłówek oraz dwa krótkie akapity zawrą naturalne, konkretne frazy dotyczące wyjazdów surfingowych i snowboardowych, obozów sportowych oraz eventów, ale bez powtarzania słów kluczowych.

### Końcowe CTA

`HomeContactCta` domknie `main` przed stopką wysokokontrastową sekcją. Jej jedyną akcją główną będzie link „Napisz do nas” do `/kontakt`; akcja drugorzędna „Zobacz wyjazdy” będzie wizualnie słabsza. Sekcja odpowie odbiorcy, który nie wybrał jeszcze konkretnej oferty.

### SEO and accessibility

Strona zachowa pojedynczy `h1` w hero. Nowe sekcje dostaną kolejno `h2`, a karty ofert `h3`, dzięki czemu nazwy usług, miejsc i terminów są widoczne zarówno dla użytkowników, jak i robotów. Metadane strony głównej otrzymają opis obejmujący wyjazdy surfowe i snowboardowe, obozy sportowe oraz eventy. Linki do szczegółów ofert, `/o-nas`, `/kontakt` i `/wyjazdy` wzmacniają wewnętrzne połączenia bez budowania sztucznych stron SEO.

## Testing and completion criteria

- Selekcja ofert jest testowana dla dat przyszłych, dat minionych, braku daty, remisu terminu i limitu trzech kart.
- Karta strony głównej generuje prawidłowe adresy dla wyjazdu i obozu oraz udostępnia podstawowe dane oferty.
- Test trasy strony głównej potwierdza obecność trzech nowych sekcji, aktualnych kart oraz odsyłaczy do szczegółu, „O nas” i kontaktu; obejmuje też stan pusty i błąd pobierania.
- Widok pozostaje mobilny, a klawiatura może aktywować wszystkie linki. Obraz historii marki ma istniejący, opisowy polski alt.
- `bun run test`, `bun run lint` i `bun run build:ci` przechodzą; istniejące ostrzeżenia lintu są raportowane, jeśli pozostaną.

## Out of scope

- Opinie klientów, Instagram feed, galeria społecznościowa i FAQ na stronie głównej.
- Ręczne wybieranie ofert do strony głównej, upload obrazu historii marki i zarządzanie tekstami przez CMS.
- Nowe mechanizmy zapisów, płatności, dostępności, kont klientów lub formularz kontaktowy osadzony na stronie głównej.
