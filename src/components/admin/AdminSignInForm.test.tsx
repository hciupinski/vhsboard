import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockedSession = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  sanitizeAdminNext: vi.fn((next: string | undefined) => next ?? "/admin"),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => mockedSession);

import { AdminSignInForm } from "./AdminSignInForm";

const fillCredentials = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("E-mail"), "admin@example.test");
  await user.type(screen.getByLabelText("Hasło"), "sekret");
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

beforeEach(() => {
  mockedSession.sanitizeAdminNext.mockImplementation(
    (next: string | undefined) => next ?? "/admin",
  );
  mockedSession.signOut.mockResolvedValue(undefined);
});

describe("AdminSignInForm", () => {
  it("labels fields and prevents a second submission while the first is pending", async () => {
    let resolveSignIn: (() => void) | undefined;
    mockedSession.signInWithPassword.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    const user = userEvent.setup();

    render(<AdminSignInForm next="/admin" onSuccess={vi.fn()} />);
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(screen.getByRole("button", { name: "Logowanie…" })).toBeDisabled();
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    expect(screen.getByLabelText("Hasło")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Logowanie…" }));
    expect(mockedSession.signInWithPassword).toHaveBeenCalledTimes(1);

    resolveSignIn?.();
  });

  it("announces a neutral error without exposing the Supabase detail", async () => {
    mockedSession.signInWithPassword.mockRejectedValue(new Error("Invalid login credentials"));
    const user = userEvent.setup();

    render(<AdminSignInForm next="/admin" onSuccess={vi.fn()} />);
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.",
    );
    expect(screen.queryByText("Invalid login credentials")).not.toBeInTheDocument();
  });

  it("explains when a valid account has no administrator role", async () => {
    mockedSession.signInWithPassword.mockResolvedValue(undefined);
    mockedSession.getAdminSession.mockResolvedValue(null);
    const user = userEvent.setup();

    render(<AdminSignInForm next="/admin" onSuccess={vi.fn()} />);
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "To konto nie ma uprawnień administratora.",
    );
    expect(mockedSession.signOut).toHaveBeenCalledTimes(1);
  });

  it("returns a verified administrator to the sanitized internal path", async () => {
    mockedSession.signInWithPassword.mockResolvedValue(undefined);
    mockedSession.getAdminSession.mockResolvedValue({
      userId: "user-1",
      email: "admin@example.test",
      role: "admin",
    });
    mockedSession.sanitizeAdminNext.mockReturnValue("/admin/oferta-testowa");
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<AdminSignInForm next="https://attacker.test" onSuccess={onSuccess} />);
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(onSuccess).toHaveBeenCalledWith("/admin/oferta-testowa");
  });
});
