import { useEffect, useRef, useState, type FormEvent } from "react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPasswordRecoveryState,
  PasswordRecoveryError,
  requestPasswordReset,
  updateRecoveredPassword,
  type PasswordRecoveryState,
} from "@/lib/auth/password-recovery";
import { recoveryContextEvent } from "@/lib/auth/recovery-bootstrap";

export function PasswordRecoveryPage() {
  const [state, setState] = useState<PasswordRecoveryState | "checking" | "success">("checking");
  const [logoutWarning, setLogoutWarning] = useState(false);
  const [checkVersion, setCheckVersion] = useState(0);
  useEffect(() => {
    let active = true,
      revision = 0;
    const refresh = () => {
      const current = ++revision;
      setState("checking");
      void getPasswordRecoveryState()
        .then((result) => {
          if (active && current === revision) setState(result);
        })
        .catch(() => {
          if (active && current === revision) setState("error");
        });
    };
    window.addEventListener(recoveryContextEvent, refresh);
    refresh();
    return () => {
      active = false;
      window.removeEventListener(recoveryContextEvent, refresh);
    };
  }, [checkVersion]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-border/70 bg-background p-6 shadow-warm sm:p-8">
        <a href="/" className="inline-flex text-foreground">
          <Brand />
        </a>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Panel administratora
        </p>
        <h1 className="mt-2 font-display text-4xl">
          {state === "ready"
            ? "Ustaw nowe hasło"
            : state === "success"
              ? "Hasło zmienione"
              : "Odzyskaj dostęp"}
        </h1>
        {state === "checking" ? (
          <p role="status" className="mt-5 text-sm text-muted-foreground">
            Sprawdzamy link…
          </p>
        ) : state === "error" ? (
          <div className="mt-5 space-y-4">
            <p role="alert" className="text-sm text-destructive">
              Nie udało się potwierdzić sesji. Sprawdź połączenie i spróbuj ponownie.
            </p>
            <Button onClick={() => setCheckVersion((v) => v + 1)}>Spróbuj ponownie</Button>
          </div>
        ) : state === "success" ? (
          <div className="mt-5 space-y-4">
            <p role="status" className="text-sm text-muted-foreground">
              Twoje hasło zostało zmienione. Zaloguj się nowym hasłem.
            </p>
            {logoutWarning ? (
              <p role="alert" className="text-sm text-destructive">
                Hasło zapisano, ale nie udało się wylogować. Zamknij tę kartę przed ponownym
                logowaniem.
              </p>
            ) : null}
          </div>
        ) : state === "ready" ? (
          <UpdatePasswordForm
            onSuccess={(sessionCleared) => {
              setLogoutWarning(!sessionCleared);
              setState("success");
            }}
            onExpired={() => setState("expired")}
          />
        ) : (
          <div className="mt-5 space-y-5">
            {state === "expired" || state === "invalid" ? (
              <p
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm"
              >
                {state === "expired"
                  ? "Link wygasł lub został już wykorzystany. Wyślij nowy link poniżej."
                  : "Link jest nieprawidłowy. Wyślij nowy link poniżej."}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Podaj adres e-mail swojego konta. Wyślemy link do ustawienia nowego hasła.
              </p>
            )}
            <ResetRequestForm />
          </div>
        )}
        <a
          href="/admin/login?next=%2Fadmin"
          className="mt-6 inline-block text-sm font-semibold underline underline-offset-4 hover:text-interaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Wróć do logowania
        </a>
      </section>
    </main>
  );
}
function ResetRequestForm() {
  const [pending, setPending] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await requestPasswordReset(email, window.location.origin);
      setSent(true);
    } catch (error) {
      setError(
        error instanceof PasswordRecoveryError
          ? error.message
          : "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };
  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recovery-email">E-mail</Label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
        />
      </div>
      {sent ? (
        <p role="status" className="text-sm text-muted-foreground">
          Jeśli dla tego adresu istnieje konto, otrzymasz wiadomość z linkiem. Sprawdź pocztę i
          folder spam. Użyj najnowszej wiadomości.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full rounded-full">
        {pending ? "Wysyłanie…" : sent ? "Wyślij ponownie" : "Wyślij link"}
      </Button>
    </form>
  );
}
function UpdatePasswordForm({
  onSuccess,
  onExpired,
}: {
  onSuccess: (sessionCleared: boolean) => void;
  onExpired: () => void;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    const data = new FormData(event.currentTarget),
      password = String(data.get("password") ?? ""),
      confirm = String(data.get("confirm") ?? "");
    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }
    if (password !== confirm) {
      setError("Hasła muszą być takie same.");
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const { sessionCleared } = await updateRecoveredPassword(password);
      onSuccess(sessionCleared);
    } catch (error) {
      if (error instanceof PasswordRecoveryError && error.expired) {
        onExpired();
        return;
      }
      setError(
        error instanceof PasswordRecoveryError
          ? error.message
          : "Nie udało się zmienić hasła. Spróbuj ponownie.",
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };
  return (
    <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
      <p className="text-sm text-muted-foreground">
        Użyj co najmniej 8 znaków. Wybierz hasło, którego nie używasz w innych serwisach.
      </p>
      <div className="space-y-2">
        <Label htmlFor="recovery-password">Nowe hasło</Label>
        <Input
          id="recovery-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="recovery-confirm">Powtórz nowe hasło</Label>
        <Input
          id="recovery-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full rounded-full">
        {pending ? "Zapisywanie…" : "Zapisz nowe hasło"}
      </Button>
    </form>
  );
}
