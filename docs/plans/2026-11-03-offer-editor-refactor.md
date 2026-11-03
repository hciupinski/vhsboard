# Offer editor section refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user selected Sol for planning and Terra for implementation; the coordinator reviews independently before the PR.

**Goal:** Split the offer editor into focused section components while preserving its UI, data, validation and parent integration for trips and day camps.

**Architecture:** Keep `OfferEditorForm` as a controlled composition boundary. Move existing section markup and local immutable row operations into explicit components; retain normalization and whole-offer transitions at the composition boundary. Reuse existing `ListField`, UI primitives, and a small extracted field presentation module, without a form engine, context, new library or new local form state.

**Tech Stack:** React 19, TypeScript, Radix Tabs/Select/Switch, Tailwind 4, Vitest and Testing Library.

**Spec:** User-authorized maintainability audit task 8: split `src/components/admin/OfferEditorForm.tsx` by existing sections, anticipate actual reuse, preserve behavior, and deliver a separate PR. Project constraints: [agent guide](../../AGENTS.md), [architecture](../architecture.md), [design system](../design-system.md).

## Global Constraints

- Baseline: refreshed `origin/main` = `89559737b2cc1829dcd275be1bffb2b571e3e16e`; current editor is 1307 lines (the audit's 1211-line count is stale).
- Work only in managed worktree `/Users/hciupinski/.codex/worktrees/offer-editor-refactor/vhsboard`, branch `codex/offer-editor-sections`. Root checkout and task 1 worktree belong to other work.
- Polish copy, DOM semantics, labels/IDs, CSS classes, tab order and error messages remain unchanged. Existing admin/public separation, guards, Supabase/RLS, publication rules, image infrastructure and TripAhead boundary remain unchanged.
- No schema/migration, repository, routing, booking logic, dependency, generic form framework or unrelated refactor changes.
- No production mutations during verification. Browser evidence uses controlled fixtures outside the application bundle.
- Existing tests remain; no weakening assertions or deleting coverage to fit the refactor.
- Tracker `Zgłoszenia!A1:F95` read on 2026-11-03: no maintainability-refactor task exists. VHS-053 is a separate publication bug; do not claim it or edit unrelated client rows. No invented VHS ID.
- User authorized planning and Terra execution together; no routine second approval gate. Product decisions or an actual scope conflict go to the coordinator.

## Design decisions and alternatives

Move sections verbatim, then simplify only the wiring needed to connect them. A schema-driven renderer would obscure existing differences (dates, camp terms, parent legacy copy, resort migration) and is out of scope. Moving only the six bottom helper functions would leave approximately 570 lines of composition/inline sections and would not achieve the requested split. The selected approach extracts both the existing helpers and the visible inline sections while leaving navigation/orchestration recognizable.

`Field` and `CharacterCounter` already repeat across basics, terms, programme, parent and accommodation: extract their exact presentation. `SubtitleField` is the same field shown in two different tabs depending on kind: reuse one implementation. `ListField` already solves repeated string lists: continue using it. Do not merge this field presentation with `offer-sections/SectionFields.tsx`: that module uses different IDs, label styling, counters and card/price behavior. No speculative shared DateField/NumberField, generic row editor, panel shell or public-facing form abstraction.

## Current data and ownership contract

The public export remains `OfferEditorForm` at its existing import path. Props remain:

```ts
{
  value: EditableOfferInput;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (value: EditableOfferInput) => void;
  imageManager?: ReactNode | undefined;
  accommodationImageManager?: ReactNode | undefined;
  resortMapManager?: ReactNode | undefined;
}
```

`EditableOfferInput` is defined in `src/lib/offers/editor-schema.ts`: optional `offerKind`; strings `slug`, `title`, `subtitle`, `shortDescription`, `location`, `bookingUrl`; `activity`; union `content`; nullable dates/group bounds/hero path; numeric duration/price; literal currency PLN; boolean last-places flag. Do not redefine the domain model.

`admin.$slug.tsx` owns formValue, fieldErrors, dirty/saved/action state and mutations. Its callback normalizes content, applies live validation, marks dirty, clears action errors/saved. It derives disabled from mutation pending OR archived. It supplies three independently authorized image managers only after persistence. Form does not save, validate, authenticate, cache, navigate or upload. Preserve single callback updates and all unrelated properties. Sections remain controlled; Radix owns the active tab (`defaultValue="basics"`), with no new reset key or forceMount.

At the form boundary retain `offerKind = value.offerKind ?? "trip"`, typed branch selection, `normalizeOfferContentV2` for content updates, and `changeEditableOfferKind` for the select. Switching kinds resets kind-specific content/dates/group/price/booking/activity exactly as the existing helper does; shared title/slug/subtitle/location/badge/etc survive. Do not preserve hidden kind-specific drafts or normalize top-level changes earlier than today.

## Section and field map

| Tab ID / visible label | Fields and behavior | Error prefixes |
| --- | --- | --- |
| basics / Dane oferty | offer kind; title (120) with auto-follow slug/transliteration; manually editable slug; activity (trip surf/snow/combo, camp wake/snow); location (120); shortDescription (500); badge switch. Trip only subtitle (280), start/end date, duration (1–60), price >=0, readonly PLN, nullable group min/max (1–99), booking URL | offerKind, activity, title, slug, location, shortDescription; trip additionally subtitle, startDate, endDate, durationDays, groupSizeMin, groupSizeMax, priceFrom, currency, bookingUrl |
| story / O wyjeździe or O obozie | paragraphs multiline list; camp only subtitle (280) | content.paragraphs; camp subtitle |
| highlights / W programie | shared highlights list labelled W programie for trip / Atrakcje for camp; trip schedule rows (day,text), add numbered Część N/delete; camp dayProgram (time 120,text 500) add/delete and counters | content.highlights, trip content.schedule / camp content.dayProgram |
| inout / Cena | included/excluded lists with exact visual cards; camp additionally terms and variants | content.included, content.excluded, content.terms |
| parent / Dla rodzica (camp only) | ageRange 120; supervision/safety 500; transport legacy textarea only if property !== undefined; meals optional 500 with nullish-to-empty display | content.parentInfo |
| accommodation / Zakwaterowanie | enabled switch, description 1000 when enabled; disabling retains description; injected accommodation image manager or save-first fallback, even while disabled section | content.accommodation |
| resort / Resort | existing OptionalSectionsEditor: enabled, name, description 3000, mapUrl 2048, supplied map manager; camp legacy venue textarea 500 under original predicate and two-way compatibility rules | content.resort; camp content.venueDescription |
| training / Szkolenia | existing OptionalSectionsEditor: enabled, description, training cards with stable IDs, title/description/price, level/scope | content.training |
| transport / Transport | existing OptionalSectionsEditor: enabled, type/customType, description, journeys assigned by termId; dates/times/places/note, own transport hides journey fields | content.transport |
| insurance / Ubezpieczenie | existing OptionalSectionsEditor: enabled, description/provider/informationUrl; packages (6), risks (12), extensions (12), stable IDs and extra prices | content.insurance |
| photos / Galeria | trip explanatory copy, hero error, injected image manager or save-first fallback | heroImagePath |

Camp terms: maximum two; can remove only when more than one; up/down bounds and labels unchanged; term key is id ?? index. Each term has label 120, startDate/endDate strings, individual booking URL, >=1 price variants with label 120, price number. Empty option price displays blank through `price || ""`; input clearing emits 0 through Number(""). Add term defaults and normalization-generated UUIDs stay exact. Reordering/renaming keeps transport assignments by UUID; deletion normalization prunes the corresponding journey. No new term ID allocation policy.

## Error, input and focus invariants

- `errorFor` chooses an exact error first, otherwise first dotted descendant (not arbitrary string prefix). Preserve every call site's exact vs nested lookup; don't add new errors or ARIA associations during extraction.
- `Field` renders label htmlFor, hint/counter, children and `${id}-error` alert. Existing `state(path,id)` supplies aria-invalid/describedby only where currently used. Preserve explicit ID aliases (`offer-kind`, `short-description`, date/group/booking IDs).
- Tab error map stays exact; a camp subtitle error belongs to story, terms to price, venue to resort; no error becomes attached to multiple tabs. Optional sections use prefix matches. The tab label includes `— zawiera błędy` and decorative bullet.
- Horizontal tab scroller focus handler retains both left/right reveal logic; tabs remain keyboard reachable even when edits are disabled. Preserve Radix mounting/keyboard behavior.
- Date commits call `shouldCommitDateValue(value, validity.badInput)`: incomplete native input does not overwrite; real clear commits null for trip, empty string for terms. Test this using native event validity overrides where jsdom cannot model incomplete entry.
- Required numbers retain Number(value) conversion (clear -> 0); nullable group numbers clear -> null, display null as empty. Do not change zero/NaN/rounding/schema coercion semantics.
- Slug follows title only while empty or equal to previous auto-generated slug; manual override remains, including Polish ł/diacritics/spacing/punctuation behavior.
- Camp resort migration: first enable seeds location + venueDescription; resort description propagates to legacy venue only while blank/equal to previous resort slice; independently customized legacy copy is preserved. Keep this adapter centralized in the form or in the extracted optional-panel wrapper, not duplicated by section.
- Image props are slots: preserve nullish fallback (including explicit null), original tab placement and absence of URL/path editing. They own their disabled behavior; don't clone or replace injected nodes.

## Review Focus

1. Stale controlled callbacks or a local state copy overwriting another tab's edits: stateful cross-tab regression for both kinds.
2. Null/zero/native-incomplete dates changing on extraction: explicit value conversion and callback assertions.
3. Camp term IDs/journey associations changing after reorder/delete: normalized output regression with existing UUID fixture.
4. Camp legacy resort and parent transport/meals values silently disappearing: both synchronized and customized-copy regressions.
5. Disabled/error/focus markup changing when wrappers move: inherited fieldsets, ARIA/error map and actual keyboard browser checks, with the known baseline limitation below.

Known baseline limitation: `TermsEditor` is a section rather than disabled fieldset and its text/date/price inputs lack disabled props; its buttons are disabled. Do not silently fix this behavior in a structural refactor or add a passing assertion claiming those inputs are disabled. Record it in browser evidence and PR limitations; report to coordinator. The baseline legacy venue textarea also lacks the standard `state()` ARIA props; preserve it and record rather than changing scope.

## File structure and interfaces

Create `src/components/admin/offer-editor/` (distinct from existing optional-content `offer-sections/`):

- `EditorField.tsx`: exported `EditorField` (existing Field props, unchanged markup), `CharacterCounter`, `SubtitleField({value: string,error?: string|undefined,disabled:boolean,onChange:(value:string)=>void})`.
- `editor-fields.ts`: exact `errorFor(errors,path)`, `fieldState(errors,path,id?)`, `nullableNumber(value:string): number|null`, `toOfferSlug(value:string):string`, `shouldUpdateDate(event:ChangeEvent<HTMLInputElement>):boolean`. Types for `EditorErrors`, `ContentEditorProps<T extends OfferContent>` = content/errors/disabled/onChange; no React rendering in this utility module.
- `OfferBasicsSection.tsx`: full basics fieldset, exported props value/errors/disabled/onChange identical slices of form Props. Own typed top-level setter and title/slug interaction; delegates trip-only fields to `TripBasicsFields` within this file (single owner, no unnecessary file).
- `OfferStorySection.tsx`: props paragraphs:string[], subtitle:string, isDayCamp:boolean, errors,disabled,onParagraphsChange,onSubtitleChange; renders exact story fieldset.
- `OfferProgramSection.tsx`: props content:OfferContent, offerKind:OfferKind, errors,disabled,onChange:(content:OfferContent)=>void. Shared highlights then `TripScheduleEditor` / `DayCampProgramEditor`, imported explicit controlled editors using ContentEditorProps<TripOfferContent|DayCampContent> with the concrete type in each file.
- `TripScheduleEditor.tsx`, `DayCampProgramEditor.tsx`: exact existing helper bodies, concrete content prop types.
- `OfferPriceSection.tsx`: content:OfferContent, offerKind,errors,disabled,onChange(content); included/excluded and camp `DayCampTermsEditor`.
- `DayCampTermsEditor.tsx`: existing terms editor props content:DayCampContent,errors,disabled,onChange:(terms:DayCampTerm[])=>void. Local update helper/reorder/add/delete remain here.
- `DayCampParentInfoEditor.tsx`: existing concrete content callback contract.
- `OfferAccommodationSection.tsx`: content:OfferContent,errors,disabled,onChange(content),imageManager?:ReactNode|undefined; description/switch and existing slot/fallback. No networking.
- `OfferOptionalSection.tsx`: sectionKey: resort|training|transport|insurance, content:OfferContent, offerKind, location:string, errors,disabled,onChange(content),mapManager?:ReactNode|undefined; camp legacy field + exact compatibility adapter wrapping unchanged `OptionalSectionsEditor`. It is a necessary semantic adapter, not a replacement optional-section engine.
- `OfferPhotosSection.tsx`: isTrip:boolean, heroError?:string|undefined,imageManager?:ReactNode|undefined; exact existing output.

`OfferEditorForm.tsx` keeps Props, tabs/error path map, focus handling, typed content normalization and tab panel composition. Each TabsContent stays here so navigation and sections remain auditable together. Target coordinator roughly 200–300 lines; optimize clarity rather than an arbitrary line quota. No barrel export needed. Internal naming can be minimally adjusted if TypeScript union narrowing demands it; document the reason, keep public contract unchanged.

## Task 1: Pin meaningful missing regression boundaries

**Files:** modify `src/components/admin/OfferEditorForm.test.tsx`; retain route/schema tests unchanged unless additional meaningful cases are needed.

**Interfaces:** exercise only public OfferEditorForm and existing domain helpers. Test helpers may share fixtures locally; no application-only test exports.

- [x] Install existing lockfile dependencies in this worktree using `bun install --frozen-lockfile`; run baseline `bun run test` and record exact result. Investigate/report preexisting failures before attributing them to extraction.
- [x] Add characterization tests before refactor: manual-slug override and title follow; kind switching via actual Select; null group/date clearing and required number/variant zero semantics; incomplete date guard; stateful camp edits across story/program/price/parent; exact+dotted error precedence/ARIA and optional tab error map; all three supplied media slots and fallback cases.
- [x] Add camp terms normalized regression: reorder IDs, rename, update selected variant, add/delete variant limits, add second term limit/remove; verify journey association by UUID survives reorder and deleted journey is removed on normalized output. Use known valid UUIDs.
- [x] Add resort regressions for synchronized updates and independently customized legacy copy; optional accommodation disable/reopen preservation; parent optional meals/legacy transport absence. Preserve existing transport/card tests.
- [x] Run `bun run test -- src/components/admin/OfferEditorForm.test.tsx 'src/routes/admin.$slug.test.tsx' src/lib/offers/editor-schema.test.ts`; expect all pass against original code. Characterization tests should pass baseline: do not invent a RED requirement for unchanged behavior or alter production code to satisfy newly desired behavior. Test gaps that expose baseline defects are reported separately.
- [x] Commit characterization coverage and this plan, with no application changes.

## Task 2: Extract shared field presentation and existing concrete editors

**Files:** create EditorField/editor-fields, TripScheduleEditor, DayCampProgramEditor, DayCampTermsEditor, DayCampParentInfoEditor; modify OfferEditorForm imports/removal.

**Interfaces:** exact contracts above; all editors emit new content/array and preserve unrelated fields. Shared field modules do not import coordinator or route.

- [x] Move Field/counter/helpers without rewriting markup or conversions, use extracted functions at original call sites.
- [ ] Move each existing helper editor one at a time, run targeted OfferEditorForm tests after each logical extraction. Expected: all characterization and existing assertions remain green.
- [x] Run typecheck and route/schema targeted suite; inspect diff for only moved code/imports/types. Commit this independently reviewable extraction.

## Task 3: Extract visible sections and simplify composition

**Files:** create Basics, Story, Program, Price, Accommodation, Optional and Photos sections described above; modify OfferEditorForm.

**Interfaces:** sections receive only relevant controlled values/callbacks as listed. Normalization remains at form boundary, rather than duplicated across children; Basics uses existing changeEditableOfferKind for kind switch.

- [x] Extract basics/subtitle and verify title/slug/kind/date/number tests; preserve trip-only nested field layout.
- [x] Extract story/program/price and connect immutable content callbacks to one normalized form update. Verify list/schedule/camp term/UUID tests and absence of callbacks caused merely by rendering or tab switching.
- [x] Extract parent/accommodation/media panels; extract optional adapter verbatim, keep existing OptionalSectionsEditor/SectionFields unchanged. Verify legacy synchronization, section retention, media slots and error markers.
- [x] Review all fieldsets/disabled attributes, IDs, error lookup call sites, TabContent values and classes against base. Run targeted suite + typecheck; commit extraction.

## Task 4: Verify actual UI, review and deliver

**Files:** update this plan's execution record with commands, versions and evidence; add a compact QA report only if useful. Store actual screenshots in a persistent project evidence location, not secrets or expiring tool references.

- [x] Run required `bun run typecheck`, `bun run test`, `bun run lint`, `bun run build`. Read output; distinguish preexisting warnings from failures. Build must be full prerender build, not only build:ci. Run check:seo against its output; images:check if generated/local image imports or assets become touched (otherwise explicitly record not applicable).
- [x] Serve the actual branch locally; use the browser tools with controlled fixtures. Prefer a temporary external harness mounting real OfferEditorForm + same styles/controlled callback, or local browser API mocks around real admin route. No committed auth bypass, guard replacement or production data writes. Describe which boundary was exercised; route mutation integration remains covered by existing tests if harness mounts only form.
- [x] Capture before/after real screenshots for trip and day_camp at desktop 1440×900 and mobile 390×844, representative basics/program/price/legacy/optional error states. Compare copy/layout/controls visually. Verify keyboard tablist arrows/Home/End and reveal/focus, responsive overflow, inline errors, cross-tab retained changes and disabled states. Record the baseline terms-input limitation rather than hiding it.
- [x] Coordinator independent review compares whole branch against baseline and this plan, including all Review Focus items; Terra fixes actionable introduced issues with reproducing tests, reruns required impacted checks. No weakened assertions. Existing defects get explicit limitations.
- [x] Update execution record with exact tests/count, build results, browser URLs/environment/viewports, screenshots, commit/version and baseline limitations.
- [ ] Commit, push only `codex/offer-editor-sections`, create separate PR to main with scope/behavior unchanged, tests/evidence/limitations. Call attach_artifact with returned PR URL, check CI. Do not merge/deploy. Report PR, final SHA, plan path, component split and verification to root.


## Plan self-review (Sol, before handoff)

- Requirement coverage: section map covers all 11 tab IDs / both kinds; file interfaces cover every existing helper and all three slots; route stays unchanged.
- Type consistency: domain types imported, public Props unchanged; optional offerKind default retained; concrete schedule/program/parent editors retain typed callbacks, union adapters stay at explicit boundaries.
- State and data: no copied state/context/new onChange event policy; top-level vs normalized content updates and kind replacement separated; null/number/date and UUID behavior pinned.
- Safety and scope: no production access needed, tracker read but no unrelated row updates; baseline disabled/legacy ARIA defects explicitly separated from regressions.
- Review Focus coverage: each five high-risk class maps to Task 1 characterization and Task 4 browser/review. No speculative abstractions or generated form framework.
- Ready for Terra execution under the user's previously supplied approval and model selection.

## Execution record

### Baseline / Task 1 (2026-11-03)

- `bun install --frozen-lockfile` succeeded. Full baseline without environment configuration failed because required Vite settings were absent; with non-secret CI-style fixture values including `VITE_SEO_INDEXING=false`, `bun run test` passed 82 files / 595 tests (including first three new characterization tests).
- The original form passes 34 tests including title/slug override, actual kind Select, clearing/null/zero and badInput date, cross-tab camp edits, exact error precedence, three media slots, UUID journey reorder/delete, accommodation retention, resort legacy synchronization and independent copy, and absent parent legacy transport/meals.
- Targeted form, admin route and editor schema: 3 files / 107 tests passed. `bun run typecheck` passed. Existing jsdom scrollTo warnings observed.
- Before screenshots: controlled fixture harness outside the repository, real form and project Tailwind styles, 1440×900 and 390×844 for both kinds. Harness does not exercise auth, route persistence, or network mutations. Baseline terms inputs remain enabled while disabled; legacy venue lacks standard ARIA state.


### Task 2 (2026-11-03)

- Extracted existing Field, counter, helpers and four concrete editors. `bun run typecheck` and targeted form/route/schema tests (3 files / 107 tests) passed.
- Ruling: moved the four independent editors as one mechanical step and ran the targeted suite after the combined extraction rather than after each editor; the diff remains reviewable and the entire characterization set passed. If a regression had arisen, isolation would have required inspecting the combined move.

### Task 3 (2026-11-03)

- Extracted basics, story, program, price, accommodation, optional-section adapter and photos while retaining tab composition and content normalization at the form boundary. Shared subtitle takes separate exact display and descendant ARIA errors to preserve the original lookup behavior.
- `bun run typecheck` and form tests (35/35) passed after extraction. Added a regression confirming render and tab changes never emit an update. Initial desktop/mobile screenshots of both kinds match visually; three pairs are pixel-identical and the camp mobile pair differs only in a small text anti-aliasing region.

### Task 4 verification (2026-11-03)

- `bun run typecheck` passed; `bun run test` 82 files / 605 tests passed; `bun run lint` passed with seven existing Fast Refresh warnings. Full `bun run build` prerendered eight pages and generated the sitemap; `bun run check:seo` passed. `images:check` not applicable: no local image assets or generated catalogue imports changed.
- Local controlled-form harness before/after screenshots and QA report: `docs/tasks/offer-editor-refactor-evidence/` (Git-ignored, copy before removing worktree). The screenshots use synthetic data and include both kinds at 1440×900 and 390×844, plus representative program, price and resort panels. Browser tested keyboard reveal, errors, retained edits, slots and disabled behavior; it does not exercise real authentication or route mutations.
- Baseline limitations retained: camp term text/date/price inputs remain enabled under `disabled` although their buttons are disabled; legacy venue textarea retains its existing ARIA behavior. Pending is represented by the disabled prop in the harness.
- A null-slot fallback and variant add/delete/zero assertion were added after extraction; both pass. Independent coordinator review found no actionable code findings at implementation commit `1014420`; final evidence review completed without actionable findings.

- Independent coordinator reviewed the branch, logs, and representative screenshots; no actionable findings. Durable screenshot folder: [Offer editor refactor evidence](https://drive.google.com/drive/folders/1DaCDY5aLDKgv4M8P4CGtNFPXIO55JPE1). Upload and Drive readback confirmed 15 screenshots, QA report and comparison file.

- PR [#58](https://github.com/hciupinski/vhsboard/pull/58) opened; GitHub Actions test, lint, typecheck and build passed for `ca1fba87aaf5fa25b653caf6be2850e950de38f6`. No merge or deployment.
