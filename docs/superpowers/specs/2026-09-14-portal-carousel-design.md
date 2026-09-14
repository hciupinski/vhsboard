# Portal Carousel Design

## Goal

Replace the single image behind the home-page hero with an automatic, non-interactive carousel. Administrators select the repository-managed images that appear and define their display order in a new CMS section named **Portal**.

## Scope and constraints

- The image catalogue is the versioned directory `src/assets/carousel`.
- Images are not uploaded, deleted, or edited through CMS. The CMS stores only selection and ordering metadata.
- The public carousel is a hero background. Visitors must not receive arrows, dots, swipe, drag, keyboard navigation, or any other navigation control.
- The carousel advances automatically every seven seconds. When `prefers-reduced-motion: reduce` is active, it remains on the first configured image.
- The existing Embla-based primitives in `src/components/ui/carousel.tsx` must be reused; no carousel dependency is added.
- A useful first slide remains available when the database has no configuration, returns a malformed configuration, or the public request fails.
- Visitor-visible and assistive copy remains in Polish. The carousel background is decorative because the hero text supplies the page meaning, so every carousel image uses `alt=""`.
- Supabase RLS is the authorization boundary. Public users may only read the selected carousel rows; authenticated CMS administrators may change them.

## Static image catalogue

`src/lib/portal-carousel/catalogue.ts` uses Vite's eager `import.meta.glob` to import supported files directly below `src/assets/carousel` (`jpg`, `jpeg`, `png`, `webp`, `avif`). It exposes a sorted `PortalCarouselImage[]` where each value has:

- `path`: stable database identifier relative to `src/assets`, for example `carousel/hero-surf.jpg`.
- `src`: Vite-generated browser URL.
- `label`: filename converted to a readable Polish admin label.

The catalogue is the only source used to render an image. A database row whose `image_path` does not exist in the catalogue is ignored rather than becoming an arbitrary URL. The first catalogue image is the fallback. A code-level fallback still uses the current hero image if the catalogue is empty during development.

## Persistence and security

A migration creates `public.portal_carousel_images`:

| Column | Purpose |
| --- | --- |
| `id uuid` | Stable primary key. |
| `image_path text unique` | Selected static-catalogue path, constrained to the `carousel/` namespace. |
| `position integer unique` | Zero-based deterministic display order. |
| `created_at timestamptz` | Audit timestamp. |

The table has RLS enabled. `anon` and `authenticated` roles can select rows. Only `authenticated` users whose `public.is_cms_admin()` check succeeds can insert, update, or delete rows. A `public.set_portal_carousel_images(text[])` security-invoker function is executable by authenticated users and itself verifies administrator access. It validates a non-null, duplicate-free list of paths in the `carousel/` namespace, locks existing rows, deletes removed selections, inserts new selections, and uses temporary positions before assigning final positions. This prevents unique-position collisions during reorder. The public application still filters returned rows through the static catalogue.

`src/lib/portal-carousel/repository.ts` contains all Supabase calls:

- `listPublicPortalCarouselImages(): Promise<PortalCarouselImage[]>`
- `listAdminPortalCarouselImages(): Promise<PortalCarouselImage[]>`
- `savePortalCarouselImages(paths: string[]): Promise<void>`

Both list functions return catalogue-resolved, position-sorted images. The write function rejects duplicate or unavailable catalogue paths before calling the migration function.

## Public hero

`src/components/public/HeroCarousel.tsx` receives `images: PortalCarouselImage[]` and renders them with the existing `Carousel`, `CarouselContent`, and `CarouselItem` primitives. It passes looped, non-draggable options and a new `interactive={false}` primitive option. The primitive suppresses its arrow-key handler when interaction is disabled. The component owns the seven-second timer through the Embla API; it cleans up the timer on unmount and never starts it when reduced motion is requested. It renders no carousel navigation controls.

The home route requests the public repository via TanStack Query. While loading or after a request error, it renders the deterministic fallback slide immediately. Once valid configuration loads, the configured sequence replaces it. Existing hero heading, copy, CTA, overlay, dimensions, metadata, and JSON-LD remain unchanged.

## CMS Portal page

The new protected route is `/admin/portal`. It uses the current CMS shell vocabulary and adds a **Portal** link to the existing `/admin` and `/admin/dokumenty` headers.

`PortalCarouselManager` displays:

1. The repository catalogue as image thumbnails with semantic selection checkboxes.
2. A separate ordered list of selected images.
3. Native buttons named `Przenieś wyżej` and `Przenieś niżej` for accessible ordering.
4. A primary `Zapisz karuzelę` action, a loading state, and visible success/error feedback.

Selections are edited in local component state and persisted only by the explicit save action. The manager keeps the chosen paths in catalogue order when first selected and removes an item when its checkbox is cleared. Saving is disabled during loading or mutation. The route remains protected by `AdminGuard`; UI protection is supplementary to RLS.

## Testing and verification

- Unit-test the catalogue/repository contract: sorted valid images are returned, unrecognised database paths are omitted, empty configuration yields an empty persisted list, and save rejects duplicate or unknown paths before Supabase is called.
- Component-test `HeroCarousel`: it renders only decorative image elements, does not render navigation controls, configures non-interactive operation, and does not schedule automatic movement when reduced motion is requested.
- Route-test the home page's fallback and configured public hero integration.
- Component-test `PortalCarouselManager`: selection, deselection, up/down ordering, save payload, and error feedback.
- Route-test `/admin/portal` guards and CMS navigation links.
- Extend `supabase/tests/cms_security.sql` to verify public reads, non-admin mutation denial, admin save permissions, valid reordering, and invalid carousel paths being rejected.
- Run focused Vitest suites during TDD, then `bun run lint` and `bun run build` before handoff.

## Out of scope

- Uploading, cropping, deleting, or tagging carousel assets in CMS.
- Per-slide text, links, CTA changes, captions, or analytics.
- Autoplay controls, pause controls, touch interaction, or a new client-side carousel package.
