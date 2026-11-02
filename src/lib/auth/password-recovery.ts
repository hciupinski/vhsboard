import { clearRecoveryMarker, readRecoveryMarker, recoveryPath } from "./recovery-bootstrap";

const getClient = async () => (await import("../supabase")).supabase;
export type PasswordRecoveryState = "request" | "ready" | "expired" | "invalid" | "error";
export class PasswordRecoveryError extends Error {
  constructor(
    message: string,
    readonly expired = false,
  ) {
    super(message);
    this.name = "PasswordRecoveryError";
  }
}
export async function requestPasswordReset(email: string, origin: string): Promise<void> {
  const url = new URL(origin);
  if (
    url.origin !== origin ||
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
  )
    throw new PasswordRecoveryError("Nieprawidłowy adres strony.");
  const client = await getClient();
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: new URL(recoveryPath, url.origin).href,
  });
  if (error)
    throw new PasswordRecoveryError(
      error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit"
        ? "Za dużo prób. Odczekaj chwilę i spróbuj ponownie."
        : "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
    );
}
export async function getPasswordRecoveryState(): Promise<PasswordRecoveryState> {
  const client = await getClient();
  if (typeof window === "undefined") return "request";
  const error = new URLSearchParams(window.location.search).get("error");
  if (error === "expired" || error === "invalid") return error;
  try {
    // Wait for the SDK to process an initial hash. A late PASSWORD_RECOVERY
    // event also refreshes the mounted page through recoveryContextEvent.
    const { data, error: sessionError } = await client.auth.getSession();
    const marker = readRecoveryMarker();
    if (!marker) return "request";
    if (marker.expiresAt <= Date.now()) {
      clearRecoveryMarker();
      return "expired";
    }
    if (sessionError || !data.session) {
      clearRecoveryMarker();
      return "invalid";
    }
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) {
      if (userError.status && userError.status >= 500) return "error";
      clearRecoveryMarker();
      return "invalid";
    }
    if (!userData.user || userData.user.id !== marker.userId) {
      clearRecoveryMarker();
      return "invalid";
    }
    return "ready";
  } catch {
    return "error";
  }
}
export async function updateRecoveredPassword(
  password: string,
): Promise<{ sessionCleared: boolean }> {
  if (password.length < 8) throw new PasswordRecoveryError("Hasło musi mieć co najmniej 8 znaków.");
  const state = await getPasswordRecoveryState();
  if (state !== "ready")
    throw new PasswordRecoveryError(
      state === "error"
        ? "Nie udało się potwierdzić sesji. Spróbuj ponownie."
        : "Link jest nieprawidłowy lub wygasł. Poproś o nowy.",
      state !== "error",
    );
  const client = await getClient();
  const { error } = await client.auth.updateUser({ password });
  if (error)
    throw new PasswordRecoveryError(
      error.code === "weak_password"
        ? "Hasło nie spełnia wymagań bezpieczeństwa. Wybierz dłuższe i trudniejsze hasło."
        : error.code === "same_password"
          ? "Nowe hasło musi różnić się od dotychczasowego."
          : "Nie udało się zmienić hasła. Spróbuj ponownie.",
    );
  clearRecoveryMarker();
  try {
    const { error: logoutError } = await client.auth.signOut({ scope: "global" });
    return { sessionCleared: !logoutError };
  } catch {
    return { sessionCleared: false };
  }
}
