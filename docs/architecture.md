# VHSBOARD Architecture

## Product boundary

VHSBOARD is a Polish marketing site for surfing and snowboarding trips, events,
and children's sports camps. The small administrator CMS manages offers, offer
photographs, contact PDFs, and the homepage carousel. Every published offer
links to an external TripAhead booking flow. Reservations, payments,
availability, participant management, and public accounts are outside this app.

## Current implementation

React 19, TypeScript, Vite, TanStack Router/Start/Query, Tailwind CSS 4, and Radix
UI form one frontend. Cloudflare Pages serves the static `.output/public`
artifact; there is no production application server or Cloudflare Worker.
Supabase provides PostgreSQL, Auth, private Storage, and RLS. Browser code uses
only the public project URL and anon key.

```text
Git → GitHub Actions → Cloudflare Pages (static HTML, JS, CSS, photographs, fonts)
                                │ browser queries and CMS mutations
                                ▼
                         Supabase Auth / PostgreSQL / Storage + RLS
```

Marketing HTML is prerendered at build time. Offer lists and details are queried
from Supabase in the browser. Publishing or editing an offer requires no rebuild;
a newly opened page fetches the current data. This is not a push subscription
for visitors who already have the page open. Code, local photography, fonts,
social previews, and build-time company configuration require a new Git deploy.

## Routes and delivery

| Route                                                      | Purpose                                              |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `/`, `/o-nas`, `/wyjazdy`, `/eventy`, `/obozy`, `/kontakt` | Six prerendered marketing pages.                     |
| `/wyjazdy/:slug`, `/obozy/:slug`                           | JS offer details, served through `/_shell/app.html`. |
| `/trips/:slug`                                             | Legacy 301 redirect to `/wyjazdy/:slug`.             |
| `/admin`                                                   | Authorized offer list.                               |
| `/admin/login`                                             | Administrator sign-in.                               |
| `/admin/new`, `/admin/:slug`                               | Create or edit an offer by slug.                     |
| `/admin/dokumenty`, `/admin/portal`                        | Contact PDF and carousel management.                 |

Cloudflare rewrites in [`public/_redirects`](../public/_redirects) send admin
routes to a separate `/_shell/admin.html`. It always has `noindex, nofollow`.
The public shell follows `VITE_SEO_INDEXING`; previews, missing offers, and
errors have their own noindex metadata in the browser. The internal render
targets `/spa-shell` and `/admin-shell` are build machinery, not public navigation.
Only the six marketing pages enter the sitemap. See the [SEO runbook](seo-runbook.md).

## Data and authorization

- `offers` contains `trip` and `day_camp` offers, slugs, structured JSONB copy,
  dates, prices, an external booking URL, image references, and
  `draft` / `published` / `archived` status. Public repository queries explicitly
  filter published content; database RLS also enforces that boundary.
- `offer_images` stores object paths, Polish alternative text, and gallery order.
  Publishing requires a hero record belonging to the offer with a valid alt.
  Gallery reordering uses the transactional `reorder_offer_images` RPC.
- `contact_documents` stores public PDF metadata. `portal_carousel_images`
  stores selected local asset paths and order; it does not upload carousel files.
- `portal_settings` is a singleton (`id = 1`) storing the global
  `original | winter` theme. Public visitors can read it; only CMS administrators
  can update its `theme` column. Client roles cannot insert, delete or move it.
- `profiles.role = 'admin'` is manually granted to approved Auth users. Login alone
  does not authorize editing. Route checks improve UX; database and Storage RLS
  protect every mutation. Public and administrator repositories and query keys
  remain separate, including authenticated preview queries.

Implementation modules live under `src/lib/offers`, `src/lib/images`,
`src/lib/documents`, `src/lib/portal-carousel`, and `src/lib/auth`. Schema changes
live in `supabase/migrations`; security tests live in `supabase/tests`.
The [Supabase runbook](supabase-runbook.md) describes local database checks and roles.

## Global appearance

CMS → Portal publishes the shared theme independently of carousel selection.
`PortalThemeProvider` reads it with a separate public Query key and applies a
root HTML attribute so dialogs and cookie preferences share the palette.
Admin routes and the admin build shell do not apply the public theme.

New entries fetch the current setting. Visible open pages poll every 30 seconds
and refetch when the tab becomes active; background pages do not poll. On a
temporary failure the existing page retains its last fetched theme. On the
first fetch, or without JavaScript, the static original palette remains until
settings are available. This may briefly show the original palette before
the winter setting arrives; it does not block the marketing content. The
browser does not store a visitor-specific theme preference.

The initial release requires a forward migration followed by a frontend deploy.
The migration seeds `original`; later switches require only a CMS save and no
Cloudflare rebuild. Publishing the code does not itself activate winter.

## Media

Offer photographs use the private `offer-images` bucket. New uploads validate
MIME, extension, input size, and alt text, then preserve orientation, resize the
longest edge to at most 1920 px without enlarging, and encode WebP up to 2 MiB.
Unique paths remain scoped to the offer; existing objects are not recompressed.
Contact PDFs use the private `contact-documents` bucket. Authorized reads create
signed URLs lasting one hour. Do not persist these temporary URLs in the database,
static HTML, sitemap, social metadata, logs, or source control. A signed URL
already issued remains usable until expiry even if publication status changes.

Repository photographs have generated AVIF/WebP variants and intrinsic dimensions.
Fontsource fonts and JPEG social previews are served locally. Generation and
budget checks are described in the [deployment runbook](deployment-runbook.md).

## Maintenance

Pull requests targeting `main` or `develop` run **Verify** (`test`, `lint`,
`typecheck`, `build`) using synthetic public configuration, without deployment
secrets. PR builds skip prerendering and sitemap generation. **Deploy Pages**
maps only `refs/heads/main` to GitHub Environment `production` and
`refs/heads/develop` to `development`. Each deploy verifies configuration and
branch head, applies forward migrations to its own Supabase, builds the static
artifact, checks SEO and uploads it to the same Pages project `vhsboard`.

Pages production branch must remain `main`, verified through API before every
upload. The main site uses `https://vhsboard.pages.dev` until a separate domain
cutover; develop uses `https://develop.vhsboard.pages.dev` and always noindex.
The production Supabase is retained; development uses an independent project,
Auth users and Storage. CMS content does not move with Git merges. Deployment
metadata and a public `_deployment.json` marker verify the exact SHA served by
both the deployment URL and stable origin. Account-level settings, secrets and
branch protections require live verification; repository files do not prove them.

Keep this architecture small. No separate backend, queues, asset platform, or
booking feature is needed for the current product. See the
[deployment runbook](deployment-runbook.md) for logs and operational checks.

## Structured offer sections (VHS-020 / VHS-020a)

The editor normalizes saved content to `schemaVersion: 2`. Legacy offers remain
readable without new blocks. A database trigger rejects overwriting v2 with a
legacy payload, prompting an older CMS tab to refresh before saving.

The shared section registry in `src/lib/offers/sections.ts` controls CMS tabs,
public menu order and visibility: About → Program → Price → Accommodation →
Resort → Training → Transport → Insurance → Gallery. Program retains the existing
schedule, Price includes camp terms, and camp parent information belongs to About.
Existing nested hash anchors continue working.

Accommodation, Resort, Training, Transport and Insurance are optional. Switching
one off preserves its content and images, hides its public section and skips its
publication completeness checks. Drafts may contain incomplete new sections;
published offers require complete enabled sections in both frontend and SQL.
Storage metadata, safe links, structural limits and price bounds remain validated.

Camp terms gain stable UUIDs on first edit. Transport has shared mode/copy and a
journey per term UUID; reordering or renaming never changes the assignment. Deleting
a term removes its journey from the next saved payload. Own travel requires no
invented dates. The old parent transport paragraph stays editable and visible in
About until the new Transport section is enabled, avoiding silent loss or duplicate
public copy. New insurance packages/extensions are descriptive only; the site does
not select packages or implement bookings.

The optional resort trail map uses a separate `resort_map` image category, excluded
from hero and gallery selection. A partial unique index permits one map per offer.
The administrator-only `replace_offer_resort_map` RPC locks the offer row and
atomically replaces metadata after upload; the old object is cleaned only after
success and reference checks. Failed cleanup exposes a safe retry. An uncertain
RPC response must never cause deletion of a referenced new map. Normal private
Storage, signed URL TTL and RLS boundaries apply.
