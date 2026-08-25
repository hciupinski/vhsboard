# VHSBOARD Architecture

## Product boundary

VHSBOARD is a public marketing site for company information, destinations, and
small-group surf and snowboard offers. A small internal CMS lets a handful of
administrators maintain offers, images, and selected site content.

VHSBOARD is not a reservation system. The authoritative booking flow remains
in an external booking system. Every published offer must include a booking URL and a CTA
that leaves VHSBOARD for the appropriate registration flow. Do not add payments,
availability, bookings, participant data, or public user accounts here.

## Current implementation

The current repository is a frontend prototype, not yet the production CMS:

- React, TypeScript, Vite, TanStack Router/Start/Query, Tailwind CSS, and Radix
  UI form the existing application stack.
- Static example offers and their gallery data are defined in
  `src/lib/trips.ts`.
- The public home page is `/`; offer detail pages use `/trips/:slug`.
- `/admin` and `/admin/:slug` provide a visual CMS prototype.
- `src/lib/adminStore.ts` reads and writes drafts in browser `localStorage`.
  It has no authentication, database, Row Level Security (RLS), upload
  pipeline, or production authorization. It must not become the production data
  layer.
- `src/start.ts` supplies application error handling and CSRF protection for
  TanStack Start server functions. The intended public marketing pages should
  remain static and should not depend on server-side work without a concrete
  need.

## Target production architecture

```text
Git repository
      │ CI/CD deployment
      ▼
Cloudflare static hosting, CDN, TLS, custom domain, cache
      │
      ├── Public marketing site
      └── Admin panel ──► Supabase
                            ├── PostgreSQL database
                            ├── Auth
                            └── Storage
```

The public site and admin panel remain one frontend project unless their
separation provides a clear, measured benefit. Cloudflare is responsible for
hosting, CDN delivery, TLS, domain handling, caching, and deployment from the
Git repository. Prefer static delivery and do not assume Cloudflare Workers,
KV, D1, R2, Queues, Durable Objects, or paid services are required.

Supabase is the backend platform. It provides PostgreSQL, Auth, Storage, direct
data access where securely appropriate, and Row Level Security. Do not add a
separate application backend merely to proxy straightforward CMS data access.

## Routes

The current prototype routes are `/` and `/trips/:slug`, with `/admin` and
`/admin/:slug` for the unauthenticated admin prototype. The intended public
information architecture is:

- `/`
- `/o-nas`
- `/oferty`
- `/oferty/:slug`
- `/kontakt`

Treat the target route names as an SEO and navigation migration, not a casual
rename. Preserve redirects and public links when moving from `/trips/:slug` to
`/oferty/:slug`.

## Domain model

Keep the schema small and pragmatic. Names below describe the intended model,
not a mandatory migration that overrides an already better implementation.

### `offers`

| Field                                      | Purpose                                               |
| ------------------------------------------ | ----------------------------------------------------- |
| `id`                                       | Stable primary key.                                   |
| `slug`                                     | Unique, human-readable public identifier.             |
| `title`, `subtitle`                        | Offer headings.                                       |
| `short_description`, `description`         | Listing and detail-page copy.                         |
| `location`                                 | Destination label.                                    |
| `start_date`, `end_date`                   | Optional trip period.                                 |
| `price_from`                               | Starting price, represented consistently for display. |
| `booking_url`                              | External registration destination.                    |
| `hero_image`                               | Reference to a Storage object or primary image.       |
| `status`                                   | `draft`, `published`, or `archived`.                  |
| `published_at`, `created_at`, `updated_at` | Lifecycle and audit timestamps.                       |

### `offer_images`

| Field          | Purpose                                 |
| -------------- | --------------------------------------- |
| `id`           | Stable primary key.                     |
| `offer_id`     | Required relation to `offers`.          |
| `storage_path` | Path of the object in Supabase Storage. |
| `alt_text`     | Meaningful image description.           |
| `position`     | Deterministic gallery order.            |
| `created_at`   | Upload timestamp.                       |

Add a minimal administrator-role source (for example, a `profiles` record or
approved Auth metadata) only as needed to support RLS. Do not rely solely on
hidden admin navigation or a successful login.

## Authentication and authorization

Public visitors have no accounts. Supabase Auth exists only for approximately
one to five administrators.

Enable RLS on CMS tables. The required policy outcome is:

| Actor                                          | Offers                                                              | Images / Storage                             |
| ---------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| Public visitor                                 | `SELECT` published offers only                                      | Read published offer images only.            |
| Authenticated administrator with approved role | `SELECT`, `INSERT`, `UPDATE`, `DELETE`; publish, unpublish, archive | Upload, update, and delete permitted images. |
| Any other user                                 | No CMS mutation; no draft or archived data                          | No upload, modification, or deletion.        |

Policies must be enforced at the database and Storage layer. Frontend state and
route guards improve UX but are not authorization. Drafts and archived offers
must not appear in public queries, server-rendered payloads, static generation
inputs, search indexes, or client-side caches intended for public use.

## Images and Storage

Use Supabase Storage for hero and gallery images. Store object references in
PostgreSQL; never duplicate image binaries in database rows. On upload:

1. Validate accepted image MIME type and a reasonable file-size limit before
   upload.
2. Generate a unique, stable path scoped to the offer or upload.
3. Require meaningful `alt_text` for images used as content.
4. Keep public read access limited to images belonging to published offers, or
   use signed delivery if public object access is not appropriate.
5. Delete an obsolete object only after confirming that no retained offer image
   record references it.

Do not introduce Cloudflare R2 or another asset platform unless Supabase Storage
has a specific, demonstrated limitation.

## Client configuration and secrets

The browser may receive only Supabase values intended for public clients, such
as the project URL and public/anon key, through documented Vite environment
variables. Never include a Supabase service-role key, a privileged database
credential, or an administrator secret in client code, source control, build
output, or static Cloudflare assets.

Authorization belongs in Supabase Auth and RLS policies. A client-side `isAdmin`
flag is never sufficient.

## Migration sequence

1. Create the Supabase project, minimal `offers` and `offer_images` schema,
   administrator-role mechanism, RLS policies, and Storage bucket policies.
2. Add the public Supabase environment variables to local and Cloudflare build
   configuration; keep privileged secrets out of the frontend.
3. Introduce a typed offer data-access module and replace static public reads
   from `src/lib/trips.ts` with published-offer queries.
4. Map the existing public cards and detail pages onto the persisted model,
   including the external `booking_url` CTA.
5. Replace `src/lib/adminStore.ts` mutations with authenticated Supabase CMS
   operations and add explicit admin sign-in, role checks, loading, and error
   states.
6. Implement Storage upload/list/delete behavior and image lifecycle safeguards.
7. Migrate route names deliberately, preserve redirects, verify SEO metadata,
   and deploy the static frontend from the Git repository to Cloudflare.

Keep each step independently deployable where possible. The public site must
continue to show only published content throughout the migration.

## Operational priorities

Optimize for maintainability, correctness, predictable queries, accessibility,
SEO, mobile devices, and fast cached loading — not hypothetical large scale.
The CMS will create roughly 10–20 offers a year and undergo occasional content
or visual changes. Avoid microservices, custom queues, elaborate asset DAMs,
or other infrastructure whose operational cost exceeds the product's needs.
