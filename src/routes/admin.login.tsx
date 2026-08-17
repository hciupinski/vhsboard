import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { AdminSignInForm } from "@/components/admin/AdminSignInForm";
import { Brand } from "@/components/Brand";
import type { AdminPath } from "@/lib/auth/session";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  head: () => ({
    meta: [{ title: "Logowanie do panelu — VHSBOARD" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();

  const navigateToAdmin = (path: AdminPath) => {
    if (path === "/admin") {
      void navigate({ to: "/admin" });
      return;
    }

    void navigate({
      to: "/admin/$slug",
      params: { slug: path.slice("/admin/".length) },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-border/70 bg-background p-6 shadow-warm sm:p-8">
        <Link to="/" className="inline-flex text-foreground">
          <Brand />
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Panel administratora
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-wide">Zaloguj się</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dostęp mają wyłącznie ręcznie zatwierdzeni administratorzy VHSBOARD.
        </p>
        <div className="mt-7">
          <AdminSignInForm next={next} onSuccess={navigateToAdmin} />
        </div>
      </section>
    </main>
  );
}
