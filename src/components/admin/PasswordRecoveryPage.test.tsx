import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({
  getPasswordRecoveryState: vi.fn(),
  requestPasswordReset: vi.fn(),
  updateRecoveredPassword: vi.fn(),
}));
vi.mock("@/lib/auth/password-recovery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/password-recovery")>()),
  ...api,
}));
import { PasswordRecoveryPage } from "./PasswordRecoveryPage";
import { recoveryContextEvent } from "@/lib/auth/recovery-bootstrap";
beforeEach(() => {
  api.getPasswordRecoveryState.mockResolvedValue("request");
  api.requestPasswordReset.mockResolvedValue(undefined);
  api.updateRecoveredPassword.mockResolvedValue({ sessionCleared: true });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
describe("password recovery page", () => {
  it("sends autofilled email and shows a neutral confirmation", async () => {
    render(<PasswordRecoveryPage />);
    const input = await screen.findByLabelText("E-mail");
    (input as HTMLInputElement).value = "admin@example.test";
    await userEvent.click(screen.getByRole("button", { name: "Wyślij link" }));
    expect(api.requestPasswordReset).toHaveBeenCalledWith(
      "admin@example.test",
      window.location.origin,
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Jeśli dla tego adresu istnieje konto",
    );
  });
  it("lets an expired link request a new message", async () => {
    api.getPasswordRecoveryState.mockResolvedValue("expired");
    render(<PasswordRecoveryPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Link wygasł");
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nowe hasło")).not.toBeInTheDocument();
  });
  it("offers page reload when the initial callback could not be verified", async () => {
    api.getPasswordRecoveryState.mockResolvedValue("callback-error");
    render(<PasswordRecoveryPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("odśwież stronę");
    expect(screen.getByRole("button", { name: "Odśwież i ponów" })).toBeInTheDocument();
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
  });
  it("does not update for mismatching passwords", async () => {
    api.getPasswordRecoveryState.mockResolvedValue("ready");
    render(<PasswordRecoveryPage />);
    await screen.findByLabelText("Nowe hasło");
    fireEvent.change(screen.getByLabelText("Nowe hasło"), { target: { value: "new-password" } });
    fireEvent.change(screen.getByLabelText("Powtórz nowe hasło"), {
      target: { value: "different-password" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Zapisz nowe hasło" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Hasła muszą być takie same");
    expect(api.updateRecoveredPassword).not.toHaveBeenCalled();
  });
  it("uses autofilled new passwords and shows success even when logout alone fails", async () => {
    api.getPasswordRecoveryState.mockResolvedValue("ready");
    api.updateRecoveredPassword.mockResolvedValue({ sessionCleared: false });
    render(<PasswordRecoveryPage />);
    await screen.findByLabelText("Nowe hasło");
    (screen.getByLabelText("Nowe hasło") as HTMLInputElement).value = "  saved-password  ";
    (screen.getByLabelText("Powtórz nowe hasło") as HTMLInputElement).value = "  saved-password  ";
    await userEvent.click(screen.getByRole("button", { name: "Zapisz nowe hasło" }));
    expect(api.updateRecoveredPassword).toHaveBeenCalledWith("  saved-password  ");
    expect(await screen.findByRole("heading", { name: "Hasło zmienione" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("wylogować");
  });
  it("responds to recovery events arriving after initial SDK initialization", async () => {
    render(<PasswordRecoveryPage />);
    await screen.findByLabelText("E-mail");
    api.getPasswordRecoveryState.mockResolvedValue("ready");
    fireEvent(window, new Event(recoveryContextEvent));
    expect(await screen.findByLabelText("Nowe hasło")).toBeInTheDocument();
  });
  it("keeps a failed password change available for retry", async () => {
    api.getPasswordRecoveryState.mockResolvedValue("ready");
    api.updateRecoveredPassword.mockRejectedValue(new Error("network details"));
    render(<PasswordRecoveryPage />);
    await screen.findByLabelText("Nowe hasło");
    fireEvent.change(screen.getByLabelText("Nowe hasło"), { target: { value: "new-password" } });
    fireEvent.change(screen.getByLabelText("Powtórz nowe hasło"), {
      target: { value: "new-password" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Zapisz nowe hasło" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się zmienić hasła");
    expect(screen.getByLabelText("Nowe hasło")).toHaveValue("new-password");
  });
});
