# Weryfikacja odzyskiwania hasła administratora — 02.11.2026

Implementacja na `codex/vhs-020-offer-sections`, zakres resetu od `48b2f01` do
`85b2b2b`. Brak pusha, PR i wdrożenia tej partii. Produkcyjne konta, hasła,
role, maile i konfiguracja Auth nie były zmieniane podczas QA.

## Zachowanie

- Link „Nie pamiętasz hasła?” w logowaniu CMS; formularz wysyłki maila Supabase
  i neutralne potwierdzenie bez ujawniania istnienia konta.
- Weryfikacja sesji odzyskiwania, ustawienie i powtórzenie hasła, minimum 8 znaków,
  obsługa autouzupełniania bez przycinania hasła, błędów i ponowienia.
- Obsługa callbacku na dedykowaną trasę oraz powrotu z Dashboardu na stronę główną;
  ważny kontekst przetrwa odświeżenie, zwykły login nie wyświetla zmiany hasła.
- Wygasły link prowadzi do wyjaśnienia i nowej wysyłki. Tokeny i surowy opis błędu
  nie są kopiowane do własnego magazynu, logów ani query. `sessionStorage` zawiera
  jedynie UUID i termin ważności; serwer Auth sprawdza użytkownika.
- Po zmianie hasła czyszczenie kontekstu i globalne wylogowanie. Nieudany logout
  pokazuje osobne ostrzeżenie bez ukrywania sukcesu zmiany hasła.

## Wyniki

| Sprawdzenie                                      | Wynik                                               |
| ------------------------------------------------ | --------------------------------------------------- |
| `bun run typecheck`                              | PASS                                                |
| `bun run test`                                   | PASS: 564 testy, 80 plików                          |
| `bun run lint`                                   | 0 błędów, 7 wcześniejszych ostrzeżeń Fast Refresh   |
| `bun run build`                                  | PASS: 8 prerenderowanych stron i sitemap            |
| `bun run check:seo`                              | PASS                                                |
| Chromium + lokalny Supabase/Mailpit, dev         | Pełny przepływ PASS                                 |
| Chromium + statyczny build, lokalny Auth/Mailpit | Kroki funkcjonalne PASS; uwaga o hydratacji poniżej |

Rzeczywisty lokalny mail → weryfikacja jednorazowego linku → callback na `/` →
formularz → odświeżenie → zmiana hasła → stare hasło odrzucone → logowanie nowym
hasłem do CMS z kontrolą roli. Sprawdzono zwykłą sesję bez odzyskiwania i
`otp_expired`, mobilny viewport 390×844, desktop 1440×900, kolejność Tab i brak
poziomego przepełnienia. Zrzuty obejrzano. Żadnych produkcyjnych wysyłek.

Dowody lokalne (ignorowane przez Git):
`.superpowers/evidence/2026-11-02-password-recovery/` — `local-auth-e2e.json`,
`static-local-auth-e2e.json` i zrzuty formularza, sukcesu oraz wygasłego linku.
Statyczne pliki podano przez przechwycenie żądań Playwright; docelowy origin
localhost/127.0.0.1:3000 zachowano. Przekierowanie weryfikacji odczytano z lokalnego
Auth i otwarto jawnie, ponieważ Playwright nie przechwytuje kolejnego żądania
w łańcuchu przekierowań. Lokalny serwis mailowy to Mailpit (nie stare API Inbucket).

Statyczna powłoka CMS wywołuje recoverable React #418 przy hydratacji, również
na dotychczasowej trasie `/admin/login`. Kroki resetu i logowania zakończyły się
sukcesem; ostrzeżenia zapisano osobno, pozostałych błędów JS nie było. Kwestia
wspólnej powłoki została oceniona w review opisanym poniżej; nie uznajemy tego
za bezbłędny test konsoli.

## Decyzje wykonawcze i ich koszt

1. Polecenie wdrożenia pełnego resetu potraktowano jako autoryzację rutynowych
   decyzji UX/API opisanych w specyfikacji. Koszt: szczegóły wykonawcy wymagają
   oceny wraz z kodem, bez dodatkowej rundy pytań.
2. Kontynuowano bieżący branch zamiast tworzyć kolejny worktree, zgodnie z
   dotychczasowym sposobem pracy. Koszt: branch zawiera też poprawki logowania
   i sekcji ofert.
3. Globalny logout po sukcesie celowo unieważnia sesje konta. Błąd wylogowania
   nie oznacza błędu zapisu nowego hasła.
4. Lokalnego użytkownika QA przygotowano jednorazowo przez SQL, ponieważ stary
   działający lokalny Auth nie przyjmuje service JWT wygenerowanego przez nowsze
   CLI. Nie zmieniano konfiguracji działającego Auth; konto i jego wiadomości
   testowe usunięto po weryfikacji.

## Konfiguracja przed użyciem na hostowanym Auth

Dodaj dokładne trzy Redirect URLs z
[runbooka](../supabase-runbook.md#konfiguracja-hostowanego-projektu-supabase),
zachowując produkcyjny Site URL i dotychczasowe wpisy. Lokalny config nie
aktualizuje hostowanego projektu. Wymagane jest także wdrożenie frontendu.
`otp_expired` wymaga nowego maila — zmiana kodu nie przywróci ważności starego linku.

## Review

Świeży read-only review (gpt-6-astra): bez Critical i Minor, jeden Important.
Naprawiono utratę fragmentu przy początkowym błędzie sieci/503 Auth. Cztery nowe
przypadki regresji najpierw zawiodły, następnie wszystkie 26 testów resetu przeszło;
pełny zestaw po poprawce: 564/564. Rzeczywisty test lokalnego Auth wymusił 503,
potwierdził zachowanie callbacku i skuteczne odświeżenie, a potem zmianę i login.
Nie przeprowadzano kolejnego review; naprawę potwierdzają testy regresji i E2E.

Decyzje dotyczące obszarów odłożonych przez review:

- Wspólna powłoka statyczna CMS: konfiguracja i kod powłoki są identyczne jak
  przed tą funkcją, a istniejący ekran logowania także zgłasza React418. Pozostaje
  do osobnej naprawy. Koszt: recoverable ostrzeżenia hydratacji nadal występują;
  nie stwierdzono utraty funkcjonalności resetu lub logowania.
- Konfiguracja hostowanego Auth pozostaje warunkiem wdrożenia. Zmieniono lokalny
  config i runbook; nie używano produkcyjnej sesji zarządzania. Koszt: bez dodania
  dokładnych adresów lokalna wysyłka z hostowanego Auth może wrócić na produkcję.

Nie odłożono drobnych uwag review. Po końcowym buildzie ponownie otwarto ekran
resetu na serwerze deweloperskim localhost:3000: formularz gotowy, brak nieudanych
odpowiedzi HTTP.
