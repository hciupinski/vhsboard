import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockedAuth = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  signOut: vi.fn(),
}));
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/session", () => mockedAuth);
vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/admin/oferta-testowa" }),
  useNavigate: () => mockNavigate,
}));

import { AdminGuard, AdminSignOutButton } from "./AdminGuard";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("AdminGuard", () => {
  it("does not render protected children while the role request is unresolved", () => {
    mockedAuth.getAdminSession.mockReturnValue(new Promise(() => undefined));

    render(
      <AdminGuard>
        <p>Dane ofert</p>
      </AdminGuard>,
    );

    expect(screen.getByText("Sprawdzamy dostęp…")).toBeInTheDocument();
    expect(screen.queryByText("Dane ofert")).not.toBeInTheDocument();
  });

  it("redirects an unauthorised visitor only to the local login route", async () => {
    mockedAuth.getAdminSession.mockResolvedValue(null);

    render(
      <AdminGuard>
        <p>Dane ofert</p>
      </AdminGuard>,
    );

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/admin/login",
        search: { next: "/admin/oferta-testowa" },
        replace: true,
      }),
    );
    expect(screen.queryByText("Dane ofert")).not.toBeInTheDocument();
  });
});

describe("AdminSignOutButton", () => {
  it("ends the session and returns to the login route", async () => {
    mockedAuth.signOut.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AdminSignOutButton />);
    await user.click(screen.getByRole("button", { name: "Wyloguj" }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: "/admin/login" }));
  });

  it("keeps error detail out of a failed sign-out message", async () => {
    mockedAuth.signOut.mockRejectedValue(new Error("network unavailable"));
    const user = userEvent.setup();

    render(<AdminSignOutButton />);
    await user.click(screen.getByRole("button", { name: "Wyloguj" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się wylogować. Spróbuj ponownie.",
    );
    expect(screen.queryByText("network unavailable")).not.toBeInTheDocument();
  });
});
