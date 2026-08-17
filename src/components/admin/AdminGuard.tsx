import { type ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { getAdminSession, signOut } from "@/lib/auth/session";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isActive = true;

    void getAdminSession().then((session) => {
      if (!isActive) {
        return;
      }

      if (session) {
        setIsChecking(false);
        return;
      }

      void navigate({
        to: "/admin/login",
        search: { next: location.pathname },
        replace: true,
      });
    });

    return () => {
      isActive = false;
    };
  }, [location.pathname, navigate]);

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
