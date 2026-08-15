# VHSBOARD — Agent Guide

Read this file before changing the application. The detailed references are:

- [Design system](docs/design-system.md)
- [Architecture](docs/architecture.md)

## Product scope

VHSBOARD is a Polish public marketing site for small surfing and snowboarding
trips. It presents the company, destinations, trip offers, and contact details.
It also has a deliberately small administrator CMS for offers and selected site
content.

This is **not** a booking application. Every published offer must use an
external TripAhead booking URL/CTA. Do not implement reservations, payments,
availability, participant management, or customer accounts.

## Current stack and project shape

- React 19 + TypeScript + Vite
- TanStack Router, Start, and Query
- Tailwind CSS 4 and Radix UI primitives
- Public home page: `/`
- Current public offer page: `/trips/:slug`
- Current CMS prototype: `/admin` and `/admin/:slug`

The public trips in `src/lib/trips.ts` and the `localStorage` implementation in
`src/lib/adminStore.ts` are prototype data sources. Do not extend
`localStorage` as a production CMS.

## Design guardrails

- Keep the site image-led, warm, energetic, and editorial — never generic
  travel SaaS or a dense back-office dashboard.
- Use the semantic Tailwind tokens defined in `src/styles.css`; preserve the
  warm cream, volcanic orange, ocean blue, sand, and sunset-gradient identity.
- Use `Bebas Neue` for display headings and `Barlow` for body copy.
- Prefer small, composable components and existing Radix/shadcn-style UI
  primitives over new dependencies or large abstractions.
- Keep visitor-visible copy and meaningful image alt text in Polish unless a
  task explicitly requires another language.
- Preserve mobile-first layouts, semantic HTML, keyboard access, visible focus,
  and readable contrast.

## Production architecture and security

- Deploy the frontend as a static, cache-friendly Cloudflare site from the Git
  repository. Cloudflare provides hosting, CDN, TLS, domain, caching, and CI/CD
  integration; do not assume Workers, KV, D1, R2, Queues, or Durable Objects.
- Use Supabase for PostgreSQL, Auth, Storage, and Row Level Security (RLS).
  Do not add a separate backend without a concrete requirement.
- Browser code may use only public Supabase credentials. Never expose service
  role or other privileged credentials.
- Login alone is not authorization. Supabase Auth plus database and Storage RLS
  policies must protect every administrative operation.
- Public queries may expose only published offers. Draft and archived content
  must never be returned to public visitors.

## Implementation conventions

- Keep public-site and admin-CMS concerns separate, even while they remain in
  one application.
- Prefer direct, securely authorized frontend-to-Supabase calls for this small
  CMS. Avoid premature backend layers and infrastructure.
- Store image object paths and metadata, not binary data, in the database.
- Validate uploaded image type and size; use unique storage paths and useful
  alt text.
- Treat the planned public route names (`/o-nas`, `/oferty`, `/oferty/:slug`,
  `/kontakt`) as a migration target. Do not rename existing routes without a
  deliberate routing and SEO migration.

## Useful commands

```bash
bun run dev
bun run build
bun run lint
bun run format
```

Run `bun run lint` and `bun run build` after application changes. For docs-only
work, check that Markdown links, file references, and statements about the
current code are correct.
