# CMS image upload verification — 2026-11-03

Scope: shared `ImageUploadForm` used through `OfferImageManager` in the gallery,
accommodation and resort map sections. Branch `codex/cms-image-upload`, based on
`origin/main` at `78775a1`. This is local verification, not a production deployment.

## Automated checks

- `bun run typecheck`: passed.
- `bun run test`: 80 files, 583 tests passed (570 on the unchanged baseline).
- `bun run lint`: no errors; seven existing React Fast Refresh warnings.
- `bun run build`: passed, including eight prerender targets and sitemap generation.
- Independent read-only review: no findings; 69 focused tests and targeted ESLint passed.

Regression tests cover immediate oversize/format/extension errors, empty files,
matching MIME and extension, the inclusive 8 MiB limit, trimmed alt text,
field-level error associations and correction, unique IDs across instances,
pending/disabled controls, duplicate submissions, failed-upload retry, category
forwarding and resetting fields after success even if refreshing the gallery fails.
Unreadable-image errors are wrapped in a safe Polish repository error before Storage.

## Browser checks

Local URL: `http://127.0.0.1:5183/.worktrees/upload-qa/index.html`.
The temporary harness rendered the production manager, upload fields, styles and
Fontsource fonts. Successful persistence was simulated at the repository boundary;
live authorized Supabase writes and RLS were not part of this check. The temporary
harness was removed from the checkout after verification.

| Viewport   | Result                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1440 × 900 | Both inputs at the same Y position, height 44 px; hints below controls. Oversized file rejected immediately; submit focuses the file field. |
| 1024 × 900 | Resort-map fields aligned, 44 px high. Missing file and invalid alt each have an associated error, `aria-invalid` and `aria-describedby`.   |
| 640 × 900  | Two columns remain aligned even when hints wrap. Accommodation upload displays a pending state, then the uploaded card and empty fields.    |
| 390 × 844  | One column; GIF rejected with accepted formats listed. Error remains while editing alt. Long filename stays inside its input.               |
| 320 × 844  | Labels, hints and controls fit in one column. No horizontal page overflow.                                                                  |

Screenshots were visually inspected and saved in the project Drive folder:

- [Desktop layout](https://drive.google.com/file/d/1gALBZdP_h23H8LUIYWa7setB2R65nS5Z/view)
- [Oversized file error](https://drive.google.com/file/d/1ArKM7pkp25EEotMSzL20LogVT-wUe59a/view)
- [Mobile format error](https://drive.google.com/file/d/1lVtWsvemg7sCP3eh3n5--bPm7FMV6rYv/view)
- [320 px layout](https://drive.google.com/file/d/1sHU7XJoZIwX_nzWOgvNHr96RYljqLDJ_/view)
- [Accommodation success and reset](https://drive.google.com/file/d/1ipYawQFxTLruk2EVH9cfsWO9Bk9pCx3b/view)
- [Resort map field validation](https://drive.google.com/file/d/1IJzFLJR5jlK3z7437jgFA7f9a0JnKVib/view)

The client tracker was read before selecting scope. It contains no matching task
for this direct CMS request; no existing client task or acceptance field was changed.
