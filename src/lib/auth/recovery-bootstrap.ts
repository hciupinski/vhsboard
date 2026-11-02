import type { SupabaseClient } from "@supabase/supabase-js";

export const recoveryPath = "/admin/reset-password";
export const recoveryContextEvent = "vhsboard:password-recovery";
const markerKey = "vhsboard-password-recovery";
const maxRecoveryAge = 30 * 60 * 1000;
type RecoveryMarker = { userId: string; expiresAt: number };

export const isRetryableAuthFailure = (error: {
  status?: number | undefined;
  name?: string | undefined;
}) =>
  error.name === "AuthRetryableFetchError" ||
  error.status === 0 ||
  error.status === 429 ||
  (error.status !== undefined && error.status >= 500);

export function readRecoveryMarker(): RecoveryMarker | null {
  if (typeof window === "undefined") return null;
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(markerKey) ?? "null");
    if (
      typeof value !== "object" ||
      value === null ||
      !("userId" in value) ||
      !("expiresAt" in value)
    )
      return null;
    if (
      typeof value.userId !== "string" ||
      !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value.userId) ||
      typeof value.expiresAt !== "number" ||
      !Number.isFinite(value.expiresAt)
    )
      return null;
    return { userId: value.userId, expiresAt: value.expiresAt };
  } catch {
    return null;
  }
}
export function clearRecoveryMarker() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(markerKey);
  } catch {
    /* Storage may be unavailable. */
  }
}

// Register immediately after createClient: its initial recovery event can precede
// lazy route loading. Never await another Supabase call inside the callback.
export function installPasswordRecoveryHandler(
  client: SupabaseClient,
  navigate: (path: string) => void = (path) => window.location.replace(path),
) {
  if (typeof window === "undefined") return () => {};
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const redirectError = (expired: boolean) => {
    clearRecoveryMarker();
    const target = `${recoveryPath}?error=${expired ? "expired" : "invalid"}`;
    if (window.location.pathname === recoveryPath) {
      window.history.replaceState(window.history.state, "", target);
      window.dispatchEvent(new Event(recoveryContextEvent));
    } else navigate(target);
  };
  if (hash.has("error") && hash.has("error_code"))
    redirectError(hash.get("error_code") === "otp_expired");
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") clearRecoveryMarker();
    if (event !== "PASSWORD_RECOVERY" || !session?.user?.id) return;
    const expiresAt = Math.min(
      session.expires_at ? session.expires_at * 1000 : Date.now() + maxRecoveryAge,
      Date.now() + maxRecoveryAge,
    );
    try {
      window.sessionStorage.setItem(
        markerKey,
        JSON.stringify({ userId: session.user.id, expiresAt }),
      );
    } catch {
      redirectError(false);
      return;
    }
    window.dispatchEvent(new Event(recoveryContextEvent));
    if (window.location.pathname !== recoveryPath)
      window.setTimeout(() => navigate(recoveryPath), 0);
  });
  if (hash.get("type") === "recovery") {
    void client.auth
      .initialize()
      .then(({ error }) => {
        if (!error) return;
        if (isRetryableAuthFailure(error)) {
          // The SDK has not saved the session yet. Keep the original fragment
          // for a page reload; never copy these credentials to storage or query.
          if (window.location.pathname !== recoveryPath)
            navigate(recoveryPath + window.location.hash);
          else window.dispatchEvent(new Event(recoveryContextEvent));
        } else redirectError(error.code === "otp_expired");
      })
      .catch(() => redirectError(false));
  }
  return () => subscription.unsubscribe();
}
