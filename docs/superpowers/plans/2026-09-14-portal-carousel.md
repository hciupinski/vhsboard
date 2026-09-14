# Portal Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage fixed hero image with an administrator-configured, automatic, non-interactive carousel sourced from `src/assets/carousel`.

**Architecture:** A Vite catalogue resolves all versioned image files to safe browser URLs. Supabase persists only selected catalogue paths and their order, enforced by RLS and a privilege-checked atomic RPC. The public hero reuses the project Embla primitive with visitor navigation disabled.

**Tech Stack:** React 19, TypeScript, Vite `import.meta.glob`, TanStack Router/Query, Vitest, Testing Library, Embla Carousel, Supabase PostgreSQL/RLS.

**Spec:** `docs/superpowers/specs/2026-09-14-portal-carousel-design.md`

## Global Constraints

- Catalogue files are only `src/assets/carousel/*.{jpg,jpeg,png,webp,avif}`; CMS cannot upload, delete, or edit them.
- The public hero has no arrows, dots, drag, swipe, keyboard navigation, or pause control; it advances every 7 seconds.
- With `prefers-reduced-motion: reduce`, it displays its first selected image and schedules no timer.
- Reuse `src/components/ui/carousel.tsx`; do not add dependencies.
- Use Polish UI copy, decorative `alt=""` hero images, existing tokens, mobile-first layouts, and semantic controls.
- Only Supabase RLS and `public.is_cms_admin()` authorize writes. Paths not in the catalogue never become rendered URLs.
- Do not manually edit `src/routeTree.gen.ts`; let TanStack Router create its diff.
- Keep current untracked `src/assets/carousel/*` files out of commits unless the user explicitly asks to add them.

---

### Task 1: Create the typed static image catalogue

**Files:**
- Create: `src/lib/portal-carousel/types.ts`
- Create: `src/lib/portal-carousel/catalogue.ts`
- Create: `src/lib/portal-carousel/catalogue.test.ts`

**Interfaces:**
- Produces `PortalCarouselImage = { path: string; src: string; label: string }`.
- Produces `PORTAL_CAROUSEL_IMAGES`, `getPortalCarouselImage(path)`, and `isPortalCarouselImagePath(path)`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { PORTAL_CAROUSEL_IMAGES, getPortalCarouselImage, isPortalCarouselImagePath } from "./catalogue";

describe("portal carousel catalogue", () => {
  it("orders repository images by stable path", () => {
    expect(PORTAL_CAROUSEL_IMAGES.map(({ path }) => path)).toEqual([
      "carousel/hero-surf.jpg",
      "carousel/obozy-lato-wakeboard.png",
      "carousel/obozy-zima.jpg",
    ]);
  });
  it("resolves only a real catalogue entry", () => {
    expect(getPortalCarouselImage("carousel/hero-surf.jpg")?.src).toBeTruthy();
    expect(getPortalCarouselImage("carousel/missing.jpg")).toBeUndefined();
    expect(isPortalCarouselImagePath("https://example.test/x.jpg")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/lib/portal-carousel/catalogue.test.ts`

Expected: FAIL because `./catalogue` is absent.

- [ ] **Step 3: Implement the smallest catalogue**

```ts
// types.ts
export type PortalCarouselImage = { path: string; src: string; label: string };

// catalogue.ts
const modules = import.meta.glob("/src/assets/carousel/*.{jpg,jpeg,png,webp,avif}", {
  eager: true, import: "default", query: "?url",
}) as Record<string, string>;
export const PORTAL_CAROUSEL_IMAGES = Object.entries(modules)
  .map(([modulePath, src]) => ({
    path: modulePath.replace("/src/assets/", ""), src,
    label: modulePath.split("/").at(-1)!.replace(/\.[^.]+$/, "").replaceAll("-", " "),
  }))
  .sort((a, b) => a.path.localeCompare(b.path));
export const getPortalCarouselImage = (path: string) =>
  PORTAL_CAROUSEL_IMAGES.find((image) => image.path === path);
export const isPortalCarouselImagePath = (path: string) =>
  getPortalCarouselImage(path) !== undefined;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/lib/portal-carousel/catalogue.test.ts`

Expected: PASS with two tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/portal-carousel/types.ts src/lib/portal-carousel/catalogue.ts src/lib/portal-carousel/catalogue.test.ts
git commit -m "feat: add portal carousel image catalogue"
```

### Task 2: Persist selected paths securely in Supabase

**Files:**
- Create: `supabase/migrations/20260914120000_create_portal_carousel.sql`
- Modify: `supabase/tests/cms_security.sql`

**Interfaces:**
- Produces table `public.portal_carousel_images(id uuid, image_path text, position integer, created_at timestamptz)`.
- Produces `public.set_portal_carousel_images(p_ordered_paths text[]) returns void`.
- Consumes current `public.is_cms_admin()` authorization model.

- [ ] **Step 1: Add failing database assertions**

Append an assertion block to `supabase/tests/cms_security.sql`, using existing `admin_id` and `editor_id` fixture variables:

```sql
perform set_config('request.jwt.claim.sub', editor_id::text, true);
perform throws_ok(
  $$ select public.set_portal_carousel_images(array['carousel/hero-surf.jpg']) $$,
  '42501', 'Brak uprawnień do zmiany karuzeli portalu.',
  'editor cannot save portal carousel'
);
perform set_config('request.jwt.claim.sub', admin_id::text, true);
perform lives_ok(
  $$ select public.set_portal_carousel_images(array['carousel/obozy-zima.jpg', 'carousel/hero-surf.jpg']) $$,
  'admin can save ordered portal carousel'
);
perform results_eq(
  $$ select image_path from public.portal_carousel_images order by position $$,
  $$ values ('carousel/obozy-zima.jpg'::text), ('carousel/hero-surf.jpg'::text) $$,
  'saved rows preserve supplied order'
);
perform throws_ok(
  $$ select public.set_portal_carousel_images(array['private/image.jpg']) $$,
  '22023', 'Nieprawidłowa ścieżka obrazu karuzeli.', 'invalid path is rejected'
);
```

Also assert an anonymous `select image_path from public.portal_carousel_images` succeeds.

- [ ] **Step 2: Run the database test to verify it fails**

Run: `supabase test db`

Expected: FAIL because the table and RPC do not exist.

- [ ] **Step 3: Add migration, policies, and atomic order replacement**

```sql
create table public.portal_carousel_images (
  id uuid primary key default gen_random_uuid(),
  image_path text not null unique check (image_path ~ '^carousel/[a-zA-Z0-9._/-]+$'),
  position integer not null unique check (position >= 0),
  created_at timestamptz not null default now()
);
grant select on public.portal_carousel_images to anon, authenticated;
grant insert, update, delete on public.portal_carousel_images to authenticated;
alter table public.portal_carousel_images enable row level security;
create policy "portal carousel is publicly visible" on public.portal_carousel_images
  for select to anon, authenticated using (true);
create policy "cms administrators manage portal carousel" on public.portal_carousel_images
  for all to authenticated using ((select public.is_cms_admin())) with check ((select public.is_cms_admin()));
```

Implement a `security invoker` RPC that rejects a non-admin with `insufficient_privilege`, null/duplicate/invalid `carousel/` paths with `invalid_parameter_value`, locks rows, removes paths omitted by the payload, assigns temporary positions above the current maximum, then assigns final positions from `unnest(p_ordered_paths) with ordinality`. Revoke execute from `public` and `anon`, then grant it to `authenticated`.

- [ ] **Step 4: Run the database test to verify it passes**

Run: `supabase test db`

Expected: PASS for anonymous reads, editor denial, administrator save/order, and invalid path rejection.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260914120000_create_portal_carousel.sql supabase/tests/cms_security.sql
git commit -m "feat: persist portal carousel configuration"
```

### Task 3: Add a catalogue-safe client repository

**Files:**
- Create: `src/lib/portal-carousel/schema.ts`
- Create: `src/lib/portal-carousel/repository.ts`
- Create: `src/lib/portal-carousel/repository.test.ts`

**Interfaces:**
- Consumes the Task 1 catalogue and Task 2 table/RPC.
- Produces `PortalCarouselRepositoryError`, `listPublicPortalCarouselImages()`, `listAdminPortalCarouselImages()`, and `savePortalCarouselImages(paths)`.

- [ ] **Step 1: Write failing repository tests**

```ts
it("orders known rows and omits unknown database paths", async () => {
  mockedSupabase.from.mockReturnValue(query({ data: [
    { id: secondId, image_path: "carousel/obozy-zima.jpg", position: 1 },
    { id: firstId, image_path: "carousel/hero-surf.jpg", position: 0 },
    { id: thirdId, image_path: "carousel/not-in-repo.jpg", position: 2 },
  ], error: null }));
  await expect(listPublicPortalCarouselImages()).resolves.toMatchObject([
    { path: "carousel/hero-surf.jpg" }, { path: "carousel/obozy-zima.jpg" },
  ]);
});
it("rejects duplicate or unknown paths before calling Supabase", async () => {
  await expect(savePortalCarouselImages(["carousel/hero-surf.jpg", "carousel/hero-surf.jpg"]))
    .rejects.toThrow("Kolejność karuzeli zawiera powtórzone zdjęcie");
  await expect(savePortalCarouselImages(["carousel/missing.jpg"]))
    .rejects.toThrow("Zdjęcie karuzeli nie istnieje w repozytorium");
  expect(mockedSupabase.rpc).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/lib/portal-carousel/repository.test.ts`

Expected: FAIL because `./repository` is absent.

- [ ] **Step 3: Implement parsed querying and safe saving**

```ts
const rowSchema = z.object({
  id: z.string().uuid(), image_path: z.string().min(1), position: z.number().int().nonnegative(),
});
export const listPublicPortalCarouselImages = async () => {
  const { data, error } = await supabase.from("portal_carousel_images")
    .select("id,image_path,position").order("position", { ascending: true });
  if (error || !Array.isArray(data)) throw new PortalCarouselRepositoryError("Nie udało się pobrać karuzeli.");
  return rowSchema.array().parse(data).flatMap(({ image_path }) => {
    const image = getPortalCarouselImage(image_path);
    return image ? [image] : [];
  });
};
export const savePortalCarouselImages = async (paths: string[]) => {
  if (new Set(paths).size !== paths.length) throw new PortalCarouselRepositoryError("Kolejność karuzeli zawiera powtórzone zdjęcie.");
  if (!paths.every(isPortalCarouselImagePath)) throw new PortalCarouselRepositoryError("Zdjęcie karuzeli nie istnieje w repozytorium.");
  const { error } = await supabase.rpc("set_portal_carousel_images", { p_ordered_paths: paths });
  if (error) throw new PortalCarouselRepositoryError("Nie udało się zapisać karuzeli.", { cause: error });
};
```

Use a Zod row schema in `schema.ts`. Wrap invalid rows and Supabase failures in the exported error. `listAdminPortalCarouselImages` uses the same ordered query because RLS, not a different shape, defines access.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/lib/portal-carousel/repository.test.ts`

Expected: PASS for valid rows, unknown rows, malformed responses, and invalid save payloads.

- [ ] **Step 5: Commit**

```bash
git add src/lib/portal-carousel/schema.ts src/lib/portal-carousel/repository.ts src/lib/portal-carousel/repository.test.ts
git commit -m "feat: add portal carousel repository"
```

### Task 4: Build the non-interactive automatic hero background

**Files:**
- Modify: `src/components/ui/carousel.tsx`
- Create: `src/components/public/HeroCarousel.tsx`
- Create: `src/components/public/HeroCarousel.test.tsx`

**Interfaces:**
- Adds `interactive?: boolean` to `Carousel`, defaulting to `true`.
- Produces `HeroCarousel({ images: readonly PortalCarouselImage[] })`.

- [ ] **Step 1: Write failing no-control and reduced-motion tests**

```tsx
it("renders decorative slides without visitor navigation", () => {
  render(<HeroCarousel images={images} />);
  expect(screen.getAllByTestId("hero-carousel-slide")).toHaveLength(2);
  expect(screen.queryByRole("button", { name: /poprzed|następ|wstrzymaj/i })).not.toBeInTheDocument();
});
it("does not schedule autoplay for reduced-motion users", () => {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const interval = vi.spyOn(globalThis, "setInterval");
  render(<HeroCarousel images={images} />);
  expect(interval).not.toHaveBeenCalled();
});
```

Mock `embla-carousel-react` in a primitive test to assert `interactive={false}` gives Embla `watchDrag: false` and an ArrowRight event from the hero CTA cannot call `scrollNext`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/components/public/HeroCarousel.test.tsx`

Expected: FAIL because `./HeroCarousel` is absent.

- [ ] **Step 3: Implement non-interaction and automatic movement**

```tsx
// carousel.tsx additions
const [carouselRef, api] = useEmblaCarousel({
  ...opts, axis: orientation === "horizontal" ? "x" : "y",
  ...(interactive === false ? { watchDrag: false } : {}),
}, plugins);
// first line of the existing keyboard handler
if (!interactive) return;

// HeroCarousel timer
useEffect(() => {
  if (!api || images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const timer = window.setInterval(() => api.scrollNext(), 7000);
  return () => window.clearInterval(timer);
}, [api, images.length]);
```

Render only `Carousel`, `CarouselContent`, and `CarouselItem`, with `opts={{ loop: true }}`, `interactive={false}`, `data-testid="hero-carousel"`, and an `<img alt="" data-testid="hero-carousel-slide" />` in each slide. Do not render navigation components or add a focus target.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/components/public/HeroCarousel.test.tsx`

Expected: PASS for no controls, no drag/key navigation, timer cleanup, and reduced motion.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/carousel.tsx src/components/public/HeroCarousel.tsx src/components/public/HeroCarousel.test.tsx
git commit -m "feat: add automatic noninteractive hero carousel"
```

### Task 5: Integrate the public home page

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/public-pages.test.tsx`

**Interfaces:**
- Consumes Task 3 public repository and Task 4 `HeroCarousel`.
- Produces immediate static `hero-surf.jpg` fallback followed by valid public configuration.

- [ ] **Step 1: Add failing fallback and configured-home tests**

```tsx
vi.mock("@/lib/portal-carousel/repository", () => ({ listPublicPortalCarouselImages: vi.fn() }));
it("keeps one static hero slide when configuration cannot be read", async () => {
  mockedList.mockRejectedValue(new Error("offline"));
  await renderRoute("/", HomeRoute);
  expect(screen.getByTestId("hero-carousel").querySelectorAll("img")).toHaveLength(1);
});
it("uses ordered public carousel images when configuration loads", async () => {
  mockedList.mockResolvedValue(configuredImages);
  await renderRoute("/", HomeRoute);
  expect(await screen.findAllByTestId("hero-carousel-slide")).toHaveLength(2);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/routes/public-pages.test.tsx`

Expected: FAIL because the home route renders a fixed `<img>` and never calls the repository.

- [ ] **Step 3: Implement query-backed image selection**

```tsx
const fallbackImages = [{ path: "fallback/hero-surf", src: heroSurf, label: "Hero surf" }];
const { data: configuredImages } = useQuery({
  queryKey: ["public-portal-carousel"],
  queryFn: async () => (await import("@/lib/portal-carousel/repository")).listPublicPortalCarouselImages(),
  retry: false,
});
const heroImages = configuredImages?.length ? configuredImages : fallbackImages;
```

Replace only the fixed absolute hero `<img>` with `<HeroCarousel images={heroImages} />`; retain the overlay, headings, CTA, metadata, and JSON-LD exactly as they are.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/routes/public-pages.test.tsx`

Expected: PASS with current public-page tests plus fallback/configuration coverage.

- [ ] **Step 5: Commit**

```bash
git add src/routes/index.tsx src/routes/public-pages.test.tsx
git commit -m "feat: load home hero carousel configuration"
```

### Task 6: Build the Portal CMS editor

**Files:**
- Create: `src/components/admin/PortalCarouselManager.tsx`
- Create: `src/components/admin/PortalCarouselManager.test.tsx`

**Interfaces:**
- Consumes the Task 1 catalogue and Task 3 list/save functions.
- Produces `PortalCarouselManager()` with selection, deterministic up/down order, explicit save, and Polish status/error feedback.

- [ ] **Step 1: Write failing interaction tests**

```tsx
it("adds a selection and saves its explicit order", async () => {
  mockedRepository.listAdminPortalCarouselImages.mockResolvedValue([hero]);
  const user = userEvent.setup(); render(<PortalCarouselManager />);
  await user.click(await screen.findByRole("checkbox", { name: /obozy zima/i }));
  await user.click(screen.getByRole("button", { name: /zapisz karuzelę/i }));
  await waitFor(() => expect(mockedRepository.savePortalCarouselImages).toHaveBeenCalledWith([
    "carousel/hero-surf.jpg", "carousel/obozy-zima.jpg",
  ]));
});
it("moves the second selected image upward before saving", async () => {
  mockedRepository.listAdminPortalCarouselImages.mockResolvedValue([hero, winter]);
  const user = userEvent.setup(); render(<PortalCarouselManager />);
  await user.click(await screen.findByRole("button", { name: /przenieś wyżej: obozy zima/i }));
  await user.click(screen.getByRole("button", { name: /zapisz karuzelę/i }));
  expect(mockedRepository.savePortalCarouselImages).toHaveBeenCalledWith([
    "carousel/obozy-zima.jpg", "carousel/hero-surf.jpg",
  ]);
});
```

Add tests for unchecking an item, disabled boundary controls, and failure text `Nie udało się zapisać karuzeli. Spróbuj ponownie.`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/components/admin/PortalCarouselManager.test.tsx`

Expected: FAIL because `./PortalCarouselManager` is absent.

- [ ] **Step 3: Implement editor state and controls**

```tsx
const move = (path: string, direction: -1 | 1) => setPaths((current) => {
  const index = current.indexOf(path); const target = index + direction;
  if (index < 0 || target < 0 || target >= current.length) return current;
  const next = [...current]; [next[index], next[target]] = [next[target], next[index]];
  return next;
});
```

Load `listAdminPortalCarouselImages` once and initialize selected paths from its result. Render every catalogue item as a labelled native checkbox with thumbnail. Render selected items in an ordered list with buttons named `Przenieś wyżej: ${image.label}` and `Przenieś niżej: ${image.label}`. Save only after `Zapisz karuzelę`, show `Karuzela została zapisana.` with `role="status"`, and never display raw errors.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/components/admin/PortalCarouselManager.test.tsx`

Expected: PASS for selection, removal, ordering, payload, boundaries, success, and failure.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/PortalCarouselManager.tsx src/components/admin/PortalCarouselManager.test.tsx
git commit -m "feat: add portal carousel CMS editor"
```

### Task 7: Add the protected Portal route and CMS navigation

**Files:**
- Create: `src/routes/admin.portal.tsx`
- Create: `src/routes/admin.portal.test.tsx`
- Modify: `src/routes/admin.index.tsx`
- Modify: `src/routes/admin.dokumenty.tsx`
- Modify: `src/routes/admin.index.test.tsx`
- Modify: `src/routeTree.gen.ts` (generator output only)

**Interfaces:**
- Consumes `AdminGuard`, `AdminSignOutButton`, `Brand`, and `PortalCarouselManager`.
- Produces protected `/admin/portal` plus reciprocal Oferty, Dokumenty, and Portal navigation.

- [ ] **Step 1: Write failing route/navigation tests**

```tsx
it("protects the Portal route with AdminGuard", () => {
  render(<AdminPortalRoute.options.component />);
  expect(screen.getByText("Sprawdzamy dostęp…")).toBeInTheDocument();
});
it("links the offers header to Portal", async () => {
  await renderAdminRoute();
  expect(screen.getByRole("link", { name: "Portal" })).toHaveAttribute("href", "/admin/portal");
});
```

Add reciprocal Portal-link coverage to `/admin/dokumenty` and Oferty/Dokumenty-link coverage to `/admin/portal`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bunx vitest run src/routes/admin.portal.test.tsx src/routes/admin.index.test.tsx`

Expected: FAIL because `./admin.portal` and Portal links are absent.

- [ ] **Step 3: Implement route, links, and generated tree**

```tsx
export const Route = createFileRoute("/admin/portal")({
  head: () => ({ meta: [{ title: "Portal — CMS VHSBOARD" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <AdminGuard><PortalPage /></AdminGuard>,
});
```

`PortalPage` follows the existing calm shell, renders `Karuzela strony głównej`, and includes `PortalCarouselManager`. Add rounded outline Portal links to offer/document headers, and Oferty plus Dokumenty links to the new header. Run `bun run build` so the TanStack plugin generates the route tree; inspect the diff rather than hand editing it.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bunx vitest run src/routes/admin.portal.test.tsx src/routes/admin.index.test.tsx`

Expected: PASS for route guard, metadata, and all navigation links.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin.portal.tsx src/routes/admin.portal.test.tsx src/routes/admin.index.tsx src/routes/admin.dokumenty.tsx src/routes/admin.index.test.tsx src/routeTree.gen.ts
git commit -m "feat: add portal CMS route"
```

### Task 8: Verify the finished branch

**Files:**
- Verify: every file changed in Tasks 1–7.

**Interfaces:**
- Produces fresh evidence for test, lint, build, routing, and final Git scope.

- [ ] **Step 1: Run all unit and component tests**

Run: `bun run test`

Expected: exit code 0 with zero failures.

- [ ] **Step 2: Run the linter**

Run: `bun run lint`

Expected: exit code 0 with zero lint errors.

- [ ] **Step 3: Run the production build**

Run: `bun run build`

Expected: exit code 0, sitemap completes, and generated routes include `/admin/portal`.

- [ ] **Step 4: Inspect exact final Git scope**

Run: `git status --short --branch && git log --oneline origin/main..HEAD`

Expected: feature commits are on `feature/t6-carousel`; current untracked images remain unstaged unless separately authorized.

- [ ] **Step 5: Commit a generated route-tree diff only if it remains**

```bash
git diff --quiet -- src/routeTree.gen.ts || {
  git add src/routeTree.gen.ts
  git commit -m "chore: regenerate portal route tree"
}
```
