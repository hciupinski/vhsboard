import { type ReactNode, useEffect, useState } from "react";
import { useMatch, useNavigate, useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { getAdminSession, signOut } from "@/lib/auth/session";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const pathname = useMatch({
    strict: false,
    shouldThrow: false,
    select: (match) => match.pathname,
  });
  const navigate = useNavigate();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!pathname) return;
    let isActive = true;

    void getAdminSession().then((session) => {
      if (
        !isActive ||
        router.state.location.pathname.replace(/\/$/, "") !== pathname.replace(/\/$/, "")
      ) {
        return;
      }

      if (session) {
        setIsChecking(false);
        return;
      }

      void navigate({
        to: "/admin/login",
        search: { next: pathname.replace(/\/$/, "") },
        replace: true,
      });
    });

    return () => {
      isActive = false;
    };
  }, [pathname, navigate, router]);

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-5">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Sprawdzamy dostęp…
        </p>
      </main>
    );
  }

  return <>{children}</>;
}

export function AdminSignOutButton() {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setHasError(false);

    try {
      await signOut();
      void navigate({ to: "/admin/login" });
    } catch {
      setHasError(true);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {hasError ? (
        <p role="alert" className="text-xs text-destructive">
          Nie udało się wylogować. Spróbuj ponownie.
        </p>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full"
        disabled={isSigningOut}
        onClick={() => void handleSignOut()}
      >
        {isSigningOut ? "Wylogowywanie…" : "Wyloguj"}
      </Button>
    </div>
  );
}
