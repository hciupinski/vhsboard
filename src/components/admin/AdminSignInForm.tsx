import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/admin/form-controls";
import { Label } from "@/components/ui/label";
import {
  type AdminPath,
  getAdminSession,
  sanitizeAdminNext,
  signInWithPassword,
  signOut,
} from "@/lib/auth/session";

type AdminSignInFormProps = {
  next?: string;
  onSuccess: (next: AdminPath) => void;
};

export function AdminSignInForm({ next, onSuccess }: AdminSignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKind, setErrorKind] = useState<"credentials" | "role" | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    // Autofill may change input values without firing React's onChange.
    // Read before disabling the fields, since disabled inputs leave FormData.
    const credentials = new FormData(event.currentTarget);
    const submittedEmail = String(credentials.get("email") ?? "");
    const submittedPassword = String(credentials.get("password") ?? "");
    setEmail(submittedEmail);
    setPassword(submittedPassword);
    setIsSubmitting(true);
    setErrorKind(null);

    try {
      await signInWithPassword(submittedEmail, submittedPassword);

      if (!(await getAdminSession())) {
        await signOut().catch(() => undefined);
        setErrorKind("role");
        return;
      }

      onSuccess(sanitizeAdminNext(next));
    } catch {
      await signOut().catch(() => undefined);
      setErrorKind("credentials");
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
          name="email"
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
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          disabled={isSubmitting}
          required
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <a
        href="/admin/reset-password"
        className="inline-block text-sm font-semibold underline underline-offset-4 hover:text-interaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Nie pamiętasz hasła?
      </a>
      {errorKind ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm"
        >
          {errorKind === "role"
            ? "To konto nie ma uprawnień administratora."
            : "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie."}
        </p>
      ) : null}
      <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
        {isSubmitting ? "Logowanie…" : "Zaloguj się"}
      </Button>
    </form>
  );
}
