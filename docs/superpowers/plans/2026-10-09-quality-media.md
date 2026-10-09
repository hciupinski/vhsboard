# VHSBOARD Media Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zmniejszyć transfer fotografii, serwować fonty lokalnie i zapewnić trwałe grafiki udostępniania.

**Architecture:** Lokalne warianty zdjęć i obrazy OG generuje developerski skrypt Sharp; pliki wynikowe są wersjonowane, więc produkcyjny build nie wymaga obróbki mediów ani nowej usługi. Browser optymalizuje wyłącznie nowe uploady CMS. OG ofert pozostaje ogólny zgodnie z architekturą JS.

**Tech Stack:** Bun, Sharp (dev dependency), React, Canvas, Supabase Storage, Fontsource, Vitest.

**Spec:** [Wspólny zakres i kryteria](../specs/2026-10-09-site-quality-improvements.md).

## Global Constraints

- Oferty pozostają pobierane przez JavaScript z Supabase.
- Zachowujemy zewnętrzne CTA TripAhead.
- Treści i znaczące opisy alternatywne pozostają po polsku.
- Zachowujemy semantyczne tokeny OKLCH, zdjęcia, Bebas Neue i Barlow oraz obecny charakter marki.
- Nowe zależności: tylko `sharp` jako narzędzie developerskie oraz pakiety fontów `@fontsource/bebas-neue` i `@fontsource/barlow`.

## Review Focus

- Klucz zapisany w CMS przed zmianą eksportu nadal rozwiązuje obraz — catalogue test w zadaniu 4a.
- Mała/pionowa fotografia nie jest powiększana ani obracana błędnie — test rozmiarów i inspekcja EXIF w zadaniach 4a/4b.
- Błąd dekodowania/Canvas nie może pozostawić rekordu lub obiektu Storage — repository test w zadaniu 4b.
- Polskie diakrytyki muszą działać po odcięciu Google — ręczny odbiór fontów w zadaniu 15.
- Bot bez JS musi otrzymać niewygasający ogólny obraz oferty — test publicznego shellu w zadaniu 16.

---

## Mapa plików

| Pliki                                                                                                                                                                                     | Odpowiedzialność                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `scripts/{generate-image-assets,check-image-assets}.ts`, `src/lib/images/{responsive,local-assets.generated}.ts`, `public/images/generated/*`                                             | Powtarzalny eksport, manifest i kontrola budżetu.            |
| `src/components/public/ResponsiveImage.tsx`, `src/lib/portal-carousel/{types,catalogue}.ts`                                                                                               | Wyświetlanie wariantów z zachowaniem kluczy CMS.             |
| `src/routes/{index,o-nas,eventy,obozy.index}.tsx`, `src/components/home/HomeBrandStory.tsx`, `src/components/events/EventPlaceholderFigure.tsx`, `src/components/public/HeroCarousel.tsx` | Zamiana lokalnych fotografii; pozycje/cropy i alt pozostają. |
| `src/lib/images/{resize,optimization,repository}.ts`                                                                                                                                      | Nowy upload WebP bez migracji danych.                        |
| `src/styles.css`, `src/routes/__root.tsx`, `package.json`, `bun.lock`                                                                                                                     | Lokalne fonty i komendy mediów.                              |
| `scripts/generate-og-images.ts`, `public/og/*`, `src/lib/{social-images,seo}.ts`                                                                                                          | Grafiki i metadane udostępniania.                            |

### Zadanie 4a: Responsywne fotografie lokalne

**Files:** Create pliki z pierwszego wiersza mapy oraz `src/components/public/ResponsiveImage.tsx`, `scripts/check-image-assets.test.ts`; Modify pliki z kolejnych dwóch wierszy, `package.json`, `bun.lock`, `src/lib/portal-carousel/catalogue.test.ts`.

**Interfaces:** `ResponsiveImageAsset = {readonly src: string; readonly width: number; readonly height: number; readonly webpSrcSet: string; readonly avifSrcSet: string}` w `responsive.ts`. Manifest `LOCAL_IMAGE_ASSETS: Readonly<Record<string, ResponsiveImageAsset>>` ma klucze względem `src/assets`, np. `carousel/hero-surf.jpg`. `ResponsiveImage({image, sizes, alt, ...imgProps}: {image: ResponsiveImageAsset; sizes: string} & Omit<React.ComponentPropsWithoutRef<'img'>, 'src' | 'srcSet' | 'width' | 'height'>)` renderuje picture (AVIF, WebP, img fallback WebP). `PortalCarouselImage` zachowuje `path/src/label` i dodaje opcjonalne `responsive?: ResponsiveImageAsset`. Skrypty eksportują `generateImageAssets(rootDirectory: string): Promise<void>` i `checkImageAssets(rootDirectory: string): Promise<void>`; CLI przekazuje cwd. `EventPlaceholderFigure` zmienia props src na `image: ResponsiveImageAsset`; aktualizować pięć wywołań w eventy.tsx i `src/components/events/EventPlaceholderFigure.test.tsx`.

- [ ] Napisać test catalogue: klucz `carousel/hero-surf.jpg` nadal istnieje i rozwiązuje src na `/images/generated/`, a nie oryginalny jpg. W `check-image-assets.test.ts` użyć tymczasowych wariantów: brak pliku, przekroczony budżet i brak rozmiaru są odrzucane; poprawny komplet przechodzi. Uruchomić oba testy; przed implementacją oczekiwany FAIL.
- [ ] Dodać Sharp jako dev dependency. `generate-image-assets.ts` skanuje istniejące fotografie `src/assets/**/*.{jpg,jpeg,png,webp,avif}`; stosuje EXIF autorotate, resize bez enlargement, szerokości unikalne `min(sourceWidth, 480/960/1600)`. Eksportuje WebP i AVIF oraz typowany manifest, deterministycznie po ścieżce. Nazwy plików zawierają skrót zawartości i szerokość, a ścieżki w DB pozostają kluczami źródła.
- [ ] Ustawić start quality WebP 82 / AVIF 50, obniżać o 5 do minimum odpowiednio 62 / 35. Budżet 480 px: 180 KiB; większe: 450 KiB. Niespełnienie budżetu kończy eksport błędem z nazwą zdjęcia. Źródła pozostają w repo; nie zmieniać cropu bez inspekcji. `images:generate` uruchamia generator; `images:check` uruchamia checker zgodności manifestu, wymiarów, źródeł i budżetów.
- [ ] Zaimplementować ResponsiveImage i zintegrować manifest we wskazanych komponentach. Catalogue korzysta z wygenerowanych rekordów `carousel/`, nie importuje oryginałów przez eager glob. Home fallback korzysta z tych samych rekordów. Zachować oryginalne etykiety, sortowanie i path CMS.
- [ ] Sizes karuzeli `100vw`; topic selector `(min-width: 768px) 33vw, 100vw`; editorial `(min-width: 1024px) 50vw, 100vw`. Dopasować pozostałe sizes do obecnej siatki 1/2/3 kolumn. Pierwszy hero: `loading="eager"`, `fetchPriority="high"`; reszta slajdów: lazy/auto. Pozostałe fotografie poniżej pierwszego ekranu lazy; wszystkie img mają intrinsic width/height. Nie obejmować tym logotypów ani dynamicznych signed URL.
- [ ] Uruchomić `bun run images:generate`, testy i `bun run images:check`; powtórny generator daje pusty diff. Inspekcja zdjęcia pionowego i z EXIF potwierdza orientację. W browser przy 390 i 1440 px sprawdzić `currentSrc`, brak pełnych źródłowych fotografii w Network i identyczne cropy. Dalej `bun run typecheck`, lint, pełny build i check:seo — kod 0.
- [ ] Commit: `perf: serve responsive optimized local photographs`.

### Zadanie 4b: Optymalizacja nowych uploadów CMS

**Files:** Create `src/lib/images/resize.ts`, `src/lib/images/resize.test.ts`, `src/lib/images/optimization.ts`, `src/lib/images/optimization.test.ts`; Modify `src/lib/images/repository.ts`, `src/lib/images/repository.test.ts`.

**Interfaces:** `getResizedDimensions(width: number, height: number, maxEdge: number): {width: number; height: number}`; odrzuca nie-dodatnie/niefinity wartości. `optimizeImageForUpload(file: File): Promise<File>` zwraca WebP z rozszerzeniem `.webp`, max 1920 px i 2 MiB. `uploadOfferImage(...)` zachowuje obecny kontrakt i walidację wejścia do 8 MiB.

- [ ] Test resize: `(4000,3000,1920)` → `{width:1920,height:1440}`, `(600,800,1920)` bez zmian, `(0,800,1920)` throws. Test optimization: dekodowanie daje pionowe 3000×4000 → 1440×1920; wynik MIME image/webp i nazwa .webp. `toBlob=null`, unsupported MIME wyniku i odrzucone dekodowanie odrzucają promise.

  ```ts
  it("keeps small images and caps the long edge", () => {
    expect(getResizedDimensions(4000, 3000, 1920)).toEqual({ width: 1920, height: 1440 });
    expect(getResizedDimensions(600, 800, 1920)).toEqual({ width: 600, height: 800 });
    expect(() => getResizedDimensions(0, 800, 1920)).toThrow();
  });
  ```

- [ ] Test repository mockuje optimizer: path/contentType/Blob używają wynikowego File, alt/category pozostają. Jeśli optimizer throws, `storage.upload` i DB insert nie są wywołane. Dotychczasowa kompensacja błędu insert nadal usuwa dokładnie wgrany obiekt. Uruchomić `bun run test -- src/lib/images`; nowe przypadki mają FAIL.
- [ ] Implementować resize bez enlargement. Optimizer używa `createImageBitmap` z orientacją źródła, Canvas i WebP quality .82/.72/.62 do uzyskania 2 MiB; sprawdza typ Blob. Jeśli nadal za duży lub codec niedostępny, rzuca polski błąd: `Nie udało się przygotować zdjęcia. Wybierz mniejszy plik JPEG, PNG lub WebP.` Bitmap zamykana także przy błędzie.
- [ ] Po obecnej walidacji upload input, przed utworzeniem ścieżki i dostępem do Storage, wykonać optimization. Generować path i contentType z wynikowego File; zachować upsert=false, istniejące RLS i cleanup. Nie przetwarzać PDF dokumentów ani dotychczasowych obiektów.
- [ ] Uruchomić testy modułu, typecheck, lint i pełny build. Ręcznie w lokalnym/testowym CMS użyć realnego JPEG pionowego i PNG: poprawna orientacja, WebP ≤1920 px/2 MiB i poprawny alt. Nie wykonywać zapisu na produkcji.
- [ ] Commit: `perf: optimize newly uploaded offer images`.

### Zadanie 15: Lokalne fonty

**Files:** Modify `package.json`, `bun.lock`, `src/styles.css`, `src/routes/__root.tsx`.

**Interfaces:** Semantyczne `--font-display` i `--font-sans` oraz nazwy rodzin pozostają; fonty stają się zwykłymi assetami Vite.

- [ ] Zapisać bazowy Network dla home: widoczne requesty Google. Zanotować wygląd tekstu `Zażółć gęślą jaźń — Łódź, Śląsk, 400 zł` w body i nagłówku; to scenariusz akceptacyjny, bez testowania samych klas CSS.
- [ ] Zainstalować oba pakiety Fontsource z wersjami zapisanymi w bun.lock. W styles.css importować Bebas `400.css` oraz Barlow `400.css`, `500.css`, `600.css`, `700.css`, `400-italic.css` przed pozostałymi regułami; domyślne unicode-range obejmują również latin-ext. Usunąć Google stylesheet i oba preconnect z root. Zachować font-display swap i dostarczone licencje pakietów.
- [ ] Uruchomić typecheck, lint, pełny build. Inspekcja output CSS potwierdza lokalne URL fontów i swap. Browser z blokadą fonts.googleapis.com/fonts.gstatic.com: zero requestów do nich, polskie znaki i italic działają; porównać złamania tekstu na 390 i 1440 px. Nie preloadować wszystkich wag.
- [ ] Commit: `perf: self-host brand fonts`.

### Zadanie 16: OG dla marketingu i ogólny OG ofert

**Files:** Create `src/lib/social-images.ts`, `scripts/generate-og-images.ts`, `public/og/{home,about,trips,events,camps,contact,offers}.jpg`; Modify `src/lib/seo{,.test}.ts`, `src/routes/spa-shell.tsx`, sześć marketingowych route head, oba route head ofert, `scripts/check-seo-build{,.test}.ts`, `package.json`.

**Interfaces:** `SocialImage = {path: string; alt: string; width: 1200; height: 630}`; `SOCIAL_IMAGES` ma klucze `home/about/trips/events/camps/contact/offers`. PageMetadataInput dodaje `socialImage?: SocialImage`, domyślnie offers. URLs tworzy canonicalUrl tylko z lokalnej ścieżki; signed/external URL nie są akceptowane. Produces script `og:generate`, eksport `generateOgImages(rootDirectory: string): Promise<void>` i CLI z cwd.

- [ ] Test seo sprawdza `og:image` i `twitter:image` = `${siteUrl}/og/offers.jpg`, dimensions 1200/630, alt, type image/jpeg, `twitter:card=summary_large_image`. Test explicit home wybiera `/og/home.jpg`. Check-seo odrzuca brak JPEG, nieprawidłowe dimensions lub signed URL; publiczny shell zawiera OG już przed JS. Uruchomić testy: oczekiwany FAIL przed rozszerzeniem meta.
- [ ] Generator Sharp tworzy 1200×630 JPEG z istniejących fotografii: home/offers z carousel/hero-surf.jpg, about/contact z about-us/mario-vhs.jpg, trips z main/wyjazdy.jpg, events z main/eventy-1.jpg, camps z main/obozy-zima.jpg. Dodać istniejący logo mark i krótką polską etykietę; nie umieszczać aktualnych cen/dat/liczby miejsc. Budżet 300 KiB, bez zmian źródeł; inspekcja cropu i bezpiecznych marginesów przed commit.
- [ ] Rozszerzyć createPageMetadata o OG image/width/height/type/alt i Twitter card/title/description/image/alt. Sześć marketingowych heads wskazuje właściwy klucz. Oba heads ofert używają offers. Publiczny spa-shell ma ogólny title/description i offers image bez canonical `/spa-shell`; root nie dodaje drugiego zestawu sprzecznych OG. CMS pozostaje noindex.
- [ ] Uruchomić `bun run og:generate`, testy seo/check-seo, typecheck, lint, pełny build i check:seo. Odczytać HTML sześciu stron oraz publicznego shellu bez JS; każde ma pojedynczy obraz absolute HTTPS. Otworzyć lokalne JPEG i potwierdzić 1200×630, budżet i czytelność. Nie deklarować indywidualnego podglądu oferty u botów bez JS.
- [ ] Commit: `feat: add stable social sharing images`.
