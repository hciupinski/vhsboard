# Admin Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require a Supabase-authenticated user with `profiles.role = 'admin'` before the existing administrator UI can render.

**Architecture:** A session module wraps Supabase Auth and the owner-only profile lookup. A dedicated login route uses an accessible form and a validated local return path; `AdminGuard` prevents protected route content and prototype data effects until the role has been confirmed. RLS from Task 010 remains the sole enforcement of CMS mutations.

**Tech Stack:** React 19, TypeScript, TanStack Router, Supabase JS v2, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Do not add registration, password reset, OAuth, account management, bookings, payments, availability, participant data, or customer accounts.
- Use only the existing public Supabase URL and anon key. Do not use a service-role key, environment role flag, or `localStorage` admin flag.
- Only exact `profiles.role = 'admin'` returns an `AdminSession`; all other roles, missing profile/session, and read errors deny access.
- The UI uses only `Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.` for a login failure and never logs or renders passwords, tokens, or Supabase error details.
- Accept only `/admin` or `/admin/<slug>` as a return location. Reject absolute and protocol-relative URLs, public paths, query strings, fragments, and invalid percent encoding.
- Do not render children or run their data effects before `AdminGuard` confirms the role. Retain `robots=noindex` on every admin route.
- Keep `adminStore` only as the temporary visual prototype described by Task 050.

---

## File Structure

- Create: `src/lib/auth/session.ts` and `src/lib/auth/session.test.ts` — session API, return-path sanitizer, and unit tests.
- Create: `src/components/admin/AdminGuard.tsx` and `AdminGuard.test.tsx` — verified role gate plus loading/redirect tests.
- Create: `src/components/admin/AdminSignInForm.tsx` and `AdminSignInForm.test.tsx` — accessible login interface and component tests.
- Create: `src/routes/admin.login.tsx` — the noindex login route.
- Modify: `src/routes/admin.index.tsx`, `src/routes/admin.$slug.tsx` — wrap the prototype routes and add logout controls.
- Modify: `src/routes/__root.tsx` — avoid logging full client error objects while retaining the existing Polish document shell.

### Task 1: Session boundary and return-path safety

**Files:**

- Create: `src/lib/auth/session.test.ts`
- Create: `src/lib/auth/session.ts`

**Interfaces:**

- Consumes: `supabase.auth.getSession`, `supabase.auth.signInWithPassword`, `supabase.auth.signOut`, and `profiles` access protected by existing RLS.
- Produces: `AdminSession`, `getAdminSession`, `signInWithPassword`, `signOut`, and `sanitizeAdminNext`.

- [ ] **Step 1: Write the failing session and sanitizer tests**

```tsx
it.each([undefined, "editor", "owner"])("denies a non-admin role: %s", async (role) => {
  stubSession({ user: { id: "user-1", email: "admin@example.test" } });
  stubProfile({ data: role === undefined ? null : { role }, error: null });
  await expect(getAdminSession()).resolves.toBeNull();
});

it("returns the exact minimal contract for admin", async () => {
  stubSession({ user: { id: "user-1", email: "admin@example.test" } });
  stubProfile({ data: { role: "admin" }, error: null });
  await expect(getAdminSession()).resolves.toEqual({
    userId: "user-1", email: "admin@example.test", role: "admin",
  });
});

it.each(["/admin", "/admin/oferta-testowa"])("keeps a local path: %s", (next) => {
  expect(sanitizeAdminNext(next)).toBe(next);
});

it.each(["https://host.test", "//host.test", "/oferty", "%E0%A4%A"])("falls back safely: %s", (next) => {
  expect(sanitizeAdminNext(next)).toBe("/admin");
});
```

- [ ] **Step 2: Run the focused test and observe the missing-module failure**

Run: `bun run test src/lib/auth/session.test.ts`

Expected: FAIL because the session module does not exist.

- [ ] **Step 3: Implement the minimum session API**

```ts
export type AdminSession = { userId: string; email: string; role: "admin" };

export const getAdminSession = async (): Promise<AdminSession | null> => {
  const { data, error } = await supabase.auth.getSession();
  const user = error ? null : data.session?.user;
  if (!user?.email) return null;
  const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile.error || profile.data?.role !== "admin"
    ? null
    : { userId: user.id, email: user.email, role: "admin" };
};
```

Implement `signInWithPassword` and `signOut` as thin calls that throw only on Auth errors. Implement `sanitizeAdminNext` with `decodeURIComponent`, `new URL(value, "https://vhsboard.local")`, an origin comparison, and `^/admin(?:/[^/?#]+)?$`; every failed check returns `/admin`.

- [ ] **Step 4: Re-run the focused test to prove the behavior is green**

Run: `bun run test src/lib/auth/session.test.ts`

Expected: PASS; all denial cases return `null`, only `admin` returns the declared contract, and unsafe return values become `/admin`.

- [ ] **Step 5: Commit**

Run: `git add src/lib/auth/session.ts src/lib/auth/session.test.ts && git commit -m "feat: add admin session checks"`

### Task 2: Accessible login route

**Files:**

- Create: `src/components/admin/AdminSignInForm.test.tsx`
- Create: `src/components/admin/AdminSignInForm.tsx`
- Create: `src/routes/admin.login.tsx`

**Interfaces:**

- Consumes: `signInWithPassword(email, password)`, `getAdminSession()`, `signOut()`, and `sanitizeAdminNext(next)`.
- Produces: `AdminSignInForm({ next: string | undefined })` and `/admin/login`.

- [ ] **Step 1: Write the failing form tests**

```tsx
it("labels the fields and blocks duplicate submit while pending", async () => {
  vi.mocked(signInWithPassword).mockReturnValue(deferred<void>().promise);
  const user = userEvent.setup();
  render(<AdminSignInForm next="/admin" />);
  await user.type(screen.getByLabelText("E-mail"), "admin@example.test");
  await user.type(screen.getByLabelText("Hasło"), "sekret");
  await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
  expect(screen.getByRole("button", { name: "Logowanie…" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Logowanie…" }));
  expect(signInWithPassword).toHaveBeenCalledTimes(1);
});

it("shows a neutral alert instead of a provider error", async () => {
  vi.mocked(signInWithPassword).mockRejectedValue(new Error("Invalid login credentials"));
  render(<AdminSignInForm next="/admin" />);
  await userEvent.setup().click(screen.getByRole("button", { name: "Zaloguj się" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Nie udało się zalogować");
  expect(screen.queryByText("Invalid login credentials")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and observe the missing-component failure**

Run: `bun run test src/components/admin/AdminSignInForm.test.tsx`

Expected: FAIL because the form component does not exist.

- [ ] **Step 3: Implement form behavior and the noindex login route**

```tsx
const submit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (isSubmitting) return;
  setIsSubmitting(true);
  try {
    await signInWithPassword(email, password);
    if (!(await getAdminSession())) throw new Error("not-admin");
    navigate({ to: sanitizeAdminNext(next) });
  } catch {
    await signOut().catch(() => undefined);
    setError(true);
  } finally {
    setIsSubmitting(false);
  }
};
```

Use `Label htmlFor`, matching `Input` elements, `autoComplete="email"` and `current-password`, disabled fields while pending, and the prescribed `role="alert"`. The route accepts only a string `next` search value and sets `robots=noindex`.

- [ ] **Step 4: Re-run the focused test to prove the form is green**

Run: `bun run test src/components/admin/AdminSignInForm.test.tsx`

Expected: PASS; the form remains labelled, submits once, and does not disclose the provider error.

- [ ] **Step 5: Commit**

Run: `git add src/components/admin/AdminSignInForm.tsx src/components/admin/AdminSignInForm.test.tsx src/routes/admin.login.tsx && git commit -m "feat: add admin login form"`

### Task 3: Protected routes and logout

**Files:**

- Create: `src/components/admin/AdminGuard.test.tsx`
- Create: `src/components/admin/AdminGuard.tsx`
- Modify: `src/routes/admin.index.tsx`
- Modify: `src/routes/admin.$slug.tsx`
- Modify: `src/routes/__root.tsx`

**Interfaces:**

- Consumes: `getAdminSession`, `signOut`, the generated login route, and existing admin prototype route components.
- Produces: `AdminGuard({ children })` plus a visible `Wyloguj` action in both protected headers.

- [ ] **Step 1: Write failing guard tests**

```tsx
it("does not render children while the role request is unresolved", () => {
  vi.mocked(getAdminSession).mockReturnValue(new Promise(() => undefined));
  render(<AdminGuard><p>Dane ofert</p></AdminGuard>);
  expect(screen.getByText("Sprawdzamy dostęp…")).toBeInTheDocument();
  expect(screen.queryByText("Dane ofert")).not.toBeInTheDocument();
});

it("sends an unauthorised visitor to local login", async () => {
  vi.mocked(getAdminSession).mockResolvedValue(null);
  render(<AdminGuard><p>Dane ofert</p></AdminGuard>);
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({
    to: "/admin/login", search: { next: "/admin/oferta-testowa" }, replace: true,
  }));
  expect(screen.queryByText("Dane ofert")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and observe the missing-guard failure**

Run: `bun run test src/components/admin/AdminGuard.test.tsx`

Expected: FAIL because `AdminGuard` does not exist.

- [ ] **Step 3: Implement the guard and defer existing route effects**

```tsx
useEffect(() => {
  let active = true;
  void getAdminSession().then((session) => {
    if (!active) return;
    if (session) setSession(session);
    else void navigate({ to: "/admin/login", search: { next: location.pathname }, replace: true });
  });
  return () => { active = false; };
}, [location.pathname, navigate]);

if (session === undefined) return <p>Sprawdzamy dostęp…</p>;
return <>{children}</>;
```

Move the existing `loadOffers` effects inside protected-inner components. Add a visible logout button that awaits `signOut()` then navigates to `/admin/login`; on failure it shows a neutral local error and keeps the user on the page. In `__root.tsx`, remove the client-side `console.error(error)` from the error boundary so a full Auth error object cannot reach browser logs; preserve the root-shell elements, `lang="pl"`, `HeadContent`, `Scripts`, and `<Outlet />`.

- [ ] **Step 4: Re-run all focused authentication tests**

Run: `bun run test src/components/admin/AdminGuard.test.tsx src/components/admin/AdminSignInForm.test.tsx src/lib/auth/session.test.ts`

Expected: PASS; children remain hidden until confirmation and redirection never targets an external path.

- [ ] **Step 5: Commit**

Run: `git add src/components/admin/AdminGuard.tsx src/components/admin/AdminGuard.test.tsx src/routes/admin.index.tsx src/routes/admin.$slug.tsx src/routes/__root.tsx && git commit -m "feat: protect admin routes"`

### Task 4: Generated route and acceptance verification

**Files:**

- Verify: `src/routeTree.gen.ts` and every file above.

**Interfaces:**

- Consumes: file-based routing and the verified session/guard interfaces.
- Produces: a type-safe login route and evidence for every acceptance criterion.

- [ ] **Step 1: Generate the route tree through the ordinary build**

Run: `bun run build`

Expected: the generated tree contains `/admin/login`; it is never edited by hand.

- [ ] **Step 2: Run complete verification**

Run: `bun run test && bun run lint && bun run build && git diff --check`

Expected: all commands exit 0 with no test, lint, type, build, or whitespace failures.

- [ ] **Step 3: Check acceptance criteria before the final commit**

Verify that unauthorised states render neither list nor editor UI, the session lookup rereads the profile on each call, every admin route is `noindex`, the sanitizer reaches every navigation that uses `next`, and no local role signal exists.

- [ ] **Step 4: Commit implementation and plan**

Run: `git add -f docs/superpowers/plans/2026-08-17-admin-authentication.md && git add src/lib/auth src/components/admin src/routes/admin.index.tsx src/routes/admin.$slug.tsx src/routes/admin.login.tsx src/routes/__root.tsx src/routeTree.gen.ts && git commit -m "feat: secure administrator access"`

## Plan Self-Review

- Task 1 covers every session outcome and all required unsafe `next` variants.
- Task 2 covers the labels, pending lock, neutral alert, and secure login return.
- Task 3 covers delayed child rendering, denied navigation, existing data-effect deferral, and logout.
- Task 4 verifies generated routing, task acceptance criteria, and the complete test, lint, build, and whitespace gates.
- The shared function and type names are defined in Task 1 and used consistently in Tasks 2–3.
