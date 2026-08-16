# Runbook Supabase

## Wymagania lokalne

Do pracy z lokalną bazą potrzebne są Docker Desktop oraz Supabase CLI. Projekt
nie wymaga żadnego klucza uprzywilejowanego w aplikacji frontendowej; lokalne
klucze wypisywane przez CLI służą wyłącznie do pracy na własnym komputerze i nie
mogą trafić do repozytorium ani plików `VITE_*` poza publicznym anon key.

Uruchomienie lokalnego stosu:

```bash
supabase start
```

Migracje, linter i test bezpieczeństwa uruchamiaj z katalogu głównego projektu:

```bash
supabase db reset
supabase db lint --fail-on error
supabase test db supabase/tests
```

`db reset` usuwa wyłącznie dane z lokalnej bazy Docker i odtwarza ją z migracji.
Nie uruchamiaj go przeciwko połączonemu środowisku z danymi. Po pracy zatrzymaj
lokalne kontenery:

```bash
supabase stop
```

## Ręczne nadanie roli administratora

W aplikacji nie ma publicznej rejestracji ani panelu zarządzania rolami. Dodaj
konto administratora ręcznie w Supabase Auth (w Dashboardzie projektu lub przez
zaufaną procedurę administracyjną), a następnie pobierz jego UUID. W SQL Editor
uruchomionym jako właściciel bazy wykonaj:

```sql
insert into public.profiles (id, role)
values ('UUID-UZYTKOWNIKA-AUTH', 'admin')
on conflict (id) do update
set role = excluded.role;
```

Nie wykonuj tego zapytania z przeglądarki. RLS celowo nie pozwala klientowi
utworzyć ani zmienić rekordu `profiles`; zalogowany użytkownik może odczytać
wyłącznie własny rekord. Tylko `role = 'admin'` w tym rekordzie daje dostęp do
zapisu ofert, metadanych obrazów i obiektów Storage.

## Obrazy ofert

Bucket `offer-images` jest prywatny. Aplikacja pobiera obraz przez podpisany URL
po autoryzowanym `SELECT`; nie używa `getPublicUrl`. Każdy obiekt musi mieć
ścieżkę dokładnie w formacie:

```text
offers/<offer-id>/<uuid>.<ext>
```

Bucket odrzuca pliki większe niż 50 MiB oraz MIME inne niż `image/jpeg`,
`image/png`, `image/webp` i `image/avif`. Walidacja w przeglądarce nadal
powinna przekazać administratorowi zrozumiały błąd przed uploadem, ale granica
bezpieczeństwa jest egzekwowana również przez Storage.

Drugi segment musi odpowiadać istniejącemu `public.offers.id`. Obiekt staje się
czytelny publicznie dopiero wtedy, gdy jego pełna ścieżka znajduje się w
`public.offer_images.storage_path`, a powiązana oferta ma status `published`.
Szkice i archiwum nie mogą otrzymać publicznego URL-a.

Przed skasowaniem przestarzałego obiektu sprawdź, czy żaden zachowany rekord
metadanych go nie wskazuje:

```sql
select not exists (
  select 1
  from public.offer_images
  where storage_path = 'offers/<offer-id>/<uuid>.<ext>'
) as safe_to_delete;
```

Usuwaj obiekt dopiero, gdy wynik to `true`. Zawartość `description` pozostaje w
jednym polu JSONB i jest walidowana w kliencie jako obiekt z tablicami
`paragraphs`, `highlights`, `included`, `excluded` oraz `schedule` (`day`,
`text`).

## Dalsze migracje i wdrożenia

Każda migracja jest tylko do przodu. Usunięcie kolumny, zmiana jej typu albo
zaostrzenie constraintu wymaga sekwencji expand → migrate data → switch code →
contract w co najmniej dwóch merge’ach. Najpierw wdrażaj bazę, potem frontend;
w trakcie przejścia publiczna aplikacja musi nadal mieć działający kontrakt i
zwracać wyłącznie opublikowane oferty.
