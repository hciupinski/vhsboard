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

| Route                                                                                         | Purpose                                              |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `/`, `/o-nas`, `/wyjazdy`, `/eventy`, `/obozy`, `/kontakt`, `/skimboarding`, `/wypozyczalnia` | Eight prerendered marketing pages.                   |
| `/wyjazdy/:slug`, `/obozy/:slug`                                                              | JS offer details, served through `/_shell/app.html`. |
| `/trips/:slug`                                                                                | Legacy 301 redirect to `/wyjazdy/:slug`.             |
| `/admin`                                                                                      | Authorized offer list.                               |
| `/admin/login`                                                                                | Administrator sign-in.                               |
| `/admin/reset-password`                                                                       | Supabase password recovery.                          |
| `/admin/new`, `/admin/:slug`                                                                  | Create or edit an offer by slug.                     |
| `/admin/dokumenty`, `/admin/portal`                                                           | Contact PDF and carousel management.                 |

Cloudflare rewrites in [`public/_redirects`](../public/_redirects) send admin
routes to a separate `/_shell/admin.html`. It always has `noindex, nofollow`.
The public shell follows `VITE_SEO_INDEXING`; previews, missing offers, and
errors have their own noindex metadata in the browser. The internal render
targets `/spa-shell` and `/admin-shell` are build machinery, not public navigation.
Only the eight marketing pages enter the sitemap. See the [SEO runbook](seo-runbook.md).

## Data and authorization

- `offers` contains `trip` and `day_camp` offers, slugs, structured JSONB copy,
  dates, prices, an external booking URL, image references, and
  `draft` / `published` / `archived` status. Public repository queries explicitly
  filter published content; database RLS also enforces that boundary.
  Supported activities are `surf` and `snow` for trips, and `wake` and `snow`
  for camps. The legacy database enum value `combo` is not supported by the
  editor or public offer schemas. Public queries filter supported activities.
  The CMS reads a legacy trip with an unsupported activity as an unselected
  activity, requiring an explicit supported choice before saving or publishing.
- `offer_images` stores object paths, Polish alternative text, and gallery order.
  Publishing requires a hero record belonging to the offer with a valid alt.
  Gallery reordering uses the transactional `reorder_offer_images` RPC.
  Training photos have their own optional gallery and appear in the enabled
  Training section independently of its cards. Like other offer photos, they
  are stored in the private bucket and require a published offer for public
  access.
- `contact_documents` stores public PDF metadata, including an optional category (trips, camps, or organizer). Uncategorized legacy PDFs remain visible under “Pozostałe dokumenty” until an administrator assigns them in the document manager. The manager can edit a document’s title and category without replacing its PDF. `portal_carousel_images`
  stores selected local asset paths and order; it does not upload carousel files.
- `portal_rental_document` is a separate singleton holding the optional rental
  PDF path. CMS → Portal replaces it through `replace_portal_rental_document`;
  its file shares the private `contact-documents` bucket and one-hour signed
  URL rules. The public rental section shows its CTA only when a document is
  available on the standalone rental page and in the Wyjazdy section. Offers may
  optionally show a fixed link to the rental page, controlled per offer in the
  CMS. This does not add a rental reservation flow.
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

### Application boundaries

`src/lib/supabase.ts` owns the shared SDK client. Offer repositories own SQL
queries and safe error translation; Zod schemas and mappers validate database
rows before exposing domain objects. Public list queries select summary fields
without JSONB content or gallery rows. Lists and details both filter by published
status and offer kind; details additionally load content and ordered images.
Shared Query options keep route loaders and components
on the same cache keys and refetch on mount to obtain fresh browser-signed URLs.
Never substitute an administrator or preview query for a public query.

`editor-schema.ts` defines the editable input and draft/publication validation.
`src/routes/admin.$slug.tsx` owns editor state, validation feedback, unsaved
changes, mutations and cache refresh. `OfferEditorForm` is a controlled
composition of focused components in `src/components/admin/offer-editor`;
sections emit immutable updates and do not save, authenticate or create their
own copy of whole-offer state. Image managers are supplied separately for an
already saved offer and retain responsibility for their upload operations.
The editor derives field errors and tab markers from the current input.
It evaluates draft and publication requirements separately and queries image
readiness independently of saved text. Publication and edits to published
offers require current media checks and Supabase still enforces readiness at
write time. Withdrawing publication changes status without saving form edits.
The accommodation switch controls the CMS uploader and public section while
preserving existing images.
Keep v2 normalization and legacy compatibility at the shared form/data boundaries.
The price note is optional public copy beneath the included and excluded lists.
An enabled Training section can publish with an introduction alone. Transport
accepts several modes with a shared description and journey, or one journey per
camp term. Self-arrival alone needs no journey. Existing single-mode offers
remain readable and editable.

### Dates, lists and marketing badges

Date-based presentation uses `getTodayInWarsaw` in `Europe/Warsaw`. A dated
term is upcoming before its start date, ongoing from its start through its end
(inclusive), and finished afterwards. Lists order upcoming offers first, then
ongoing offers, then recently finished offers. Finished offers appear only if
they ended within one rolling calendar month, including the boundary date:
for example, on 6 November the boundary is 6 October. When the preceding month
is shorter, the boundary uses its last day. The homepage shows
at most three cards and omits offers without a start date. Category lists show
all eligible offers and keep undated offers after dated unfinished ones.
Ties use Polish title and ID. Finished cards are grey and do not link to details;
ongoing cards remain linked and show `W trakcie` instead of `Ostatnie miejsca`.

Camp summaries include only projected dates for up to two terms, without loading
the full description. The card is ongoing when any term is ongoing; between
terms it is upcoming if a later term exists. Ongoing camps are ordered by the
start of their earliest ongoing term; otherwise the next future term determines
upcoming order. Each term's registration closes on its start date, while links to
the terms remain available if another term is still upcoming. Trip registration
controls close on the start date. Disabled controls are native buttons; detail
URLs remain available for published offers. The administrator list independently
sorts unfinished offers before finished offers, then by start date (missing dates
last), Polish title and ID; finished admin cards retain editing actions, and only
published ones replace the publication label with `Zakończone`. Related trips
continue to show at most three upcoming trips other than the current one. Camp
summary dates span the first through last term, including gaps between terms.

## Cookie preferences

`src/lib/cookie-consent.ts` owns the first-party `vhsboard_cookie_consent` cookie:
URI-encoded JSON with boolean `analytics` and `marketing`, a 180-day lifetime,
`Path=/` and `SameSite=Lax`. Both optional categories default to false. Missing
or invalid preferences show the banner after the provider mounts; browser APIs
are guarded for prerendering. The public footer reopens the Radix preferences
dialog. A failed persistence attempt leaves the UI open rather than claiming
the choice was saved. The banner itself adds no analytics or marketing tags;
any future optional integration must enforce its category's consent explicitly.

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

`DevelopmentBanner` marks both public and CMS screens only when build-time
`VITE_SITE_URL` equals `https://develop.vhsboard.pages.dev`, independently of
Vite development mode. The root body attribute reserves space for the banner;
sticky headers and section anchors include `--development-banner-height`.

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

Gallery categories remain separate: `gallery` supplies hero candidates and the
main gallery, `accommodation` supplies accommodation photos, `resort_gallery`
supplies resort photos, and `resort_map` supplies the single trail map. Each
gallery has independent ordering; accommodation and resort photos use the shared
gallery's horizontal mobile layout. Story photos are selected from the main
gallery with `show_in_story`, not uploaded to a separate category. The database
limits selection to three per offer under an offer-row lock; their gallery order
determines display order. Before the story-image migration, reads retry without
the missing column, while attempts to change selection explain that migration
is required. Do not silently treat other database errors as an old schema.

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
