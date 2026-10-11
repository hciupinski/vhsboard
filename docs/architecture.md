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
- `profiles.role = 'admin'` is manually granted to approved Auth users. Login alone
  does not authorize editing. Route checks improve UX; database and Storage RLS
  protect every mutation. Public and administrator repositories and query keys
  remain separate, including authenticated preview queries.

Implementation modules live under `src/lib/offers`, `src/lib/images`,
`src/lib/documents`, `src/lib/portal-carousel`, and `src/lib/auth`. Schema changes
live in `supabase/migrations`; security tests live in `supabase/tests`.
The [Supabase runbook](supabase-runbook.md) describes local database checks and roles.

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

Pull requests run the **Verify** workflow (`test`, `lint`, `typecheck`, `build`).
The PR build skips prerendering and sitemap generation. A `main` deploy runs
verification, forward Supabase migrations, then the full build, SEO check, and
Pages upload. Branch protection and account configuration must be checked in
GitHub; repository files alone do not prove they are enabled.

Keep this architecture small. No separate backend, queues, asset platform, or
booking feature is needed for the current product. See the
[deployment runbook](deployment-runbook.md) for logs and operational checks.
