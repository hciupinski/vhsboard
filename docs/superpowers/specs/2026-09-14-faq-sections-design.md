# Sekcje FAQ dla wyjazdów i obozów — projekt

## Cel

Dodać pod listami aktualnych ofert na stronach `/wyjazdy` i `/obozy` dostępne, indeksowalne sekcje „Najczęściej zadawane pytania”. Obie strony wykorzystują jeden komponent prezentacyjny, ale dostają własne zestawy pytań i odpowiedzi.

## Zakres

- `/wyjazdy` otrzymuje sześć odpowiedzi dla dorosłych uczestników: poziom, zakres ceny, dojazd, sprzęt, zakwaterowanie i zapisy.
- `/obozy` otrzymuje sześć odpowiedzi dla rodziców: wiek i poziom, opieka, przebieg dnia, wyżywienie i transport, sprzęt oraz zapisy.
- Treść jest statyczna i należy do publicznej warstwy marketingowej, a nie do danych oferty ani CMS.
- Odpowiedzi dotyczące zmiennych warunków odsyłają do szczegółów konkretnej oferty; nie deklarują stałych cen, transportu, posiłków ani liczebności opieki.

## Architektura

`src/lib/faq.ts` będzie pojedynczym źródłem polskiej treści i typu `FaqItem`. `FaqSection` będzie małym komponentem publicznym opartym na istniejącym Radix Accordion: renderuje semantyczne `<section>`, nagłówek `h2` i pojedynczo rozwijane, możliwe do zamknięcia odpowiedzi.

Strony list ofert importują odpowiedni zestaw danych i umieszczają komponent bezpośrednio po sekcji aktualnych ofert. Nie dodajemy FAQPage JSON-LD: komponentowe FAQ i czytelny HTML realizują cel treści SEO, a schema FAQ nie jest potrzebna do działania i nie powinna być wprowadzana bez odrębnej strategii SEO.

## Dokładna treść

### Wyjazdy

1. **Czy muszę mieć doświadczenie na desce?** — Każda oferta opisuje poziom, dla którego jest przygotowana. Jeśli zaczynasz, wybierz termin oznaczony jako odpowiedni dla początkujących; przed zapisem sprawdź opis wyjazdu lub napisz do VHSBOARD.
2. **Co obejmuje cena wyjazdu?** — Zakres świadczeń jest podany przy każdym terminie. W szczegółach znajdziesz informacje o noclegach, zajęciach, transferach, sprzęcie i pozycjach opłacanych osobno.
3. **Jak wygląda dojazd na wyjazd?** — Sposób dojazdu zależy od kierunku. Informację o miejscu zbiórki, transferach i organizacji podróży publikujemy w opisie konkretnej oferty.
4. **Czy muszę zabrać własny sprzęt?** — To zależy od programu i poziomu zaawansowania. Lista rzeczy do zabrania oraz dostępność sprzętu są zawsze opisane przy danym wyjeździe.
5. **Z kim będę mieszkać na miejscu?** — Informacje o rodzaju zakwaterowania i układzie pokoi podajemy w szczegółach oferty. Jedziesz samodzielnie? To normalne — wyjazdy są pomyślane tak, aby łatwo poznać ekipę.
6. **Jak zapisać się na wyjazd?** — Wejdź w wybrany termin i użyj przycisku zapisów prowadzącego do TripAhead. Po drodze sprawdzisz aktualną cenę, dostępność oraz zasady rezerwacji.

### Obozy

1. **Dla dzieci w jakim wieku są obozy?** — Przedział wieku i poziom aktywności podajemy przy każdym turnusie. Dzięki temu rodzic może wybrać program odpowiedni dla dziecka.
2. **Czy dziecko musi już umieć jeździć?** — Nie każdy obóz wymaga wcześniejszego doświadczenia. Opis turnusu wskazuje, czy przyjmujemy osoby początkujące i jak dzielimy grupy według umiejętności.
3. **Kto opiekuje się uczestnikami?** — Zajęcia prowadzą instruktorzy, a organizacja dnia i opieka są opisane przy wybranym turnusie. Przed zapisem warto sprawdzić również informacje dla rodziców na stronie oferty.
4. **Jak wygląda typowy dzień na obozie?** — Program łączy aktywności na desce, przerwy na odpoczynek i czas z grupą. Dokładny plan dnia zależy od sezonu, miejsca oraz rodzaju turnusu.
5. **Czy posiłki, transport i sprzęt są w cenie?** — Te elementy różnią się między obozami. Aktualny zakres świadczeń oraz ewentualne rzeczy do zabrania znajdziesz w opisie konkretnego terminu.
6. **Jak zapisać dziecko na obóz?** — Otwórz wybrany turnus i przejdź przez przycisk zapisów do TripAhead. Przed potwierdzeniem sprawdzisz cenę, dostępność i informacje organizacyjne.

## Dostępność i wygląd

- Zachowaj język polski, ciepły editorialowy charakter i istniejące tokeny Tailwind.
- Każdy akordeon ma przycisk z widocznym fokusem dostarczanym przez istniejący komponent UI, nagłówki i odpowiedzi są czytelne dla klawiatury oraz czytników ekranu.
- Sekcja ma własny `h2`, odpowiedni `aria-labelledby` i kolejność DOM po aktualnych ofertach.

## Weryfikacja

- Test jednostkowy danych chroni zestawy tematów obu stron.
- Test komponentu sprawdza nagłówek i rozwijanie odpowiedzi z klawiaturą/myszą.
- Testy obu tras potwierdzają widoczność FAQ po nagłówku listy ofert.
- Pełna weryfikacja obejmuje `bun run test`, `bun run lint` i `bun run build`.
