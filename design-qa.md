# VHS-050 — design QA

final result: blocked

## Target and scope

Selected visual truth: first displayed winter concept, with orange hover refinement.
Local reference files:

- `/Users/hciupinski/.codex/generated_images/01a17d3c-bf21-70c1-8376-fb027bc8abd7/exec-5c9d8b1e-6c55-4ae4-82e4-e287a8e51c7f.png`
- `/Users/hciupinski/.codex/generated_images/01a17d3c-bf21-70c1-8376-fb027bc8abd7/exec-ab4aa570-b92b-4490-a33e-296afbb36f90.png`

These are color concepts. Existing production layout, copy, fonts and real assets
take precedence over incidental differences introduced by generated images.
Requested verification viewports: 1440×900 and 390×844 at device scale 1.
No density-normalized side-by-side comparison or final implementation screenshot
has yet been captured; no visual fidelity pass is claimed.

## Browser verification obtained

- The regular local build rendered the existing public home page.
- Isolated QA server at `http://127.0.0.1:3038` intercepts only theme settings
  into temporary local state. Its test authentication is confined to the
  temporary Vite configuration outside the repository. All production write
  requests are blocked. Other public reads remain normal public reads.
- CMS → Portal displayed both choices, original selected, and save disabled
  until a draft was selected. Selecting winter enabled save. Saving returned
  the visible success message: “Wygląd strony został zapisany dla wszystkich
  odwiedzających.” No production theme was changed.
- Reading the independent visitor tab was blocked by the browser origin
  approval gate. The automatic review timed out without a decision, including
  a retry. This was not a finding that the operation was unsafe. No alternate
  tool was used to bypass the gate.

## Code-review findings and fixes

1. A delayed CMS refresh could overwrite a confirmed save. Added a deferred
   response regression test, observed RED, then cancelled in-flight admin and
   public queries before writing confirmed cache values. The regression and
   full 513-test suite passed.
2. Orange contact text on the winter gradient had insufficient normal-text
   contrast (approximately 3.20:1 at the darker end). Hover now adds the snow
   background under the orange link. Calculated token contrast is 4.70:1;
   actual rendered hover still needs verification.

## Fidelity surfaces still requiring screenshots

- Fonts/typography and wrapping: source fonts retained; browser comparison pending.
- Spacing/layout rhythm: existing layout retained; desktop/mobile comparison pending.
- Colors/tokens: implemented selected palette, but actual normal/hover/focus
  computed colors and contrast must be recorded in browser.
- Image quality/assets: existing generated assets retained; photo-overlay,
  gallery and responsive crop review pending.
- Copy/content: existing public content retained; CMS copy implemented and
  observed, full-page screenshot pending.

## Remaining acceptance checks

- Independent visitor reads winter after CMS save, open-tab refresh within
  30 seconds/focus, and restoration of original.
- All six public routes, both offer detail kinds, gallery, mobile menu and
  cookies at both viewports; hover, focus, overflow and console errors.
- Source/implementation comparison in the same input at aligned viewport/state.
- Real screenshots uploaded to project Drive and embedded in VHS-050 `Po / dowód`.

Keep the PR draft and tracker task in progress until these checks are complete.
