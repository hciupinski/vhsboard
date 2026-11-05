# Publikacja GitHub Release po wdrożeniu

Po pomyślnej weryfikacji wdrożenia produkcyjnego osobny job analizuje pierwszy
rodzic i dokładny wdrożony commit. Jedna nowa notatka `docs/releases/YYYY-MM-DD.N.md`
wyznacza tag i treść GitHub Release. Brak notatek pomija publikację; wiele notatek
zatrzymuje ją. Tag wskazuje wdrożony SHA, a wznowienie sprawdza zgodność taga i
opublikowanego wydania zamiast je nadpisywać. Zwykłe commity main, develop i
wcześniejsze wdrożenia nie powodują publikacji ani uzupełniania historii.

Weryfikacja: testy scenariuszy Git/API, cztery kontrole repozytorium, pełny build,
SEO, składnia workflow i walidator skilla. Implementacja nie wykonuje publikacji.
