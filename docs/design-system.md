# VHSBOARD Design System

## Purpose

VHSBOARD should feel like an invitation from people who genuinely spend time
outside: sun-bleached, direct, lively, and human. It is an editorial travel
brand for surf and snowboard trips, not a polished corporate travel portal and
not a generic SaaS interface.

The public site creates desire and confidence through photography, short
confident copy, and clear calls to action. The admin panel uses the same visual
DNA, but puts clarity and efficient editing first.

## Source of truth

The implemented tokens live in [`src/styles.css`](../src/styles.css). Reuse
their semantic Tailwind utilities (`bg-background`, `text-primary`,
`bg-secondary`, `border-border`, and so on) instead of introducing near-match
hex values or a second palette.

| Role          | CSS token           | Light-theme value         | Intent                                         |
| ------------- | ------------------- | ------------------------- | ---------------------------------------------- |
| Page ground   | `--background`      | `oklch(0.985 0.012 85)`   | Warm cream, never sterile white.               |
| Main text     | `--foreground`      | `oklch(0.22 0.03 60)`     | Deep warm brown for high contrast.             |
| Brand action  | `--primary`         | `oklch(0.63 0.19 42)`     | Volcanic orange for primary CTAs and emphasis. |
| Place/context | `--accent`          | `oklch(0.55 0.11 210)`    | Ocean blue, used with restraint.               |
| Quiet section | `--secondary`       | `oklch(0.94 0.03 85)`     | Sand-tinted surface.                           |
| Boundaries    | `--border`          | `oklch(0.9 0.02 80)`      | Soft separation without cold grey.             |
| Warm emphasis | `--gradient-sunset` | Orange-to-golden gradient | Use for memorable small surfaces and CTAs.     |

Supporting tokens are `--sunset`, `--ocean`, `--sand`, and `--shadow-warm`.
All CSS color additions must use OKLCH, matching the existing stylesheet.

## Typography

- Use **Bebas Neue** (`font-display`) for display headings, card titles, prices,
  and compact editorial labels. Its large, condensed character is a defining
  part of the brand.
- Use **Barlow** (`font-sans`) for paragraphs, forms, navigation, and all text
  that must be read at normal size.
- Keep display headings large and compact (`leading-[0.95]` is established for
  hero titles); let supporting copy provide breathing room beneath them.
- Use small uppercase eyebrow labels with measured letter spacing for section
  context, such as `SURF · SNOWBOARD · WYJAZDY GRUPOWE`.
- Do not replace the display type with an arbitrary sans-serif or use
  all-uppercase for body paragraphs.

## Layout and imagery

### Public pages

- Lead major pages with strong, authentic outdoor photography. Use a dark,
  readable overlay when copy appears over an image.
- Keep primary content inside `max-w-6xl` containers with `px-5` mobile
  gutters. Increase vertical rhythm at larger breakpoints rather than shrinking
  content into desktop-only layouts.
- Use broad sections, clear content order, and substantial whitespace. The
  homepage moves from story, to offers, to a high-contrast contact conversion
  block.
- Offer cards are image-first, with an activity label, place, short story,
  duration/group detail, price, and a single clear next action.
- Detail pages pair a generous hero with concise trip facts, then organise
  longer content into readable sections: story, highlights, schedule, what is
  included, gallery, and related trips.

### Admin CMS

- Keep the editor calm, light, and functional: restrained surfaces, grouped
  form fields, tabs for content categories, status badges, and explicit save or
  publish actions.
- Retain the same rounded forms, warm palette, and typography, but do not use
  decorative hero treatment that slows operational work.
- Keep destructive actions visually distinct and accessible; an icon alone is
  insufficient without an accessible name or a confirming interaction when the
  action becomes persistent.

## Components and interaction

- Use existing Radix-based UI primitives from `src/components/ui` before adding
  a dependency or reimplementing accessible behavior.
- Public cards and gallery tiles may use the established, restrained lift on
  hover (`hover:-translate-y-1`) and `shadow-warm`. Avoid exaggerated parallax,
  autoplay, or decorative animation.
- Use `rounded-full` for compact CTAs, pills, and tags. Use `rounded-2xl` or
  `rounded-3xl` for cards, images, and major content panels.
- Primary actions use the orange `primary` token. Outline/secondary actions
  should remain visibly secondary; a page should have one obvious primary CTA
  per decision point.
- Preserve sticky headers only where they improve navigation. They must keep a
  readable background and a clear bottom boundary while scrolling.

## Content voice

Public visitor-visible copy is **Polish**. It should sound warm, specific,
capable, and slightly informal — written by a trip organiser who rides, rather
than a sales catalogue.

- Prefer concrete sensory or practical details: a named place, activity,
  equipment, group size, or moment from the trip.
- Use short, clear sentences around a larger editorial headline.
- Avoid corporate superlatives, empty luxury language, urgency tricks, and
  generic phrases such as “an unforgettable adventure”.
- Do not promise booking, live availability, or payment handling on VHSBOARD.
  The booking action directs visitors to TripAhead.

## Responsive and accessibility requirements

- Build mobile-first. A multi-column layout must collapse cleanly without
  horizontal scrolling, clipped labels, or hidden actions.
- Use semantic landmarks, heading hierarchy, native buttons and links, and
  descriptive link text. Do not use a clickable `div` when a link or button is
  appropriate.
- Every meaningful image needs concise Polish alternative text that conveys its
  subject or purpose. Decorative images may use `alt=""`.
- Keep visible keyboard focus, sufficient contrast, target sizes appropriate
  for touch, and status/error feedback that does not rely on color alone.
- Keep animations short and nonessential. Do not make motion the only way to
  discover or understand content.

## Review checklist

Before approving a UI change, check:

1. Does it use the semantic palette and the existing type roles?
2. Does it feel image-led and editorial on public pages, while remaining calm
   and practical in admin views?
3. Does it work on a narrow viewport and with keyboard navigation?
4. Is the Polish copy specific, human, and consistent with a TripAhead
   handoff?
5. Has it reused an existing Radix primitive or focused component where one
   already exists?
