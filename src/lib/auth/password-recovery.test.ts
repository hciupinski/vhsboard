import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("../supabase", () => ({ supabase: { auth } }));
import {
  getPasswordRecoveryState,
  requestPasswordReset,
  updateRecoveredPassword,
} from "./password-recovery";
const userId = "10000000-0000-4000-8000-000000000001";
const mark = (id = userId, expiresAt = Date.now() + 100000) =>
  sessionStorage.setItem("vhsboard-password-recovery", JSON.stringify({ userId: id, expiresAt }));
beforeEach(() => {
  auth.getSession.mockResolvedValue({ data: { session: { user: { id: userId } } }, error: null });
  auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
  auth.updateUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
  auth.signOut.mockResolvedValue({ error: null });
  auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
});
afterEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});
describe("password recovery API", () => {
  it.each(["http://localhost:3000", "http://127.0.0.1:3000", "https://vhsboard.pages.dev"])(
    "uses an exact same-origin callback for %s",
    async (origin) => {
      await requestPasswordReset(" admin@example.test ", origin);
      expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("admin@example.test", {
        redirectTo: origin + "/admin/reset-password",
      });
    },
  );
  it("rejects unsafe origins before sending any email", async () => {
    await expect(
      requestPasswordReset("admin@example.test", "https://example.test/path"),
    ).rejects.toThrow();
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it("requires a recovery marker and server-verified matching identity", async () => {
    expect(await getPasswordRecoveryState()).toBe("request");
    mark();
    expect(await getPasswordRecoveryState()).toBe("ready");
    auth.getUser.mockResolvedValue({
      data: { user: { id: "10000000-0000-4000-8000-000000000002" } },
      error: null,
    });
    expect(await getPasswordRecoveryState()).toBe("invalid");
  });
  it("handles expired markers and callback errors", async () => {
    mark(userId, Date.now() - 1);
    expect(await getPasswordRecoveryState()).toBe("expired");
    window.history.replaceState({}, "", "/admin/reset-password?error=expired");
    expect(await getPasswordRecoveryState()).toBe("expired");
  });
  it("does not discard a valid marker on a transient verification failure", async () => {
    mark();
    auth.getUser.mockRejectedValue(new Error("network"));
    expect(await getPasswordRecoveryState()).toBe("error");
    expect(sessionStorage.getItem("vhsboard-password-recovery")).not.toBeNull();
  });
  it("preserves password bytes, consumes recovery context and clears the local session", async () => {
    mark();
    expect(await updateRecoveredPassword("  new-password  ")).toEqual({ sessionCleared: true });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "  new-password  " });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(sessionStorage.getItem("vhsboard-password-recovery")).toBeNull();
  });
  it("refuses a password change without verified recovery", async () => {
    await expect(updateRecoveredPassword("new-password")).rejects.toThrow();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("retains recovery when updating fails, but reports success if logout alone fails", async () => {
    mark();
    auth.updateUser.mockResolvedValue({
      error: { code: "weak_password", message: "private details" },
    });
    await expect(updateRecoveredPassword("new-password")).rejects.toThrow("wymagań");
    expect(sessionStorage.getItem("vhsboard-password-recovery")).not.toBeNull();
    auth.updateUser.mockResolvedValue({ error: null });
    auth.signOut.mockRejectedValue(new Error("network"));
    expect(await updateRecoveredPassword("new-password")).toEqual({ sessionCleared: false });
    expect(sessionStorage.getItem("vhsboard-password-recovery")).toBeNull();
  });
});
