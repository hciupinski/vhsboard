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
- Prerendered marketing routes: `/`, `/o-nas`, `/wyjazdy`, `/eventy`, `/obozy`, `/kontakt`
- JS offer details: `/wyjazdy/:slug`, `/obozy/:slug`; `/trips/:slug` is a legacy 301 redirect
- Supabase CMS: `/admin`, `/admin/login`, `/admin/new`, `/admin/:slug`,
  `/admin/dokumenty`, `/admin/portal`
- Public and admin details receive separate static shells; admin always stays noindex

Offers, photographs, contact PDFs, and carousel selection use Supabase, Auth,
and RLS. Publishing content does not rebuild the frontend. Code, repository
photographs, fonts, and OG images require a Git build/deploy.

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
- Preserve current routes and legacy redirects; rename routes only with a
  deliberate routing and SEO migration.
- Use `ResponsiveImage` and the generated local asset catalogue for repository
  photographs. Do not restore eager imports of full-size originals.
- Use local Fontsource fonts, semantic contrast tokens, and reduced-motion guards.

## Useful commands

```bash
bun run dev
bun run typecheck
bun run test
bun run lint
bun run build:ci
bun run build
bun run check:seo
bun run images:check
bun run format
```

Run `bun run typecheck`, `bun run test`, `bun run lint`, and `bun run build` after application changes. For docs-only
work, check that Markdown links, file references, and statements about the
current code are correct.
