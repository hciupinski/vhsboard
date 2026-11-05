# Skill wydania VHSBOARD

Wydanie powstaje z dokładnego snapshotu świeżego `origin/develop` jako
`releases/YYYY-MM-DD.N` i jest proponowane w PR do `main`. `git-cliff` używa
jawnego zakresu SHA, bez założenia o tagach lub formacie komunikatów. Osobny
plik `docs/releases/YYYY-MM-DD.N.md` zachowuje historię bez edycji wspólnego
changeloga; jego commit po merge wymaga przejrzystego PR synchronizującego main
do develop przed następnym wydaniem. Skill nie wykonuje merge ani deployu.

Przed pierwszym rzeczywistym wydaniem narzędzia muszą trafić na develop przez
zwykły przeglądany PR. Nie kopiujemy lokalnych zmian do gałęzi wydania.

Kontrole: walidacja skilla, syntetyczne repozytorium Git i bare origin (zakres,
komunikaty obu stylów, kolizje), instalacja z lockfile oraz odpowiednie kontrole
repozytorium. Test prawdziwego wydania wymaga późniejszej zgody użytkownika.
