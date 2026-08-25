# Contact Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow administrators to upload PDF documents to Supabase Storage and display safe, readable links in the “Do pobrania” section on `/kontakt`.

**Architecture:** An independent `contact_documents` metadata table and private `contact-documents` bucket form the document domain. The browser validates input and uses a random object path, then makes directly authorized Supabase calls. RLS exposes a public document only once the metadata row exists; a protected CMS route manages documents, and a standalone public Query component renders them.

**Tech Stack:** React 19, TypeScript, TanStack Router and Query, Vitest, Testing Library, Supabase PostgreSQL/Storage/RLS, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-08-25-contact-documents-design.md`

## Global Constraints

- Only `application/pdf` files with matching `.pdf` suffix and maximum size `10485760` bytes (10 MiB) are accepted.
- Use private bucket `contact-documents`; do not reuse `offer-images`.
- Use only public `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in browser code. No service-role key or proxy is permitted.
- Public reads are limited by RLS to metadata-backed rows/objects; every mutation requires `public.is_cms_admin()`.
- Store only metadata and the random path `documents/<uuid>.pdf` in PostgreSQL.
- Polish UI copy, semantic HTML, visible focus, and `target="_blank" rel="noreferrer"` on public links are required.
- Keep `src/routeTree.gen.ts` generated: never edit it directly.
- Do not add manual external URLs, non-PDF formats, localStorage persistence, payments, reservations, or accounts.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `supabase/migrations/20260825160000_create_contact_documents.sql` | Table, bucket, grants, constraints and RLS. |
| `supabase/tests/cms_security.sql` | SQL security coverage for table and Storage policies. |
| `docs/supabase-runbook.md` | Operational rules for the new private bucket. |
| `src/lib/documents/validation.ts` | PDF/title validation. |
| `src/lib/documents/path.ts` | Random-path creation and verification. |
| `src/lib/documents/schema.ts`, `types.ts` | Supabase boundary parser and public type. |
| `src/lib/documents/repository.ts` | List, signed URL, upload, delete and cleanup retry. |
| `src/components/admin/ContactDocumentManager.tsx` | CMS upload/list/delete controls. |
| `src/routes/admin.dokumenty.tsx` | Protected CMS route. |
| `src/components/public/ContactDocuments.tsx` | Isolated public download section. |
| `src/routes/kontakt.tsx` | Placement of the public section. |

### Task 1: Supabase document model and authorization

**Files:**
- Create: `supabase/migrations/20260825160000_create_contact_documents.sql`
- Modify: `supabase/tests/cms_security.sql`
- Modify: `docs/supabase-runbook.md`

**Interfaces:**
- Produces table `public.contact_documents(id, title, storage_path, position, created_at)`.
- Produces private bucket `contact-documents` and path contract `documents/<uuid>.pdf`.
- Consumes the existing `public.is_cms_admin()` role check.

- [ ] **Step 1: Write failing SQL security assertions**

Inside the existing `do $$` test block, add variables for one linked and one unlinked path. Assert that the new bucket has `public = false`, `file_size_limit = 10485760`, and exactly `array['application/pdf']`. Insert a linked row as admin and its Storage object, then, under the existing `anon` role, prove the linked object and row are readable but an unlinked object is not. Assert that `anon` and the existing non-admin editor cannot insert a document row or a document object.

Use the fixed fixture values:

```sql
contact_document_path := 'documents/30000000-0000-0000-0000-000000000001.pdf';
unlinked_document_path := 'documents/30000000-0000-0000-0000-000000000002.pdf';
insert into public.contact_documents (title, storage_path, position)
values ('Regulamin wyjazdów', contact_document_path, 0);
```

- [ ] **Step 2: Run the test and observe red**

Run: `supabase db reset && supabase test db supabase/tests`

Expected: FAIL because the table and bucket do not exist.

- [ ] **Step 3: Add the smallest forward-only migration**

Create this data shape, with a PostgreSQL regex enforcing the exact storage path:

```sql
create table public.contact_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  storage_path text not null unique check (
    lower(storage_path) ~ '^documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$'
  ),
  position integer not null unique check (position >= 0),
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contact-documents', 'contact-documents', false, 10485760, array['application/pdf']::text[]);
```

Grant public table select and authenticated mutations, then enable RLS. Add a public table-select policy and all-operation admin policy guarded by `(select public.is_cms_admin())`. Add Storage select policy requiring `bucket_id = 'contact-documents'` and a matching `contact_documents.storage_path`; add admin-only insert/update/delete policies matching only `documents/<uuid>.pdf`. Do not require an existing metadata row for an insert, since Storage upload precedes insert. Document this private-bucket contract in the Supabase runbook.

- [ ] **Step 4: Verify SQL green**

Run: `supabase db reset && supabase db lint --fail-on error && supabase test db supabase/tests`

Expected: migrations, lint, and all table/Storage RLS assertions pass.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260825160000_create_contact_documents.sql supabase/tests/cms_security.sql docs/supabase-runbook.md
git commit -m "feat: secure contact document storage"
```

### Task 2: Validation, paths and Supabase row parsing

**Files:**
- Create: `src/lib/documents/validation.ts`
- Create: `src/lib/documents/validation.test.ts`
- Create: `src/lib/documents/path.ts`
- Create: `src/lib/documents/path.test.ts`
- Create: `src/lib/documents/schema.ts`
- Create: `src/lib/documents/schema.test.ts`
- Create: `src/lib/documents/types.ts`

**Interfaces:**
- Produces `validateDocumentFile(file)`, `validateDocumentTitle(title)`, `createDocumentPath(id)`, `isDocumentPath(path)`, `contactDocumentRowSchema`, and `ContactDocument`.
- Is consumed by Task 3 and both UI tasks.

- [ ] **Step 1: Write focused failing tests**

Cover a valid `new File(['pdf'], 'regulamin.pdf', { type: 'application/pdf' })`, a PDF MIME type with a non-PDF suffix, an unsupported MIME, missing MIME, an 10 MiB + 1 byte file, trimmed title `'  Regulamin  '`, two-character title, 161-character title, valid UUID path and malformed path. For row parsing, test valid `{ id, title, storage_path, position }` and reject bad id, empty title, bad path and negative position.

- [ ] **Step 2: Verify red**

Run: `VITE_SUPABASE_URL=https://supabase.example.test VITE_SUPABASE_ANON_KEY=test-anon-key bunx vitest run src/lib/documents/validation.test.ts src/lib/documents/path.test.ts src/lib/documents/schema.test.ts`

Expected: FAIL with missing document modules.

- [ ] **Step 3: Implement the contract**

Define these exact exports:

```ts
export const PDF_MIME_TYPE = "application/pdf";
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const validateDocumentFile = (file: File): Result<void, DocumentValidationError> => { /* MIME, suffix, size */ };
export const validateDocumentTitle = (title: string): Result<string, DocumentValidationError> => { /* trim, 3–160 */ };
export const createDocumentPath = (id: string): string => `documents/${id}.pdf`;
export const isDocumentPath = (path: string): boolean => documentPathPattern.test(path);

export const contactDocumentRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  storage_path: z.string().trim().min(1),
  position: z.number().int().nonnegative(),
});

export type ContactDocument = {
  id: string; title: string; path: string; position: number; signedUrl: string | null;
};
```

Implement all production code indicated by comments (do not leave comments as code). Keep error strings neutral and Polish; do not echo a local filename.

- [ ] **Step 4: Verify green**

Run the Step 2 command again.

Expected: all contract tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/documents
git commit -m "feat: validate contact document uploads"
```

### Task 3: Supabase repository and cleanup lifecycle

**Files:**
- Create: `src/lib/documents/repository.ts`
- Create: `src/lib/documents/repository.test.ts`

**Interfaces:**
- Consumes: Task 2 APIs and `src/lib/supabase.ts`.
- Produces `listPublicContactDocuments()`, `listAdminContactDocuments()`, `uploadContactDocument(title, file, position)`, `deleteContactDocument(id)`, `retryContactDocumentObjectCleanup(path)`, `DocumentRepositoryError`, and `DocumentCleanupPendingError`.

- [ ] **Step 1: Write failing mocked-Supabase tests**

Reuse the hoisted mock and fluent query double pattern in `src/lib/images/repository.test.ts`. Test listing `id,title,storage_path,position` ordered by position and mapping a valid HTTPS signed URL. Test successful upload before metadata insert and this exact call:

```ts
expect(storageUpload).toHaveBeenCalledWith(expectedPath, expect.any(Blob), {
  contentType: "application/pdf",
  upsert: false,
});
expect(insertQuery.insert).toHaveBeenCalledWith({
  title: "Regulamin",
  storage_path: expectedPath,
  position: 0,
});
```

Also test invalid title/file/position before Supabase calls, failed upload without insert, failed insert compensated with `remove([expectedPath])`, removal failure resulting in `DocumentCleanupPendingError`, and malformed retry path rejected before Storage.

- [ ] **Step 2: Verify red**

Run: `VITE_SUPABASE_URL=https://supabase.example.test VITE_SUPABASE_ANON_KEY=test-anon-key bunx vitest run src/lib/documents/repository.test.ts`

Expected: FAIL because the repository exports do not exist.

- [ ] **Step 3: Implement the repository**

Use bucket `contact-documents`, 3600-second signed URLs, and query columns `id,title,storage_path,position`. Parse every returned row with Task 2 schema and accept only `https:` signed URLs. Upload order is title/file/position validation, UUID path creation, `storage.upload`, then table insert. On failed insert, try one object removal and throw a neutral `DocumentRepositoryError`; retain backend detail only in `cause`.

For delete, retrieve the row by id, delete the row, then remove the one object. If remove fails, log only its path and throw `DocumentCleanupPendingError`. The retry API accepts only `isDocumentPath(path)`. Use no shared abstraction with offer images.

- [ ] **Step 4: Verify green**

Run the Step 2 command again.

Expected: all repository lifecycle tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/documents/repository.ts src/lib/documents/repository.test.ts
git commit -m "feat: add contact document repository"
```

### Task 4: Protected CMS document manager

**Files:**
- Create: `src/components/admin/ContactDocumentManager.tsx`
- Create: `src/components/admin/ContactDocumentManager.test.tsx`
- Create: `src/routes/admin.dokumenty.tsx`
- Create: `src/routes/admin.dokumenty.test.tsx`
- Modify: `src/routes/admin.index.tsx`
- Modify only through generation: `src/routeTree.gen.ts`

**Interfaces:**
- Consumes: Task 3 repository and existing `AdminGuard`, `AdminSignOutButton`, `Button`, `Input`, `Label`, and Radix `AlertDialog`.
- Produces protected route `/admin/dokumenty` and a `Dokumenty` navigation link from offers CMS.

- [ ] **Step 1: Write failing CMS tests**

Mock `@/lib/documents/repository` before importing components. Manager tests must cover load, missing title/file blocking upload, valid upload with next persisted position, form clearing + list refresh, neutral errors, signed document `Otwórz` link, confirmation before `deleteContactDocument(id)`, and cleanup retry without private-path text. Route tests must assert `AdminGuard` wrapping, heading `Dokumenty do pobrania`, and a link back to `/admin`. Extend `admin.index.test.tsx` to require a `Dokumenty` link to `/admin/dokumenty`.

- [ ] **Step 2: Verify red**

Run: `VITE_SUPABASE_URL=https://supabase.example.test VITE_SUPABASE_ANON_KEY=test-anon-key bunx vitest run src/components/admin/ContactDocumentManager.test.tsx src/routes/admin.dokumenty.test.tsx src/routes/admin.index.test.tsx`

Expected: FAIL because route, manager and navigation do not yet exist.

- [ ] **Step 3: Implement minimal accessible CMS UI**

Create a controlled title input and file-input ref. Disable form controls during initial authoritative load or a mutation. Calculate next position as `Math.max(-1, ...documents.map(({ position }) => position)) + 1`. After a successful upload, clear both fields then refresh; if refresh fails after a saved mutation, report that the change was saved but the view needs refresh.

Render an ordered list. Each signed URL uses an `Otwórz` link in a new tab. Delete action has `aria-label={`Usuń dokument: ${document.title}`}` and Radix confirmation. A pending cleanup exposes “Ponów usunięcie pliku”, never `document.path`. Create route with `createFileRoute('/admin/dokumenty')`, noindex metadata, existing guarded panel chrome and links between `Oferty` and `Dokumenty`. Let the Vite/TanStack generator modify the route tree.

- [ ] **Step 4: Verify green and generation**

Run:

```bash
VITE_SUPABASE_URL=https://supabase.example.test VITE_SUPABASE_ANON_KEY=test-anon-key bunx vitest run src/components/admin/ContactDocumentManager.test.tsx src/routes/admin.dokumenty.test.tsx src/routes/admin.index.test.tsx
VITE_SUPABASE_URL=https://supabase.example.test VITE_SUPABASE_ANON_KEY=test-anon-key bun run build:ci
```

Expected: targeted tests pass and generated route tree includes static `/admin/dokumenty` without a manual edit.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/ContactDocumentManager.tsx src/components/admin/ContactDocumentManager.test.tsx src/routes/admin.dokumenty.tsx src/routes/admin.dokumenty.test.tsx src/routes/admin.index.tsx src/routes/admin.index.test.tsx src/routeTree.gen.ts
git commit -m "feat: manage contact documents in cms"
```

### Task 5: Public “Do pobrania” section

**Files:**
- Create: `src/components/public/ContactDocuments.tsx`
- Create: `src/components/public/ContactDocuments.test.tsx`
- Modify: `src/routes/kontakt.tsx`
- Modify: `src/routes/public-pages.test.tsx`

**Interfaces:**
- Consumes `listPublicContactDocuments(): Promise<ContactDocument[]>` from Task 3.
- Produces a resilient public component that leaves existing contact content available when remote data fails.

- [ ] **Step 1: Write failing public UI tests**

Mock the document repository before importing the component. With a QueryClient configured with `retry: false`, assert a returned document renders heading `Do pobrania` and its title link has the signed `href`, `target="_blank"`, and `rel="noreferrer"`. Cover an empty resolved array returning no section, pending query status `Ładowanie dokumentów…`, neutral retryable error, and null signed URL without a link. Extend existing contact route tests to assert the document section appears after the business contact grid.

- [ ] **Step 2: Verify red**

Run: `VITE_SUPABASE_URL=https://supabase.example.test VITE_SUPABASE_ANON_KEY=test-anon-key VITE_SITE_URL=https://vhsboard.pages.dev bunx vitest run src/components/public/ContactDocuments.test.tsx src/routes/public-pages.test.tsx`

Expected: FAIL because component and mounted section do not exist.

- [ ] **Step 3: Implement and mount the public component**

Use `useQuery({ queryKey: ['contact-documents'], queryFn: listPublicContactDocuments })`. Return `null` only for a successful empty result. Use `aria-live="polite"` loading, a semantic section with `h2`, and underlined title links using design-system tokens and visible focus. Error is a Polish `role="alert"` with existing `Button` calling `refetch`; never display the thrown message. Mount it after the existing contact cards in `kontakt.tsx`.

- [ ] **Step 4: Verify green**

Run the Step 2 command again.

Expected: all public state/link tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/public/ContactDocuments.tsx src/components/public/ContactDocuments.test.tsx src/routes/kontakt.tsx src/routes/public-pages.test.tsx
git commit -m "feat: show contact documents publicly"
```

### Task 6: Full verification and handoff

**Files:**
- Modify only if generated: `src/routeTree.gen.ts`

**Interfaces:**
- Consumes all previous interfaces.
- Produces fresh frontend/build/database verification evidence.

- [ ] **Step 1: Run full frontend suite with complete public test environment**

Run:

```bash
VITE_SUPABASE_URL=https://supabase.example.test VITE_SUPABASE_ANON_KEY=test-anon-key VITE_SITE_URL=https://vhsboard.pages.dev VITE_SEO_INDEXING=false VITE_CONTACT_EMAIL=kontakt@example.test VITE_CONTACT_PHONE=+48123456789 VITE_BUSINESS_NAME='Testowa firma' VITE_BUSINESS_STREET='ul. Przykładowa 1' VITE_BUSINESS_POSTAL_CODE=00-001 VITE_BUSINESS_CITY=Warszawa VITE_BUSINESS_NIP=1234567890 VITE_BUSINESS_REGON=123456789 bun run test
```

Expected: all Vitest suites pass without missing-`VITE_*` failures.

- [ ] **Step 2: Run lint and production build**

Use the same environment prefix with `bun run lint` and `bun run build`.

Expected: both commands exit zero; the build generates routes and sitemap.

- [ ] **Step 3: Run full local Supabase verification**

Run: `supabase db reset && supabase db lint --fail-on error && supabase test db supabase/tests`

Expected: migration applies, SQL lint is clean, and every RLS/bucket assertion passes.

- [ ] **Step 4: Inspect exact change set**

Run: `git status --short && git diff origin/main...HEAD --check && git diff origin/main...HEAD --stat`

Expected: only document feature files, migration/tests, route generation and runbook changes are present; no whitespace errors.

- [ ] **Step 5: Commit generated route only if needed and report evidence**

If `src/routeTree.gen.ts` is modified by generation, commit it with `chore: regenerate route tree`; otherwise do not make an empty commit. In handoff, list actual command exit statuses and separately note unavailable local Docker/Supabase services.
