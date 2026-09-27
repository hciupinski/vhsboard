# Home Conversion Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the VHSBOARD home page with upcoming published offers, an evidence-based brand story, and a final contact conversion section.

**Architecture:** A pure offer-selection helper and a dedicated TanStack Query option combine existing public trip and camp lists without changing Supabase. Focused home components render the dynamic offers and the two static editorial sections; `src/routes/index.tsx` only composes them and retains the existing hero, selector, public chrome, and JSON-LD.

**Tech Stack:** React 19, TypeScript, TanStack Router and Query, Tailwind CSS 4, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-27-home-conversion-sections-design.md`

## Global Constraints

- Reuse published `trip` and `day_camp` offers only; event services are not an offer kind and remain outside the upcoming-offers list.
- Show at most three dated offers whose `startDate` is today or later; sort by date and then Polish title order.
- Do not add Supabase schema, CMS controls, booking, payments, availability, new dependencies, or JSON-LD.
- Visitor-facing copy and meaningful image alts remain Polish; use existing semantic Tailwind tokens and the `Bebas Neue` / `Barlow` roles.
- Preserve mobile-first layouts, native links, visible focus styles, and a single `h1` on the home page.

## Review Focus

- A published offer without `startDate` never appears under “Najbliższe na radarze”; its date is not guessed.
- An offer started before the supplied date never displaces an actual future offer.
- A trip and a camp with the same date get a stable title-based order, so the card order does not flicker.
- A failed home-offer request leaves visible routes to `/wyjazdy` and `/obozy`, rather than an empty or broken section.
- Every home offer card links to the detail path matching its `offerKind`, not to a booking URL or the wrong category.

---

## File Structure

- Create `src/lib/offers/home-offers.ts`: deterministic filtering and ordering of home-page offers.
- Create `src/lib/offers/home-offers.test.ts`: date, ordering, and limit coverage for the selector.
- Modify `src/lib/offers/query-options.ts`: add the home-only parallel list query.
- Modify `src/lib/offers/query-options.test.ts`: preserve the existing query contracts and cover the new home query.
- Create `src/components/home/HomeOfferCard.tsx`: shared compact public card for a `PublicOffer`.
- Create `src/components/home/HomeOfferCard.test.tsx`: verify trip/camp fields and destination paths.
- Create `src/components/home/HomeUpcomingOffersSection.tsx`: heading, pending, error, empty, and populated states.
- Create `src/components/home/HomeUpcomingOffersSection.test.tsx`: verify all public section states.
- Create `src/components/home/HomeBrandStory.tsx`: verified static story and `/o-nas` link.
- Create `src/components/home/HomeContactCta.tsx`: high-contrast final `/kontakt` conversion block.
- Modify `src/routes/index.tsx`: query offers and compose the three sections after the existing topic selector.
- Modify `src/routes/public-pages.test.tsx`: provide home-offer data and assert the public home integration states.

### Task 1: Deterministic home-offer selection and query option

**Files:**
- Create: `src/lib/offers/home-offers.ts`
- Create: `src/lib/offers/home-offers.test.ts`
- Modify: `src/lib/offers/query-options.ts`
- Modify: `src/lib/offers/query-options.test.ts`

**Interfaces:**
- Consumes: `PublicOffer` from `src/lib/offers/types.ts` and `listPublishedOffers(kind)` from `src/lib/offers/public-repository.ts`.
- Produces: `selectUpcomingHomeOffers(offers: PublicOffer[], today: string, limit?: number): PublicOffer[]` and `homeOffersQueryOptions()` with query key `['home-offers']`.

- [ ] **Step 1: Write the failing selector tests**

Add fixtures for a future trip, a future camp, a past offer, an offer with `startDate: null`, and two same-date offers titled `"Alfa"` and `"Zeta"`. Assert that the selector called with `"2026-09-27"` excludes past/undated items, orders same-date values alphabetically, and truncates to three.

- [ ] **Step 2: Run the selector test to verify it fails**

Run: `bun run test -- src/lib/offers/home-offers.test.ts`

Expected: FAIL because `home-offers.ts` and `selectUpcomingHomeOffers` do not exist.

- [ ] **Step 3: Implement `selectUpcomingHomeOffers` and `homeOffersQueryOptions`**

In `src/lib/offers/home-offers.ts`, retain offers only when `startDate !== null && startDate >= today`; sort by `startDate`, then `title.localeCompare(other.title, 'pl')`; return `slice(0, limit)`, with default `limit = 3`.

In `src/lib/offers/query-options.ts`, implement `homeOffersQueryOptions()` using `Promise.all([listPublishedOffers('trip'), listPublishedOffers('day_camp')])` and return the flattened array. Keep the existing `publishedOffersQueryOptions` contract unchanged.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `bun run test -- src/lib/offers/home-offers.test.ts src/lib/offers/query-options.test.ts`

Expected: PASS; existing offer-list query tests still use their previous query keys and return types.

- [ ] **Step 5: Commit the data boundary**

```bash
git add src/lib/offers/home-offers.ts src/lib/offers/home-offers.test.ts src/lib/offers/query-options.ts src/lib/offers/query-options.test.ts
git commit -m "feat: select upcoming home offers"
```

### Task 2: Shared home offer card and section states

**Files:**
- Create: `src/components/home/HomeOfferCard.tsx`
- Create: `src/components/home/HomeOfferCard.test.tsx`
- Create: `src/components/home/HomeUpcomingOffersSection.tsx`
- Create: `src/components/home/HomeUpcomingOffersSection.test.tsx`

**Interfaces:**
- Consumes: `PublicOffer`, `formatPriceFrom`, `formatTripDates`, and `selectUpcomingHomeOffers` output from Task 1.
- Produces: `HomeOfferCard({ offer }: { offer: PublicOffer })` and `HomeUpcomingOffersSection({ offers, isPending, isError, today })`.

- [ ] **Step 1: Write failing `HomeOfferCard` tests**

Render one trip and one camp with a memory router. Assert that each card exposes its title, location, formatted date, formatted price, and respectively links to `/wyjazdy/<slug>` and `/obozy/<slug>`.

- [ ] **Step 2: Run the card test to verify it fails**

Run: `bun run test -- src/components/home/HomeOfferCard.test.tsx`

Expected: FAIL because `HomeOfferCard` does not exist.

- [ ] **Step 3: Implement `HomeOfferCard`**

Render a single semantic article inside a TanStack `Link`. Resolve the route from `offer.offerKind`; use the hero image only when `heroImageUrl` is non-null, otherwise use the established decorative `bg-sunset-gradient` fallback. Keep the image decorative (`alt=""`) because title, place, date and activity are already adjacent text.

- [ ] **Step 4: Write failing section-state tests**

Add tests for the section heading `NAJBLIŻSZE NA RADARZE`, three skeletons while pending, populated cards after selection, the exact empty copy `"Nie mamy teraz opublikowanych najbliższych terminów."`, and error copy with links named `"Zobacz wyjazdy"` and `"Zobacz obozy"`.

- [ ] **Step 5: Implement `HomeUpcomingOffersSection`**

Use `aria-labelledby="home-upcoming-heading"`, a responsive one-to-three-column card grid, and `selectUpcomingHomeOffers(offers, today)`. Render no retry mutation button: the recoverable public fallback is the two category links required by the spec. The component receives the already-computed `isPending` and `isError` values and must not make its own query.

- [ ] **Step 6: Run focused component tests to verify they pass**

Run: `bun run test -- src/components/home/HomeOfferCard.test.tsx src/components/home/HomeUpcomingOffersSection.test.tsx`

Expected: PASS; trip/camp routes, empty state, and error fallback all remain accessible.

- [ ] **Step 7: Commit the offer presentation**

```bash
git add src/components/home/HomeOfferCard.tsx src/components/home/HomeOfferCard.test.tsx src/components/home/HomeUpcomingOffersSection.tsx src/components/home/HomeUpcomingOffersSection.test.tsx
git commit -m "feat: add upcoming offers to home"
```

### Task 3: Brand story, final CTA, and home-page composition

**Files:**
- Create: `src/components/home/HomeBrandStory.tsx`
- Create: `src/components/home/HomeContactCta.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/public-pages.test.tsx`

**Interfaces:**
- Consumes: `homeOffersQueryOptions()` from Task 1 and `HomeUpcomingOffersSection` from Task 2.
- Produces: a home route that keeps its existing hero and selector, then renders upcoming offers, the brand story, and the final CTA in that order.

- [ ] **Step 1: Write failing home-route tests**

Mock `listPublishedOffers` in `src/routes/public-pages.test.tsx`; return a trip and camp with dates in `2099` so they remain future at every test run. Assert the home page renders the headings `NAJBLIŻSZE NA RADARZE`, `NIEWAŻNE GDZIE. WAŻNE, ŻE NA DESCE` and `GOTOWY NA COŚ POZA PLANEM?`; assert links to the two offer details, `/o-nas`, `/kontakt`, and `/wyjazdy`. Add an error fixture that proves the category fallback links remain visible.

- [ ] **Step 2: Run the home-route test to verify it fails**

Run: `bun run test -- src/routes/public-pages.test.tsx`

Expected: FAIL because the route does not render the new headings or request `homeOffersQueryOptions()`.

- [ ] **Step 3: Implement `HomeBrandStory` and `HomeContactCta`**

`HomeBrandStory` imports `@/assets/about-us/mario-vhs.jpg`, uses alt `"Uczestnicy surf campu VHS ułożeni w znak VHS na plaży"`, repeats only the verified 2017/local-biuro/kameralne-wyjazdy story from `/o-nas`, and links to `/o-nas` with `Poznaj VHSBOARD`.

`HomeContactCta` uses `bg-foreground text-background`, heading `GOTOWY NA COŚ POZA PLANEM?`, primary button text `Napisz do nas` to `/kontakt`, and secondary text link `Zobacz wyjazdy` to `/wyjazdy`.

- [ ] **Step 4: Compose the home page and update metadata**

In `src/routes/index.tsx`, call `useQuery(homeOffersQueryOptions())`, derive `today` as `new Date().toISOString().slice(0, 10)`, and render `HomeUpcomingOffersSection` immediately after the topic selector. Render `HomeBrandStory` next, then `HomeContactCta` immediately before `PublicFooter`. Update the home description to: `"Wyjazdy surfowe i snowboardowe, obozy sportowe dla dzieci oraz eventy z torem skimboardowym organizowane przez VHSBOARD."` Keep the existing H1, hero carousel, selector, and `PublicJsonLd` call unchanged.

- [ ] **Step 5: Run focused tests to verify they pass**

Run: `bun run test -- src/routes/public-pages.test.tsx src/components/home/HomeOfferCard.test.tsx src/components/home/HomeUpcomingOffersSection.test.tsx`

Expected: PASS; the original hero carousel tests and all new conversion-section paths render under one query client.

- [ ] **Step 6: Commit the page composition**

```bash
git add src/components/home/HomeBrandStory.tsx src/components/home/HomeContactCta.tsx src/routes/index.tsx src/routes/public-pages.test.tsx
git commit -m "feat: extend home conversion journey"
```

### Task 4: Whole-change verification

**Files:**
- Verify: files changed in Tasks 1–3

**Interfaces:**
- Consumes: completed home-query, presentation, and route-composition tasks.
- Produces: release-quality verification evidence without modifying unrelated working-tree changes.

- [ ] **Step 1: Run the full test suite**

Run: `bun run test`

Expected: PASS; report the exact total of passing tests and any existing environment-only console noise separately.

- [ ] **Step 2: Run lint and production build**

Run: `bun run lint && bun run build:ci`

Expected: build passes. Report any pre-existing Fast Refresh warnings distinctly from errors.

- [ ] **Step 3: Inspect the scoped diff**

Run: `git diff --check && git diff -- src/lib/offers/home-offers.ts src/lib/offers/query-options.ts src/components/home src/routes/index.tsx src/routes/public-pages.test.tsx`

Expected: no whitespace errors; no changes to migrations, CMS code, booking integration, or unrelated assets.

- [ ] **Step 4: Commit verification documentation only if it changed**

```bash
git add docs/superpowers/plans/2026-09-27-home-conversion-sections.md
git commit -m "docs: add home conversion sections plan"
```
