import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAdminSession,
  sanitizeAdminNext,
  signInWithPassword,
  signOut,
} from "@/lib/auth/session";

type AdminSignInFormProps = {
  next?: string;
  onSuccess: (next: string) => void;
};

export function AdminSignInForm({ next, onSuccess }: AdminSignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setHasError(false);

    try {
      await signInWithPassword(email, password);

      if (!(await getAdminSession())) {
        throw new Error("Administrator role required");
      }

      onSuccess(sanitizeAdminNext(next));
    } catch {
      await signOut().catch(() => undefined);
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="admin-email">E-mail</Label>
        <Input
          id="admin-email"
          type="email"
          autoComplete="email"
          value={email}
          disabled={isSubmitting}
          required
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">Hasło</Label>
        <Input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          disabled={isSubmitting}
          required
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {hasError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm"
        >
          Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.
        </p>
      ) : null}
      <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
        {isSubmitting ? "Logowanie…" : "Zaloguj się"}
      </Button>
    </form>
  );
}
