# VHS-054 — Kolejność ofert w CMS

Proponowane nowe zadanie **VHS-054** — wpis nie został jeszcze dodany do trackera. Plan przygotowany przez Sol; implementacja i PR przez Terra po akceptacji tego zakresu. Proponowany branch: `codex/admin-offers-date-order`, w osobnym worktree.

## Zakres i reguły do akceptacji

- Zmiana obejmuje wyłącznie listę `/admin`, wyjazdy i obozy.
- Niezakończone oferty z datą rozpoczęcia: rosnąco po tej dacie. Następnie niezakończone bez daty rozpoczęcia. Na końcu zakończone, również rosnąco po rozpoczęciu; brak początku na końcu grupy. Remisy rozstrzyga tytuł po polsku i `id`.
- Zakończenie oznacza `endDate < dzisiaj` w `Europe/Warsaw`. Koniec dzisiaj i wyjazd trwający pozostają aktywne. Brak daty końcowej nie oznacza zakończenia.
- Zakończone oferty mają wyszarzone zdjęcie. Tylko opublikowanym zakończonym ofertom etykietę „Opublikowana” zastępuje „Zakończone”. Szkice i archiwalne zachowują swoje etykiety; reguła kolejności i wyszarzenia obejmuje wszystkie statusy.
- Obozy korzystają z dat całej oferty, obecnie wyprowadzanych z początku pierwszego i końca ostatniego turnusu. Nie wybieramy najbliższego pozostałego turnusu.
- Jest to stan prezentacji: bez zmiany statusów w bazie, publikacji, publicznych list, podglądu, edycji, archiwizacji, zapytań Supabase ani zależności.

## Implementacja

1. Dodać `src/lib/offers/admin-list.ts` i `src/lib/offers/admin-list.test.ts`. Czyste funkcje `isAdminOfferFinished(offer: Pick<AdminOfferListItem, "endDate">, today: string): boolean` i `sortAdminOffers(offers: readonly AdminOfferListItem[], today: string): AdminOfferListItem[]`. Użyć istniejącego `getTodayInWarsaw` w widoku; nie mutować danych Query.
2. Najpierw testy reguł: przemieszana lista, trwający wyjazd, koniec dziś/wczoraj, brak początku/końca/obu dat, remisy, wszystkie statusy, daty obozu, brak mutacji wejścia. Uruchomić testy i potwierdzić oczekiwane niepowodzenie przed implementacją funkcji, następnie poprawne przejście.
3. Zmodyfikować `src/routes/admin.index.tsx`: renderować wynik sortowania, użyć wspólnej reguły zakończenia, klasy `grayscale` na zdjęciu oraz neutralnego badge „Zakończone”. Zachować czytelność tekstu i wszystkie działania.
4. Rozszerzyć `src/routes/admin.index.test.tsx`: jawna stała data, kolejność kart, etykiety i fotografie, brak zdjęcia oraz zachowanie podglądu i archiwizacji. Obecny test publikacji ma daty czerwca 2026 — ustawić jego zegar, aby wynik nie zależał od dnia wykonania.

## Weryfikacja i dostarczenie

- Testy celowane: `bun run test src/lib/offers/admin-list.test.ts src/routes/admin.index.test.tsx`.
- Obowiązkowe kontrole: `bun run typecheck`, `bun run test`, `bun run lint`, `bun run build`.
- Sprawdzić rzeczywisty autoryzowany `/admin` na desktopie i mobile; potwierdzić kolejność, zakończenie i działania. Wykonać prawdziwe zrzuty ekranu z datą, adresem środowiska, viewportem i wersją.
- Po ponownym odczycie trackera uzupełnić właściwy VHS-054 opisem, weryfikacją i dowodem w projekcie Drive. „Do akceptacji” dopiero po weryfikacji i dowodach; akceptacja klientki pozostaje ręczna. Nie oznaczać lokalnej zmiany jako wdrożonej.
- Zapisać plan do repo na branchu implementacji, utworzyć commit i PR. Nie obejmować cudzych zmian w `bun.lock`, `package.json`, `ListField`, `OfferPriceSection`, `OfferProgramSection`.

## Ograniczenia

Obóz pomiędzy turnusami pozostaje aktywny do ostatniego końca; brak końca nie daje oznaczenia zakończenia. Zrzuty wymagają dostępnej autoryzowanej sesji CMS. Zmiana nie wymaga migracji ani nowych zależności.
