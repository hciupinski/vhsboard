import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient, Session, AuthChangeEvent } from "@supabase/supabase-js";
import {
  installPasswordRecoveryHandler,
  readRecoveryMarker,
  clearRecoveryMarker,
  recoveryPath,
} from "./recovery-bootstrap";
afterEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const userId = "10000000-0000-4000-8000-000000000001";
function client() {
  let callback: (event: AuthChangeEvent, session: Session | null) => void = () => {};
  const unsubscribe = vi.fn();
  const value = {
    auth: {
      onAuthStateChange: vi.fn((fn) => {
        callback = fn;
        return { data: { subscription: { unsubscribe } } };
      }),
    },
  };
  return {
    value: value as unknown as SupabaseClient,
    emit: (event: AuthChangeEvent, session: Session | null) => callback(event, session),
    unsubscribe,
  };
}
describe("password recovery bootstrap", () => {
  it("records only identity/expiry before redirecting a root recovery link", () => {
    vi.useFakeTimers();
    const c = client(),
      navigate = vi.fn();
    installPasswordRecoveryHandler(c.value, navigate);
    c.emit("PASSWORD_RECOVERY", {
      user: { id: userId },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      access_token: "secret-access",
      refresh_token: "secret-refresh",
    } as Session);
    expect(readRecoveryMarker()).toEqual({ userId, expiresAt: Date.now() + 30 * 60 * 1000 });
    expect(sessionStorage.getItem("vhsboard-password-recovery")).not.toContain("secret");
    vi.runAllTimers();
    expect(navigate).toHaveBeenCalledWith(recoveryPath);
  });
  it("keeps the callback route in place and clears recovery on sign out", () => {
    window.history.replaceState({}, "", recoveryPath);
    const c = client(),
      navigate = vi.fn();
    installPasswordRecoveryHandler(c.value, navigate);
    c.emit("PASSWORD_RECOVERY", {
      user: { id: userId },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    } as Session);
    expect(readRecoveryMarker()).not.toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    c.emit("SIGNED_OUT", null);
    expect(readRecoveryMarker()).toBeNull();
  });
  it("normalizes root Auth errors without copying descriptions or tokens", () => {
    window.history.replaceState(
      {},
      "",
      "/#error=access_denied&error_code=otp_expired&error_description=private-details&access_token=secret",
    );
    const c = client(),
      navigate = vi.fn();
    installPasswordRecoveryHandler(c.value, navigate);
    expect(navigate).toHaveBeenCalledWith(recoveryPath + "?error=expired");
  });
  it("ignores normal sign-in and malformed stored markers", () => {
    const c = client(),
      navigate = vi.fn();
    installPasswordRecoveryHandler(c.value, navigate);
    c.emit("SIGNED_IN", { user: { id: userId } } as Session);
    expect(readRecoveryMarker()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    sessionStorage.setItem(
      "vhsboard-password-recovery",
      '{"userId":"invalid","expiresAt":"tomorrow"}',
    );
    expect(readRecoveryMarker()).toBeNull();
    clearRecoveryMarker();
  });
  it.each(["/", recoveryPath])(
    "retains the original callback after a temporary initialization failure on %s",
    async (path) => {
      const fragment = "#type=recovery&access_token=test-access&refresh_token=test-refresh";
      window.history.replaceState({}, "", path + fragment);
      const c = client(),
        navigate = vi.fn();
      c.value.auth.initialize = vi.fn().mockResolvedValue({
        error: { name: "AuthRetryableFetchError", status: 503 },
      });
      installPasswordRecoveryHandler(c.value, navigate);
      await Promise.resolve();
      expect(window.location.hash).toBe(fragment);
      if (path === recoveryPath) expect(navigate).not.toHaveBeenCalled();
      else expect(navigate).toHaveBeenCalledWith(recoveryPath + fragment);
      expect(window.location.search).toBe("");
    },
  );
});
