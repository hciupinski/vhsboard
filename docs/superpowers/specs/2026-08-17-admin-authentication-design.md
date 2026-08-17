# Projekt logowania i autoryzacji administratora

## Cel

Zabezpieczyć istniejące trasy `/admin` i `/admin/:slug` logowaniem Supabase
oraz odczytem roli z `public.profiles`, bez poszerzania CMS o rejestrację,
OAuth, reset haseł albo zarządzanie kontami.

## Zakres i granice

- Task 040 chroni obecny prototyp interfejsu administracyjnego. Jego dane
  pozostają tymczasowo w `src/lib/adminStore.ts`; ich zastąpienie
  autoryzowanym repozytorium Supabase należy do Tasku 050.
- Ochrona widoku nie jest granicą bezpieczeństwa mutacji. RLS z Tasku 010
  pozostaje jedyną ochroną danych i Storage.
- Kod klienta używa wyłącznie istniejącego publicznego klienta Supabase.
  Nie dodaje sekretów, flag `isAdmin` w `localStorage` ani zmiennych
  środowiskowych określających uprawnienia.

## Architektura

### Sesja

`src/lib/auth/session.ts` udostępnia minimalny kontrakt:

```ts
export type AdminSession = { userId: string; email: string; role: "admin" };
export const getAdminSession: () => Promise<AdminSession | null>;
export const signInWithPassword: (email: string, password: string) => Promise<void>;
export const signOut: () => Promise<void>;
```

`getAdminSession` najpierw pobiera sesję przez `supabase.auth.getSession()`.
Gdy sesji nie ma lub zapytanie Auth kończy się błędem, zwraca `null`.
Dla użytkownika z sesją pobiera wyłącznie `role` z `profiles`, filtrowanego po
`id` użytkownika. Zwraca `AdminSession` wyłącznie, gdy wynikowa rola jest
dokładnie równa `admin` i e-mail użytkownika jest dostępny. Błąd odczytu,
brak profilu, `editor` oraz każda nieznana rola zwracają `null`.

`signInWithPassword` wywołuje `supabase.auth.signInWithPassword({ email,
password })` i rzuca jedynie błąd do obsługi formularza. Funkcja oraz
formularz nie logują hasła, tokenów ani odpowiedzi Auth. `signOut` wywołuje
`supabase.auth.signOut()` i propaguje ewentualny błąd bez ujawniania go w UI.

### Bezpieczny powrót po logowaniu

Eksportowany sanitizer `next` przyjmuje tylko ścieżkę `/admin` lub ścieżkę
zaczynającą się od `/admin/`. Odrzuca wartości z niepoprawnym kodowaniem,
adresy absolutne, adresy protokołowo względne zaczynające się od `//`, ścieżki
publiczne i każdy inny format. W razie odrzucenia zwraca `/admin`.

Formularz odczytuje parametr wyszukiwania, ale używa go dopiero po ponownym
sprawdzeniu sanitizatorem. Zapobiega to open redirectowi nawet przy ręcznie
zmodyfikowanym URL.

### Interfejs

`AdminSignInForm` używa istniejących `Label`, `Input` i `Button`. Ma jawne
etykiety e-maila oraz hasła, w trakcie żądania ustawia niedostępność pola i
przycisku, a przy dowolnym błędzie pokazuje wyłącznie tekst:

> Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.

Komunikat korzysta z `role="alert"`. Po udanym logowaniu formularz pobiera
rolę przez `getAdminSession`; konto bez roli `admin` jest wylogowywane i
traktowane jak nieudane logowanie. Wyłącznie administrator jest przenoszony
na oczyszczony lokalny `next`.

`AdminGuard` utrzymuje stan oczekiwania podczas `getAdminSession`. W tym
czasie renderuje niewrażliwy stan ładowania, a nie dzieci. Brak potwierdzonego
administratora przekierowuje do `/admin/login?next=<zakodowana bieżąca
lokalna ścieżka>`. Błąd i brak roli są celowo nierozróżnialne dla użytkownika.

Trasy `/admin` i `/admin/:slug` umieszczają całą dotychczasową zawartość we
wnętrzu `AdminGuard`. Dopiero wewnątrz chronionego komponentu wykonują efekt
odczytu danych prototypu. Nagłówki obu ekranów zawierają widoczny przycisk
„Wyloguj”, który kończy sesję i przechodzi do `/admin/login`. Wszystkie trzy
trasy administracyjne zachowują meta `robots=noindex`.

### Routing i SSR

`src/routes/admin.login.tsx` tworzy trasę `/admin/login`. Plik
`routeTree.gen.ts` pozostaje generowany przez wtyczkę TanStack Router i nie
jest edytowany ręcznie. Root route przestaje wypisywać pełny obiekt błędu w
kliencie; dzięki temu nie ujawnia szczegółu ewentualnego błędu Auth, który
przedostałby się do error boundary. Nie uruchamia odczytu sesji na serwerze i
nie wprowadza globalnego magazynu autoryzacji.

## Obsługa błędów

- Błędy Auth, profilu i wylogowania nie ujawniają wrażliwych szczegółów.
- Użytkownik formularza widzi neutralny komunikat uwierzytelnienia.
- Guard odmawia dostępu, gdy sprawdzenie sesji lub profilu zawiedzie.
- Błąd wylogowania pozostawia użytkownika na stronie i pokazuje neutralny
  komunikat przy przycisku; nie zakłada lokalnie, że sesja została zakończona.

## Testy

Testy Vitest obejmą:

1. `getAdminSession`: brak sesji, błąd odczytu profilu, brak profilu, rolę
   `editor`, nieznaną rolę i poprawny minimalny kontrakt dla `admin`.
2. Sanitizer `next`: akceptację `/admin` i `/admin/<slug>`, odrzucenie adresu
   absolutnego, `//host`, `/oferty` i błędnego kodowania.
3. `AdminSignInForm`: semantyczne etykiety, blokadę drugiego submitu podczas
   oczekiwania, neutralny `role="alert"` bez szczegółu błędu Supabase oraz
   lokalne przekierowanie po sukcesie.
4. `AdminGuard`: brak renderowania dzieci przed zakończeniem weryfikacji i
   przekierowanie użytkownika bez roli.

Po zmianach wymagane są pełne komendy: `bun run test`, `bun run lint` i
`bun run build`.
