# Typed local image paths — implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this single task with a regression test first and a final independent review.

**Goal:** Reject renamed, deleted or misspelled repository image references during TypeScript checking.

**Architecture:** Preserve literal keys in the generated catalogue with `as const satisfies Readonly<Record<string, ResponsiveImageAsset>>`. Export `LocalImagePath` from the catalogue and accept it in `getLocalImage`; preserve its runtime missing-image error. Keep runtime CMS carousel lookup unchanged.

**Tech stack:** Existing TypeScript, Bun, Vitest and Sharp; no new dependencies.

**Spec:** Task 1 of the maintainability audit, explicitly authorized for planning, implementation and a new PR from origin/main. Repository constraints: [AGENTS.md](../../AGENTS.md), [architecture](../architecture.md), [design system](../design-system.md).

## Global constraints

- Preserve responsive images, existing photography, Polish copy, routes and static Cloudflare architecture.
- Do not change runtime CMS path validation or legacy aliases.
- This engineering audit task has no client tracker VHS ID; do not attach it to an unrelated client-feedback row.

## Review focus

- Regeneration must retain literal keys, including case-sensitive extensions and nested paths.
- A source rename/removal must reject an old reference after regeneration; stale generated files remain the responsibility of images:check.
- Existing mapped founder images must retain their literal path types without unsafe casts.
- Invalid paths from untyped JavaScript must retain the runtime error.
- Generated assets and visual output must stay unchanged.

## Task 1: Type the local image contract

**Files:** scripts/image-assets.ts; src/lib/images/local-assets.generated.ts; src/lib/images/responsive.ts; src/routes/o-nas.tsx; scripts/check-image-assets.test.ts; src/lib/images/responsive.test.ts; docs/deployment-runbook.md.

**Interfaces:** `LocalImagePath = keyof typeof LOCAL_IMAGE_ASSETS`; `getLocalImage(path: LocalImagePath): ResponsiveImageAsset`.

- [ ] Add a compiler-backed fixture test: generate a real image catalogue and compile valid nested paths, arbitrary strings, missing keys and direct invalid catalogue indexing using @ts-expect-error. It must fail before the production changes.
- [ ] Add runtime regression tests for a valid image and an invalid untyped path; typecheck must reject widened catalogue/function keys.
- [ ] Preserve catalogue keys in the generator, regenerate the catalogue from the unchanged manifest, narrow getLocalImage and retain mapped founder path literals with as const.
- [ ] Document images:generate → images:check → typecheck after image changes.
- [ ] Run focused tests, typecheck, full tests, lint, full build, images:check and check:seo.
- [ ] Serve the built static artifact and verify real image loading on desktop and mobile, capturing screenshots.
- [ ] Request independent review, fix actionable findings, commit, push and open/attach a PR to main. Do not deploy or merge.

## Execution notes

- Base: origin/main 56d2c5c47595fa50918894a18b09c6337c9f437c.
- Earlier invalid homepage/camp references were already repaired on this base; no replacement photography is needed.

## Verification record

- Compiler-backed regression: failed before the change with four unused
  `@ts-expect-error` directives; all four invalid references now produce errors.
- `bun run typecheck`: passed.
- `bun run test`: 82 files / 592 tests passed. Local verification uses ignored
  `.env.local` public placeholders matching the CI configuration, not production
  Supabase access. Without required public site variables, the initial baseline
  failed in environment-dependent suites.
- `bun run lint`: passed, with seven existing Fast Refresh warnings.
- `bun run build`: passed, including all eight prerender targets.
- `bun run images:check` and `bun run check:seo`: passed.
- Independent code review: no findings; reviewer independently reran typecheck,
  images:check and all nine focused image tests.
- Browser: static `.output/public`, http://127.0.0.1:4187/o-nas/ at 1440×1000
  and http://127.0.0.1:4187/obozy/ at 390×844. Visible generated AVIF images
  loaded successfully, including all three founder carousel frames; no horizontal
  overflow. The homepage event/camp/trip images also loaded at 1280×720.
- Screenshots in the project Drive folder:
  [About desktop](https://drive.google.com/file/d/1mPZRDSWlVltF6xbsE0ONOThofBTvMVG0/view),
  [Founder carousel desktop](https://drive.google.com/file/d/1iuM2fClwuE6ujhF7dnIig3KAQ-J7mJSh/view),
  [Camps mobile](https://drive.google.com/file/d/1LWz0st86bwfNO7UtRWBo6SfYrOq8whDR/view).
- Verification applies to this branch's local build; it is not a production deployment.
