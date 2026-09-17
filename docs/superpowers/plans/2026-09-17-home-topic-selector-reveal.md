# Home Topic Selector Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage's three photo-led entry points start compact and reveal their current descriptive content through a desktop hover/focus animation, while keeping mobile cards compact.

**Architecture:** Keep the three existing links and diagonal desktop image layout intact. Add a dedicated details wrapper inside each existing card so CSS can preserve the eyebrow and title in the compact panel while expanding the panel from its lower-left origin to reveal the description and CTA on desktop hover or keyboard focus. Use responsive CSS to make the compact state permanent below the desktop breakpoint.

**Tech Stack:** React 19, TypeScript, TanStack Router, Tailwind CSS 4, Vitest, Testing Library.

**Spec:** `AGENTS.md`, `docs/design-system.md`, and the user-approved design in this task (2026-09-17).

## Global Constraints

- Keep the existing three routes, imagery, Polish copy, semantic links, diagonal desktop dividers, and focus-visible treatment.
- Do not add dependencies, JavaScript hover state, booking behavior, or new site content.
- Desktop begins with only the eyebrow and title visible; hover and keyboard focus reveal the current description and CTA.
- The reveal panel grows from the lower-left corner and uses a smaller backdrop blur than the existing panel.
- Mobile cards keep only the compact eyebrow-and-title state; descriptions and CTAs are not visually displayed or interactively revealed there.
- Respect `prefers-reduced-motion` and retain readable contrast.
- Work on the current `codex/main-boxes` branch as explicitly requested.
- Verify application changes with `bun run lint`, `bun run test`, and `bun run build`.

---

## File Structure

- Modify `src/routes/index.tsx`: group the per-card description and CTA into a styling boundary while keeping each card a single semantic link.
- Modify `src/routes/public-pages.test.tsx`: prove that each entry point retains a dedicated details boundary in the rendered homepage.
- Modify `src/styles.css`: define compact, expanding desktop panels and permanent compact mobile panels for the existing selector classes.
- Create `docs/superpowers/plans/2026-09-17-home-topic-selector-reveal.md`: record the approved implementation and verification steps.

### Task 1: Add a testable content boundary for the reveal state

**Files:**
- Modify: `src/routes/public-pages.test.tsx`
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: the existing `entryPoints` objects in `src/routes/index.tsx`.
- Produces: one `.topic-selector__details` wrapper per `.topic-selector__content`; each wrapper contains that card's description and CTA.

- [x] **Step 1: Write the failing homepage test**

  In the `presents the three main areas as photo-led entry points` test, add this assertion after the existing selector-content checks:

  ```tsx
  expect(
    screen.getByTestId("topic-selector").querySelectorAll(".topic-selector__details"),
  ).toHaveLength(3);
  ```

  This test catches the behavior-breaking mutation where description and CTA are no longer grouped in the CSS boundary that the compact and expanded states control.

- [x] **Step 2: Run the focused test to verify it fails**

  Run: `bun run test src/routes/public-pages.test.tsx`

  Expected: FAIL because the existing cards have no `.topic-selector__details` element.

- [x] **Step 3: Add the minimal content wrapper**

  In `src/routes/index.tsx`, wrap each card's existing description and action span in this element, without changing its copy, route, or nested arrow animation:

  ```tsx
  <div className="topic-selector__details">
    <p className="mt-3 text-sm leading-relaxed text-background/85 sm:text-base">{text}</p>
    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
      {action}
      {/* retain the existing arrow span unchanged */}
    </span>
  </div>
  ```

- [x] **Step 4: Run the focused test to verify it passes**

  Run: `bun run test src/routes/public-pages.test.tsx`

  Expected: PASS, including the existing public-page coverage.

- [x] **Step 5: Commit the content boundary**

  ```bash
  git add src/routes/index.tsx src/routes/public-pages.test.tsx
  git commit -m "test: cover home selector reveal content"
  ```

### Task 2: Implement responsive compact and expanded selector panels

**Files:**
- Modify: `src/styles.css:200-214`
- Modify: `src/styles.css:239-254`

**Interfaces:**
- Consumes: `.topic-selector__content` as the image-overlay panel and `.topic-selector__details` from Task 1 as its revealable content.
- Produces: default compact desktop panels, desktop `:hover` and `:focus-visible` expanded panels, and permanent compact mobile panels.

- [x] **Step 1: Establish the desktop compact state**

  Update `.topic-selector__content` so it remains anchored at the lower-left corner and sizes to its eyebrow and heading. Keep the existing semantic color treatment, reduce `backdrop-filter` from `blur(0.15rem)` to `blur(0.1rem)`, add `transform-origin: bottom left`, and animate `max-inline-size`, `min-block-size`, padding, and background over a short easing curve. Give the panel a compact `max-inline-size` suitable for the title and remove right-aligned text so the panel expands naturally from its left edge.

- [x] **Step 2: Hide details only in the compact desktop state**

  Add `.topic-selector__details` rules that set `display: grid`, `grid-template-rows: 0fr`, `opacity: 0`, `overflow: hidden`, and a matching short transition. Add a child rule so the description and CTA can collapse without affecting the eyebrow or title.

- [x] **Step 3: Add desktop hover and keyboard-focus expansion**

  Add rules for `.topic-selector__item:hover .topic-selector__content`, `.topic-selector__item:focus-visible .topic-selector__content`, and `.topic-selector__item:focus-within .topic-selector__content` that increase the panel's `max-inline-size` and `min-block-size` to the current expanded-card scale. In the matching selectors for `.topic-selector__details`, change the grid row to `1fr`, restore opacity, and add a short reveal delay after the panel starts growing. Apply `motion-reduce:transition-none` equivalents so the final content is available without animation.

- [x] **Step 4: Keep mobile permanently compact**

  Inside the existing `@media (max-width: 767px)` block, neutralize all expanded-panel dimensions and keep `.topic-selector__details` collapsed and non-visible. Do not remove descriptions or CTAs from the DOM; this preserves the accessible names of the existing full-card links while presenting only the requested compact visual state.

- [x] **Step 5: Run the focused regression test**

  Run: `bun run test src/routes/public-pages.test.tsx`

  Expected: PASS because the semantic link and reveal-content boundary remain rendered.

- [x] **Step 6: Manually verify visual behavior**

  Run: `bun run dev`

  Check at a desktop viewport that each panel begins with its eyebrow and title, expands from its lower-left corner on hover and keyboard focus, and reveals its own existing description and CTA. Check below 768px that the three cards stack without horizontal overflow and never reveal details.

- [x] **Step 7: Commit the selector styling**

  ```bash
  git add src/styles.css
  git commit -m "feat: reveal home selector details on desktop"
  ```

### Task 3: Cross-feature verification and plan record

**Files:**
- Modify: `docs/superpowers/plans/2026-09-17-home-topic-selector-reveal.md` (mark completed tasks only)

**Interfaces:**
- Consumes: completed Tasks 1 and 2.
- Produces: fresh formatting, lint, test, build, and visual verification evidence for the delivered homepage interaction.

- [x] **Step 1: Run formatting verification**

  Run: `bunx prettier --check src/routes/index.tsx src/routes/public-pages.test.tsx src/styles.css docs/superpowers/plans/2026-09-17-home-topic-selector-reveal.md`

  Expected: all listed files conform to Prettier.

- [x] **Step 2: Run the required lint check**

  Run: `bun run lint`

  Expected: exit code 0.

- [x] **Step 3: Run the full test suite**

  Run: `bun run test`

  Expected: exit code 0 with no failed tests.

- [x] **Step 4: Run the production build**

  Run: `bun run build`

  Expected: exit code 0, including sitemap generation.

- [x] **Step 5: Review the delivered scope**

  Confirm the diff implements every approved requirement: compact desktop initials, lower-left hover/focus reveal of current content, reduced blur, and permanently compact mobile cards.

- [x] **Step 6: Commit the implementation-plan record**

  ```bash
  git add docs/superpowers/plans/2026-09-17-home-topic-selector-reveal.md
  git commit -m "docs: add home selector reveal plan"
  ```
