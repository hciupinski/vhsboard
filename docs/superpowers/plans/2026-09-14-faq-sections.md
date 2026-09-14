# FAQ Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reusable, accessible Polish FAQ sections directly below the published-offer lists on `/wyjazdy` and `/obozy`.

**Architecture:** Keep the page-specific FAQ copy in a small typed public-content module. Render it with one public `FaqSection` component that composes the existing Radix accordion primitive, then pass the appropriate collection from each listing route.

**Tech Stack:** React 19, TypeScript, TanStack Router and Query, Tailwind CSS 4, Radix Accordion, Vitest and Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-14-faq-sections-design.md`

## Global Constraints

- Visitor-visible copy and meaningful accessibility text must be in Polish.
- Reuse the existing `src/components/ui/accordion.tsx`; add no dependencies.
- Place the FAQ after current offers on `/wyjazdy` and `/obozy`.
- Keep conditions that vary by offer on the offer page; do not promise prices, transport, meals, equipment, group ratios or availability in global FAQ text.
- Preserve mobile-first layout, semantic headings, visible focus and readable contrast.
- Verify with `bun run test`, `bun run lint`, and `bun run build`.

---

### Task 1: Typed public FAQ content

**Files:**
- Create: `src/lib/faq.ts`
- Test: `src/lib/faq.test.ts`

**Interfaces:**
- Produces: `export type FaqItem = { question: string; answer: string }`.
- Produces: `export const tripFaqItems: readonly FaqItem[]` and `export const campFaqItems: readonly FaqItem[]`, each containing six Polish entries specified in the design document.

- [x] **Step 1: Write the failing content contract test**

```tsx
import { describe, expect, it } from "vitest";
import { campFaqItems, tripFaqItems } from "./faq";

describe("public FAQ content", () => {
  it("keeps six trip questions about joining and organisation", () => {
    expect(tripFaqItems.map(({ question }) => question)).toEqual([
      "Czy muszę mieć doświadczenie na desce?",
      "Co obejmuje cena wyjazdu?",
      "Jak wygląda dojazd na wyjazd?",
      "Czy muszę zabrać własny sprzęt?",
      "Z kim będę mieszkać na miejscu?",
      "Jak zapisać się na wyjazd?",
    ]);
  });

  it("keeps six parent-focused camp questions", () => {
    expect(campFaqItems.map(({ question }) => question)).toEqual([
      "Dla dzieci w jakim wieku są obozy?",
      "Czy dziecko musi już umieć jeździć?",
      "Kto opiekuje się uczestnikami?",
      "Jak wygląda typowy dzień na obozie?",
      "Czy posiłki, transport i sprzęt są w cenie?",
      "Jak zapisać dziecko na obóz?",
    ]);
  });
});
```

- [x] **Step 2: Verify the test is red**

Run: `bun run test src/lib/faq.test.ts`

Expected: FAIL because `./faq` does not exist.

- [x] **Step 3: Implement the typed content**

Create `FaqItem` and the two `readonly` collections using the exact questions and restrained answers from `docs/superpowers/specs/2026-09-14-faq-sections-design.md`.

- [x] **Step 4: Verify the content contract is green**

Run: `bun run test src/lib/faq.test.ts`

Expected: PASS with two tests.

- [x] **Step 5: Commit**

```bash
git add src/lib/faq.ts src/lib/faq.test.ts docs/superpowers/specs/2026-09-14-faq-sections-design.md docs/superpowers/plans/2026-09-14-faq-sections.md
git commit -m "feat: add public FAQ content"
```

### Task 2: Reusable accessible FAQ section

**Files:**
- Create: `src/components/public/FaqSection.tsx`
- Test: `src/components/public/FaqSection.test.tsx`

**Interfaces:**
- Consumes: `FaqItem` from `@/lib/faq` and `Accordion`, `AccordionContent`, `AccordionItem`, `AccordionTrigger` from `@/components/ui/accordion`.
- Produces: `FaqSection({ headingId, items }: { headingId: string; items: readonly FaqItem[] }): JSX.Element`.

- [x] **Step 1: Write the failing interaction test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FaqSection } from "./FaqSection";

describe("FaqSection", () => {
  it("exposes a Polish FAQ heading and opens an answer on request", async () => {
    const user = userEvent.setup();
    render(
      <FaqSection
        headingId="trip-faq-heading"
        items={[{ question: "Czy pytanie jest widoczne?", answer: "Tak, wraz z odpowiedzią." }]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Najczęściej zadawane pytania" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Czy pytanie jest widoczne?" }));
    expect(screen.getByText("Tak, wraz z odpowiedzią.")).toBeVisible();
  });
});
```

- [x] **Step 2: Verify the test is red**

Run: `bun run test src/components/public/FaqSection.test.tsx`

Expected: FAIL because `./FaqSection` does not exist.

- [x] **Step 3: Implement the component**

Render a `<section aria-labelledby={headingId}>` with a `h2` labelled `Najczęściej zadawane pytania`, a short Polish introduction, and `Accordion type="single" collapsible`. Map each question to an `AccordionItem` with a stable `faq-${index}` value, `AccordionTrigger` and `AccordionContent`. Use the project’s `max-w-6xl`, `px-5`, `py-16 sm:py-20`, border and text token classes.

- [x] **Step 4: Verify the interaction test is green**

Run: `bun run test src/components/public/FaqSection.test.tsx`

Expected: PASS with one test.

- [x] **Step 5: Commit**

```bash
git add src/components/public/FaqSection.tsx src/components/public/FaqSection.test.tsx
git commit -m "feat: add reusable FAQ section"
```

### Task 3: Render the correct FAQ after each offer list

**Files:**
- Modify: `src/routes/wyjazdy.index.tsx`
- Modify: `src/routes/wyjazdy.index.test.tsx`
- Modify: `src/routes/obozy.index.tsx`
- Create: `src/routes/obozy.index.test.tsx`

**Interfaces:**
- Consumes: `FaqSection`, `tripFaqItems`, `campFaqItems`.
- Produces: visible FAQ immediately below the list sections on both listing routes.

- [x] **Step 1: Write failing route assertions**

Add the following to the existing successful-offer test in `src/routes/wyjazdy.index.test.tsx`:

```tsx
const offersHeading = screen.getByRole("heading", { name: /aktualne kierunki/i });
const faqHeading = screen.getByRole("heading", { name: "Najczęściej zadawane pytania" });
expect(offersHeading.compareDocumentPosition(faqHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
expect(screen.getByRole("button", { name: "Jak zapisać się na wyjazd?" })).toBeVisible();
```

Create the camp route test by following the query-client/router wrapper used in `wyjazdy.index.test.tsx`, mock `listPublishedOffers`, render `/obozy`, and assert:

```tsx
expect(screen.getByRole("heading", { name: /najbliższe terminy/i })).toBeVisible();
expect(screen.getByRole("heading", { name: "Najczęściej zadawane pytania" })).toBeVisible();
expect(screen.getByRole("button", { name: "Jak zapisać dziecko na obóz?" })).toBeVisible();
```

- [x] **Step 2: Verify the route tests are red**

Run: `bun run test src/routes/wyjazdy.index.test.tsx src/routes/obozy.index.test.tsx`

Expected: FAIL because neither route renders the FAQ heading.

- [x] **Step 3: Compose the component in each listing route**

Import `FaqSection` and `tripFaqItems` into `wyjazdy.index.tsx`. Close the existing offers `<section>` after `OfferListState`, then render `<FaqSection headingId="trip-faq-heading" items={tripFaqItems} />` immediately afterward.

Import `FaqSection` and `campFaqItems` into `obozy.index.tsx`. Render `<FaqSection headingId="camp-faq-heading" items={campFaqItems} />` immediately after the `current-camps-heading` section.

- [x] **Step 4: Verify the route tests are green**

Run: `bun run test src/routes/wyjazdy.index.test.tsx src/routes/obozy.index.test.tsx`

Expected: PASS with all assertions.

- [x] **Step 5: Commit**

```bash
git add src/routes/wyjazdy.index.tsx src/routes/wyjazdy.index.test.tsx src/routes/obozy.index.tsx src/routes/obozy.index.test.tsx
git commit -m "feat: show FAQ below offer lists"
```

### Task 4: Full verification

**Files:**
- Verify only: all files changed by Tasks 1–3.

**Interfaces:**
- Consumes: completed feature and project test/build configuration.
- Produces: fresh evidence that the feature and existing application checks pass.

- [x] **Step 1: Run all tests**

Run: `bun run test`

Expected: PASS with zero failures.

- [x] **Step 2: Run lint**

Run: `bun run lint`

Expected: exit 0; preserve the six pre-existing Fast Refresh warnings only.

- [x] **Step 3: Run production build**

Run: `bun run build`

Expected: exit 0 and regenerated sitemap output.

- [x] **Step 4: Review the final diff**

Run: `git diff origin/main...HEAD --check && git status --short`

Expected: no whitespace errors and no uncommitted source or documentation changes.

- [x] **Step 5: Commit the final verified state if needed**

```bash
git status --short
```

Expected: clean working tree after the task commits.
