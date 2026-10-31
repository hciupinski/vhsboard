# VHS-050 — design QA

final result: passed

## Visual target and comparison

Selected target: the first displayed winter concept (“Lodowiec”), refined to
use original orange on hover. This is a color-theme change: existing page
layouts, fonts, photographs and Polish copy take precedence over incidental
differences in generated mockups.

Source images:

- `/Users/hciupinski/.codex/generated_images/01a17d3c-bf21-70c1-8376-fb027bc8abd7/exec-5c9d8b1e-6c55-4ae4-82e4-e287a8e51c7f.png`
- `/Users/hciupinski/.codex/generated_images/01a17d3c-bf21-70c1-8376-fb027bc8abd7/exec-ab4aa570-b92b-4490-a33e-296afbb36f90.png`

Implementation evidence:
`/Users/hciupinski/Repositories/vhsboard/.superpowers/evidence/2026-10-28-winter-theme/`.

The source and actual normal/hover screenshots were opened together in
`design-comparison.png`, with both columns normalized to the same displayed
width. Actual desktop captures are 1440×900 CSS/pixels, mobile captures
390×844, device scale 1. Generated references have a slightly different
frame size; equal-width comparison preserves aspect ratio and aligns the
header, hero and following section. No image was stretched or retouched.
Individual full-size home, contact and CMS screenshots were also inspected
for readable labels, link treatment, spacing and mobile wrapping.

## Browser scope and results

The user explicitly approved local Playwright after native browser origin
approval timed out. Chromium verified the real branch at
`http://127.0.0.1:3038`. A temporary configuration outside the repository
isolated theme state and test authentication. Public offer data and signed
image responses were fixtures using real repository images. Production
writes were blocked; no live settings, accounts or offers changed.

Tested both original and winter themes on:

- `/`, `/o-nas`, `/wyjazdy`, `/eventy`, `/obozy`, `/kontakt`
- `/wyjazdy/qa-winter-trip`, `/obozy/qa-winter-camp`

Each route was checked at 1440×900 and 390×844. There was no horizontal
overflow, broken image or uncaught JavaScript exception. Winter route
measurements, six hover states, focus, state transitions and 26 screenshots
are recorded in `verification.json`.

Independent admin and visitor browser contexts confirmed:

- New visitor pages fetched winter after a successful CMS save.
- An already-open visible visitor page changed after 28,708 ms.
- Saving original restored the public palette.
- Failed saves retained the draft and did not announce success; retry worked.
- Failed background reads retained winter; first-entry failure used original.
- Failed CMS loads blocked saving; retry recovered the saved selection.
- Public → CMS navigation removed the public theme.

## Actual colors and accessibility

| Surface                                   | Measured result                                   |
| ----------------------------------------- | ------------------------------------------------- |
| Primary normal background                 | `oklch(0.49174 0.11133 244.139)` / RGB 23,102,155 |
| Primary hover background                  | `oklch(0.56 0.17 42)` / original orange           |
| White label on blue                       | 6.16:1                                            |
| White label on orange                     | 5.01:1                                            |
| Orange contact link on snow hover backing | 4.70:1                                            |

Orange hover was checked on the hero CTA, contact link, gallery next arrow,
mobile-menu link and cookie outline/reject buttons. Keyboard focus remained
visible. The gallery supported keyboard navigation and restored thumbnail
focus after closing; the cookie dialog inherited the winter surface.

The first harness read checked mobile-menu visibility immediately after
Escape, while its closing transition was still visible. The focused
`mobile-menu-close.json` check waits for hidden state and confirms closure
and trigger focus restoration. This required a harness synchronization
change, not an application change.

## Required fidelity surfaces

- **Fonts/typography:** Barlow body and Bebas Neue headings were measured on
  all winter routes. Hierarchy, original wrapping and readable UI labels remain.
- **Spacing/layout rhythm:** existing containers, header height, hero and
  card structures remain; both viewports fit without horizontal scrolling.
- **Colors/tokens:** snow surfaces, navy text and blue actions match the
  selected semantic palette; orange appears on hover. The exact blue is
  intentionally darker than the generated mock to maintain label contrast.
- **Image quality/assets:** existing optimized real photographs and original
  brand assets are retained. No generated photograph or logo replacement was
  introduced; photo overlays and the mobile gradient remain readable.
- **Copy/content:** original public content and routing remain; CMS controls
  and success/error feedback are in Polish. Offer text in screenshots is
  explicitly isolated test content.

## Findings and comparison history

No actionable P0/P1/P2 visual findings remain. Independent code review had
identified a CMS cache race and contact-hover contrast issue. The race was
fixed with query cancellation and a deferred-response RED→GREEN regression;
the contact backing was fixed and its rendered 4.70:1 contrast verified.
The full application suite passed 513 tests, along with typecheck, lint
(0 errors / 7 existing warnings), full prerender build and SEO. Four GitHub
checks passed for the implementation commit `57b0deb`. PostgreSQL tests
verified 14 RLS assertions in a rollback-only local transaction.

The comparison preserves original photography/layout and applies the agreed
palette; incidental brightness, logo rendering and type-size changes in the
generated concept were not treated as redesign requirements.

## Evidence and client tracking

Ten real screenshots are stored in the project Drive folder:
[Winter theme evidence](https://drive.google.com/drive/folders/1GDzviXg4l4nsyM4lon4eAGRi1Lzg49AF).

Browser verification is complete. Embedding the primary screenshot in the
tracker's `Po / dowód` cell remains an administrative evidence step: no
authenticated Sheets session or connected document session is available.
Supplementary Drive links do not replace that required embedded image.
Keep VHS-050 in progress until the cell is completed; human client acceptance
remains untouched. No production deployment or theme activation is claimed.
