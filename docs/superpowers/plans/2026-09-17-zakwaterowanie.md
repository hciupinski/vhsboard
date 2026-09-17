# Zakwaterowanie w ofertach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać opcjonalną sekcję „Zakwaterowanie” z opisem i niezależną galerią zdjęć do wyjazdów oraz obozów, zarządzaną w CMS.

**Architecture:** Pole `accommodation` w JSON treści oferty określa, czy sekcja jest włączona i przechowuje opis. Istniejące `offer_images` otrzyma kategorię galerii, dzięki czemu upload, usuwanie, podpisane URL-e i RLS są współdzielone, ale pozycje są niezależne. Mapper rozdziela obrazy na zwykłą galerię i zakwaterowanie, a widoki publiczne renderują kompletną sekcję wyłącznie dla włączonych danych z dostępnymi zdjęciami.

**Tech Stack:** React 19, TypeScript, TanStack Router/Query, React Hook Form, Zod, Vitest, Supabase PostgreSQL/Storage/RLS, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-09-17-zakwaterowanie-design.md`

## Global Constraints

- Pozostań na aktualnym branchu `feature/accomo`; użytkownik wyraźnie wskazał pracę na tym branchu.
- Nie dodawaj rezerwacji, płatności, dostępności, danych uczestników ani kont klientów.
- Zachowaj publiczne teksty i opisy alternatywne po polsku oraz obrazowy, mobilny styl z tokenami `src/styles.css`.
- Użyj obecnego bucketu `offer-images`, publicznych poświadczeń Supabase i RLS; nie ujawniaj żadnych poświadczeń uprzywilejowanych.
- Obraz główny i zwykła galeria korzystają wyłącznie z kategorii `gallery`; zakwaterowanie używa wyłącznie `accommodation`.
- Włączone zakwaterowanie może istnieć w szkicu bez kompletu danych, ale publikacja wymaga opisu 3–500 znaków i przynajmniej jednego zdjęcia tej kategorii.
- Uruchom `bun run lint` oraz `bun run build` po zmianach aplikacji.

---

### Task 0: Ujednolicić sekcje obozów przed zakwaterowaniem

**Files:**
- Create: `src/lib/offers/day-camp-sections.ts`
- Modify: `src/components/offers/TripSectionNavigation.tsx`
- Modify: `src/routes/obozy.$slug.tsx`
- Modify: `src/components/admin/OfferEditorForm.tsx`
- Test: `src/routes/obozy.$slug.test.tsx`
- Test: `src/components/admin/OfferEditorForm.test.tsx`

**Interfaces:**
- Produces: `dayCampSections`, `getVisibleDayCampSections(offer)`, generic `TripSectionNavigation` accepting a section array and accessible label, public camp section ids, and matching CMS tabs.
- Consumes: Existing `DayCampOffer.content`, `DayCampProgramEditor`, `TermsEditor`, and the trip navigation interaction implementation.

- [x] **Step 1: Write failing public route and CMS tests**

```tsx
expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
  "Podstawy", "O obozie", "Atrakcje", "Plan dnia", "W cenie", "Turnusy i ceny", "Dla rodzica", "Galeria",
]);

const navigation = await screen.findByRole("navigation", { name: "Sekcje obozu" });
expect(within(navigation).getAllByRole("link").map((link) => link.textContent)).toEqual([
  "O obozie", "Atrakcje", "Plan dnia", "W cenie", "Turnusy i ceny", "Dla rodzica", "Galeria",
]);
```

- [x] **Step 2: Run the focused tests to verify they fail for the missing camp section model**

Run: `bun vitest run src/components/admin/OfferEditorForm.test.tsx 'src/routes/obozy.$slug.test.tsx'`

Expected: FAIL because camps render the old combined CMS cards and have no public section navigation.

- [x] **Step 3: Add the camp section configuration and visibility rules**

```ts
export const dayCampSections = [
  { id: "o-obozie", label: "O obozie", editorTab: "story" },
  { id: "atrakcje", label: "Atrakcje", editorTab: "highlights" },
  { id: "plan-dnia", label: "Plan dnia", editorTab: "days" },
  { id: "w-cenie", label: "W cenie", editorTab: "inout" },
  { id: "turnusy", label: "Turnusy i ceny", editorTab: "terms" },
  { id: "dla-rodzica", label: "Dla rodzica", editorTab: "parents" },
  { id: "galeria", label: "Galeria", editorTab: "photos" },
] as const;
```

Use the existing sticky navigation for camps by widening its section type and supplying `ariaLabel="Sekcje obozu"`. Render `id` and `tabIndex={-1}` on each public camp section and include only sections with meaningful public content or a usable signed image.

- [x] **Step 4: Split the camp editor according to the same configuration**

```tsx
const tabs = dayCamp
  ? [{ editorTab: "basics", label: "Podstawy" }, ...dayCampSections]
  : [{ editorTab: "basics", label: "Podstawy" }, ...tripSections];

<TabsContent value="terms"><TermsEditor content={dayCamp} errors={errors} disabled={disabled} onChange={setTerms} /></TabsContent>
<TabsContent value="parents"><DayCampParentInfoEditor content={dayCamp} errors={errors} disabled={disabled} onChange={setDayCamp} /></TabsContent>
```

Move `TermsEditor` out of basic data, render highlights outside the story card, and split the existing program-and-parent component into a day-program panel and a parent-information panel without changing their field names or validation rules. Map `content.terms`, `content.parentInfo`, and `content.dayProgram` errors to their respective tabs.

- [x] **Step 5: Run focused tests to verify the unified camp navigation and editor pass**

Run: `bun vitest run src/components/admin/OfferEditorForm.test.tsx 'src/routes/obozy.$slug.test.tsx' src/components/offers/TripSectionNavigation.test.tsx`

Expected: PASS with the camp navigation in reading order, valid anchor targets, responsive shared interaction behavior, correct editor tab order, and error markers on the split tabs.

- [x] **Step 6: Commit the camp alignment before continuing to accommodation**

```bash
git add src/lib/offers/day-camp-sections.ts src/components/offers/TripSectionNavigation.tsx 'src/routes/obozy.$slug.tsx' src/components/admin/OfferEditorForm.tsx src/components/admin/OfferEditorForm.test.tsx 'src/routes/obozy.$slug.test.tsx' src/components/offers/TripSectionNavigation.test.tsx
git add -f docs/superpowers/specs/2026-09-17-zakwaterowanie-design.md docs/superpowers/plans/2026-09-17-zakwaterowanie.md
git commit -m "feat: align camp offer sections"
```

### Task 1: Kontrakty ofert i rozdzielenie galerii

**Files:**
- Modify: `src/lib/offers/types.ts`
- Modify: `src/lib/offers/schema.ts`
- Modify: `src/lib/offers/editor-schema.ts`
- Modify: `src/lib/offers/mapper.ts`
- Test: `src/lib/offers/editor-schema.test.ts`
- Test: `src/lib/offers/mapper.test.ts`

**Interfaces:**
- Produces: `AccommodationContent`, `OfferImageCategory`, `OfferImage.category`, `PublicOffer.accommodationImages` and Zod contracts that accept `content.accommodation` only with a trimmed 3–500 character description.
- Consumes: Existing `TripOfferContent`, `DayCampContent`, `offerImageRowSchema`, and `editorOfferInputSchema`.

- [ ] **Step 1: Write the failing schema and mapper tests**

```ts
it("normalizes an enabled accommodation description", () => {
  const result = editorOfferInputSchema.parse({
    ...validTripInput,
    content: { ...validTripInput.content, accommodation: { description: "  Apartamenty przy plaży.  " } },
  });

  expect(result.content.accommodation).toEqual({ description: "Apartamenty przy plaży." });
});

it("separates accommodation images from the standard gallery", () => {
  const offer = mapOfferDetailRow(validTripRow, [galleryImageRow, accommodationImageRow], signedUrls);

  expect(offer.images).toEqual([expect.objectContaining({ id: galleryImageRow.id })]);
  expect(offer.accommodationImages).toEqual([
    expect.objectContaining({ id: accommodationImageRow.id, category: "accommodation" }),
  ]);
});
```

- [ ] **Step 2: Run the focused tests to verify they fail for the missing accommodation contract**

Run: `bun vitest run src/lib/offers/editor-schema.test.ts src/lib/offers/mapper.test.ts`

Expected: FAIL because `accommodation` and image `category` are not part of the current contracts and the mapper does not expose `accommodationImages`.

- [ ] **Step 3: Add the minimal public and persisted types**

```ts
export type OfferImageCategory = "gallery" | "accommodation";

export type AccommodationContent = { description: string };

export type OfferImage = {
  id: string;
  path: string;
  alt: string;
  position: number;
  category: OfferImageCategory;
  signedUrl: string | null;
};

type PublicOfferBase = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  groupSizeMin: number | null;
  groupSizeMax: number | null;
  priceFrom: number;
  currency: "PLN";
  bookingUrl: string;
  heroImageUrl: string | null;
  images: OfferImage[];
  accommodationImages: OfferImage[];
};
```

Add `accommodation: z.object({ description: requiredTextSchema.min(3).max(500) }).optional()` to both persisted content schemas and the matching normalized editor schemas. Preserve it in `normalizeEditorOfferInput` by trimming `content.accommodation.description` when it exists.

- [ ] **Step 4: Validate the database row category and map both collections deterministically**

```ts
export const offerImageRowSchema = z.object({
  id: z.string().uuid(),
  offer_id: z.string().uuid(),
  storage_path: z.string().trim().min(1),
  alt_text: z.string().trim().min(5).max(180),
  category: z.enum(["gallery", "accommodation"]).default("gallery"),
  position: z.number().int().nonnegative(),
});

const galleryImages = parsedImages.filter((image) => image.category === "gallery");
const accommodationImages = parsedImages.filter((image) => image.category === "accommodation");
```

Validate ascending positions per category, not across categories. Map both collections with signed URLs; preserve `category` on each mapped image. Ensure `heroImageUrl` is resolved as before, but later readiness checks require its row to be category `gallery`.

- [ ] **Step 5: Run focused tests to verify the contracts and mapper are green**

Run: `bun vitest run src/lib/offers/editor-schema.test.ts src/lib/offers/mapper.test.ts`

Expected: PASS with the new normalization, rejection, category, separation, and per-category ordering cases.

- [ ] **Step 6: Commit the contract changes**

```bash
git add src/lib/offers/types.ts src/lib/offers/schema.ts src/lib/offers/editor-schema.ts src/lib/offers/mapper.ts src/lib/offers/editor-schema.test.ts src/lib/offers/mapper.test.ts
git commit -m "feat: model offer accommodation galleries"
```

### Task 2: Kategoryjny dostęp do obrazów w repozytoriach

**Files:**
- Modify: `src/lib/offers/public-repository.ts`
- Modify: `src/lib/offers/admin-repository.ts`
- Test: `src/lib/offers/public-repository.test.ts`
- Test: `src/lib/offers/admin-repository.test.ts`

**Interfaces:**
- Consumes: `OfferImageCategory`, `offerImageRowSchema`, and mapper fields from Task 1.
- Produces: category-aware `IMAGE_COLUMNS`, `uploadOfferImage(offerId, file, alt, category)`, `reorderOfferImages(offerId, orderedIds, category)`, and readiness validation for the selected hero and optional accommodation.

- [ ] **Step 1: Write failing repository tests for category propagation and publication readiness**

```ts
it("uploads an accommodation image with its own category", async () => {
  await uploadOfferImage(offerId, imageFile, "Apartament z balkonem", "accommodation");

  expect(insert).toHaveBeenCalledWith(
    expect.objectContaining({ offer_id: offerId, category: "accommodation", position: 0 }),
  );
});

it("does not consider an accommodation image a valid hero image", async () => {
  mockImageLookup.mockResolvedValue({ data: { alt_text: "Apartament z balkonem", category: "accommodation" }, error: null });

  await expect(setOfferStatus(offerId, "published")).rejects.toThrow(
    "Dodaj obraz główny z opisem alternatywnym przed publikacją.",
  );
});
```

- [ ] **Step 2: Run the repository tests to verify they fail because the functions do not accept categories**

Run: `bun vitest run src/lib/offers/public-repository.test.ts src/lib/offers/admin-repository.test.ts`

Expected: FAIL because image select strings omit `category`, upload/reorder calls have no category parameter, and the hero readiness query does not distinguish image categories.

- [ ] **Step 3: Select, upload, reorder, and validate by category**

```ts
const IMAGE_COLUMNS = "id,offer_id,storage_path,alt_text,category,position";

export const reorderOfferImages = async (
  offerId: string,
  orderedImageIds: string[],
  category: OfferImageCategory,
): Promise<void> => {
  const { error } = await supabase.rpc("reorder_offer_images", {
    p_offer_id: offerId,
    p_ordered_image_ids: orderedImageIds,
    p_category: category,
  });
  if (error) throw new OfferRepositoryError("Nie udało się zmienić kolejności zdjęć.", { cause: error });
};
```

Give `uploadOfferImage` a required `category` parameter, calculate its position after filtering the offer image rows by that category, and insert the category. Filter the `canPublishOffer` hero lookup with `.eq("category", "gallery")`. If `content.accommodation` exists, query for at least one `accommodation` image before returning readiness true; otherwise retain current hero-only readiness behavior.

- [ ] **Step 4: Run the repository tests to verify the category-aware flows pass**

Run: `bun vitest run src/lib/offers/public-repository.test.ts src/lib/offers/admin-repository.test.ts`

Expected: PASS, including signed URL fetching for both categories and stable existing gallery behavior.

- [ ] **Step 5: Commit the repository changes**

```bash
git add src/lib/offers/public-repository.ts src/lib/offers/admin-repository.ts src/lib/offers/public-repository.test.ts src/lib/offers/admin-repository.test.ts
git commit -m "feat: manage accommodation images by category"
```

### Task 3: Edytor CMS i menedżer zdjęć zakwaterowania

**Files:**
- Modify: `src/components/admin/OfferEditorForm.tsx`
- Modify: `src/components/admin/OfferImageManager.tsx`
- Modify: `src/routes/admin.$slug.tsx`
- Test: `src/components/admin/OfferEditorForm.test.tsx`
- Test: `src/components/admin/OfferImageManager.test.tsx`
- Test: `src/routes/admin.$slug.test.tsx`

**Interfaces:**
- Consumes: `EditableOfferInput.content.accommodation`, `OfferImageCategory`, and category-aware repository functions from Task 2.
- Produces: Admin tab `accommodation`, a labelled native switch, a description textarea, and an `OfferImageManager` configured with `category="accommodation"`.

- [ ] **Step 1: Write failing component tests for the optional admin section**

```tsx
it("adds and removes the accommodation content through the switch", async () => {
  const user = userEvent.setup();
  renderEditor({ content: validTripContent });

  await user.click(screen.getByRole("switch", { name: "Pokaż sekcję zakwaterowania" }));
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ content: expect.objectContaining({ accommodation: { description: "" } }) }),
  );
});

it("passes the accommodation category to image management", () => {
  renderAdminEditorWithSavedOffer();
  expect(mockedOfferImageManager).toHaveBeenCalledWith(
    expect.objectContaining({ category: "accommodation" }),
    undefined,
  );
});
```

- [ ] **Step 2: Run the CMS component tests to verify they fail for missing controls and category props**

Run: `bun vitest run src/components/admin/OfferEditorForm.test.tsx src/components/admin/OfferImageManager.test.tsx src/routes/admin.$slug.test.tsx`

Expected: FAIL because the editor has no accommodation tab/switch and the image manager does not accept a category.

- [ ] **Step 3: Add the editor tab and controlled accommodation fields**

```tsx
<TabsTrigger value="accommodation">Zakwaterowanie</TabsTrigger>

<Switch
  id="accommodation-enabled"
  checked={value.content.accommodation !== undefined}
  onCheckedChange={(enabled) =>
    onChange({
      ...value,
      content: enabled
        ? { ...value.content, accommodation: { description: "" } }
        : removeAccommodation(value.content),
    })
  }
/>
<Label htmlFor="accommodation-enabled">Pokaż sekcję zakwaterowania</Label>
```

Implement `removeAccommodation` with object rest so it removes only the optional field. Render the `Textarea` only while enabled, bind it to `content.accommodation.description`, expose the existing error display for `content.accommodation.description`, and use Polish explanatory text that drafts may be incomplete but publication requires a description and a photo.

- [ ] **Step 4: Make the image manager category-aware and render two independent managers**

```tsx
export function OfferImageManager({ offerId, heroImagePath, category = "gallery", ...props }: Props) {
  const galleryImages = images.filter((image) => image.category === category);
  const upload = (file: File, alt: string) => uploadOfferImage(offerId, file, alt, category);
  const reorder = (nextIds: string[]) => reorderOfferImages(offerId, nextIds, category);
}

<OfferImageManager offerId={offer.id} heroImagePath={value.heroImagePath} category="gallery" />
{value.content.accommodation ? (
  <OfferImageManager offerId={offer.id} category="accommodation" />
) : null}
```

Do not offer hero-image selection in the accommodation manager. Keep existing accessible upload labels, alt fields, confirmation dialog, keyboard controls, loading/error states, and existing category-filtered image list.

- [ ] **Step 5: Run the CMS tests to verify the optional flow and image controls pass**

Run: `bun vitest run src/components/admin/OfferEditorForm.test.tsx src/components/admin/OfferImageManager.test.tsx src/routes/admin.$slug.test.tsx`

Expected: PASS for switch enable/disable, description editing, independent upload/delete/reorder invocation, and no hero action for accommodation images.

- [ ] **Step 6: Commit the CMS editor changes**

```bash
git add src/components/admin/OfferEditorForm.tsx src/components/admin/OfferImageManager.tsx 'src/routes/admin.$slug.tsx' src/components/admin/OfferEditorForm.test.tsx src/components/admin/OfferImageManager.test.tsx 'src/routes/admin.$slug.test.tsx'
git commit -m "feat: edit accommodation in offer CMS"
```

### Task 4: Publiczna sekcja i nawigacja ofert

**Files:**
- Modify: `src/components/offers/OfferGallery.tsx`
- Modify: `src/lib/offers/trip-sections.ts`
- Modify: `src/routes/wyjazdy.$slug.tsx`
- Modify: `src/routes/obozy.$slug.tsx`
- Test: `src/components/offers/OfferGallery.test.tsx`
- Test: `src/routes/wyjazdy.$slug.test.tsx`
- Test: `src/routes/obozy.$slug.test.tsx`

**Interfaces:**
- Consumes: `PublicOffer.content.accommodation`, `PublicOffer.accommodationImages`, and the filtered collections from Task 1.
- Produces: `#zakwaterowanie`, a visible Polish section heading, a category-specific dialog gallery, and a trip navigation entry only when the section can render.

- [ ] **Step 1: Write failing public view tests for enabled and hidden accommodation**

```tsx
it("renders accommodation before the standard gallery for a trip", async () => {
  await renderDetail({
    ...detailOffer,
    content: { ...detailOffer.content, accommodation: { description: "Dom z tarasem blisko spotu." } },
    accommodationImages: [accommodationImage],
  });

  expect(screen.getByRole("heading", { level: 2, name: "Zakwaterowanie" })).toBeInTheDocument();
  expect(screen.getByText("Dom z tarasem blisko spotu.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Zakwaterowanie" })).toHaveAttribute("href", "#zakwaterowanie");
});

it("does not render accommodation when it has no usable image", async () => {
  await renderDetail({ ...detailOffer, accommodationImages: [{ ...accommodationImage, signedUrl: null }] });
  expect(screen.queryByRole("heading", { name: "Zakwaterowanie" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run public component and route tests to verify they fail because the section is absent**

Run: `bun vitest run src/components/offers/OfferGallery.test.tsx 'src/routes/wyjazdy.$slug.test.tsx' 'src/routes/obozy.$slug.test.tsx'`

Expected: FAIL because no route renders `#zakwaterowanie` or includes it in the trip section navigation.

- [ ] **Step 3: Generalize the gallery’s accessible labels and render a compact accommodation introduction**

```tsx
export function OfferGallery({ images, title = "Zdjęcia z wyjazdu", id, description }: Props) {
  const headingId = id ? `${id}-title` : "offer-gallery-title";
  return <section id={id} aria-labelledby={headingId}>{description ? <p>{description}</p> : null}</section>;
}

<OfferGallery
  id="zakwaterowanie"
  title="Zakwaterowanie"
  description={offer.content.accommodation.description}
  images={offer.accommodationImages}
/>
```

Use the established warm secondary section surface, dialog lightbox, lazy loading, concise Polish alt text, and focus behavior. Make the heading id derive from `id` so two gallery instances do not duplicate `offer-gallery-title`.

- [ ] **Step 4: Add visibility predicates and place the section before the normal gallery**

```ts
const hasVisibleAccommodation = (offer: PublicOffer) =>
  offer.content.accommodation !== undefined &&
  offer.accommodationImages.some((image) => image.signedUrl !== null);

const tripSections = [
  { id: "o-wyjezdzie", label: "O wyjeździe", editorTab: "story" },
  { id: "program", label: "W programie", editorTab: "highlights" },
  { id: "plan-wyjazdu", label: "Plan wyjazdu", editorTab: "days" },
  { id: "w-cenie", label: "Co jest w cenie", editorTab: "inout" },
  { id: "zakwaterowanie", label: "Zakwaterowanie", editorTab: "accommodation" },
  { id: "galeria", label: "Galeria", editorTab: "photos" },
] as const;
```

Update `getVisibleTripSections` to call the predicate. In each detail route, render the accommodation gallery after the program/schedule content and before the ordinary gallery. For day camps, add `#zakwaterowanie` with the same predicate but do not introduce a new navigation component unless that page already has one.

- [ ] **Step 5: Run public tests to verify both offer kinds and section navigation pass**

Run: `bun vitest run src/components/offers/OfferGallery.test.tsx 'src/routes/wyjazdy.$slug.test.tsx' 'src/routes/obozy.$slug.test.tsx'`

Expected: PASS with a rendered title, text, images, dialog behavior, unique heading ids, trip anchor order, and no section for disabled or unavailable content.

- [ ] **Step 6: Commit the public section changes**

```bash
git add src/components/offers/OfferGallery.tsx src/lib/offers/trip-sections.ts 'src/routes/wyjazdy.$slug.tsx' 'src/routes/obozy.$slug.tsx' src/components/offers/OfferGallery.test.tsx 'src/routes/wyjazdy.$slug.test.tsx' 'src/routes/obozy.$slug.test.tsx'
git commit -m "feat: show accommodation on public offers"
```

### Task 5: Supabase migration, RLS regression coverage, and full verification

**Files:**
- Create: `supabase/migrations/20260917150000_add_offer_accommodation.sql`
- Modify: `supabase/tests/cms_security.sql`
- Test: `supabase/tests/cms_security.sql`
- Modify: `docs/superpowers/plans/2026-09-17-zakwaterowanie.md`

**Interfaces:**
- Consumes: the `gallery` / `accommodation` categories used by Tasks 1–4 and the existing `reorder_offer_images(uuid, uuid[])` RPC.
- Produces: `offer_images.category`, unique `(offer_id, category, position)`, `reorder_offer_images(uuid, uuid[], text)`, and a database publication guard for `description.accommodation`.

- [ ] **Step 1: Add failing SQL assertions for independent category ordering and incomplete publication**

```sql
-- As an administrator, gallery and accommodation may each start at position 0.
insert into public.offer_images (offer_id, storage_path, alt_text, category, position)
values
  (managed_offer_id, gallery_path, 'Deska na plaży o zachodzie słońca', 'gallery', 0),
  (managed_offer_id, accommodation_path, 'Pokój z łóżkami i widokiem na ocean', 'accommodation', 0);

update public.offers
set description = jsonb_build_object('accommodation', jsonb_build_object('description', 'Dom przy plaży.')),
    status = 'published'
where id = incomplete_accommodation_offer_id;
-- Expect check_violation until an accommodation image exists.
```

Increase `select plan(...)` by the exact number of added `ok(...)` / `throws_ok(...)` assertions and cover that public users can read category records only when the parent offer is published.

- [ ] **Step 2: Run the Supabase test target to verify the new assertions fail before the migration exists**

Run: `supabase test db`

Expected: FAIL because `category` and the three-argument reorder RPC do not exist and incomplete accommodation can still be published.

- [ ] **Step 3: Create the additive migration with category-safe integrity rules**

```sql
alter table public.offer_images
  add column category text not null default 'gallery'
  check (category in ('gallery', 'accommodation'));

alter table public.offer_images
  drop constraint offer_images_offer_id_position_key,
  add constraint offer_images_offer_id_category_position_key unique (offer_id, category, position);
```

Replace the reorder function with `reorder_offer_images(p_offer_id uuid, p_ordered_image_ids uuid[], p_category text)`. Reject invalid categories, lock and count only rows matching `p_offer_id` and `p_category`, and preserve the two-phase position update that avoids transient unique conflicts. Update the publication trigger so it rejects `description.accommodation` unless the object contains only a trimmed 3–500 character string `description` and an `accommodation` image exists. Update the existing hero readiness predicate to require `category = 'gallery'`.

Keep current table and Storage policies: they already authorize all `offer_images` only through the parent offer’s published/admin checks, so the new category cannot leak draft media. Do not alter the storage path contract.

- [ ] **Step 4: Run the Supabase tests to verify RLS and publication constraints pass**

Run: `supabase test db`

Expected: PASS, including independent image positions, category-specific reorder validation, public read restrictions, and publication rejection for missing accommodation requirements.

- [ ] **Step 5: Run the complete application verification suite**

Run: `bun run test && bun run lint && bun run build`

Expected: all Vitest tests pass, ESLint exits with no errors, and Vite plus sitemap generation complete successfully.

- [ ] **Step 6: Mark completed plan steps and commit the migration, tests, and plan**

```bash
git add supabase/migrations/20260917150000_add_offer_accommodation.sql supabase/tests/cms_security.sql
git add -f docs/superpowers/plans/2026-09-17-zakwaterowanie.md
git commit -m "feat: secure accommodation galleries"
```
