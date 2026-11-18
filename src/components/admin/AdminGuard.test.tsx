import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockedAuth = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  signOut: vi.fn(),
}));
const mockNavigate = vi.hoisted(() => vi.fn());
const route = vi.hoisted(() => ({
  pathname: "/admin/oferta-testowa" as string | undefined,
  current: "/admin/oferta-testowa",
}));

const mockRouter = vi.hoisted(() => ({
  state: {
    location: {
      get pathname() {
        return route.current;
      },
    },
  },
}));

vi.mock("@/lib/auth/session", () => mockedAuth);
vi.mock("@tanstack/react-router", () => ({
  useMatch: () => route.pathname,
  useRouter: () => mockRouter,
  useNavigate: () => mockNavigate,
}));

import { AdminGuard, AdminSignOutButton } from "./AdminGuard";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  route.pathname = "/admin/oferta-testowa";
  route.current = "/admin/oferta-testowa";
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

  it("ignores a stale authorization result after the protected route changes", async () => {
    let resolveFirst!: (value: null) => void;
    mockedAuth.getAdminSession.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    mockedAuth.getAdminSession.mockResolvedValueOnce({
      userId: "1",
      email: "admin@example.test",
      role: "admin",
    });
    const { rerender } = render(
      <AdminGuard>
        <p>Dane ofert</p>
      </AdminGuard>,
    );
    route.pathname = "/admin/inny-wyjazd";
    route.current = "/admin/inny-wyjazd";
    rerender(
      <AdminGuard>
        <p>Dane ofert</p>
      </AdminGuard>,
    );
    expect(await screen.findByText("Dane ofert")).toBeInTheDocument();
    resolveFirst(null);
    await waitFor(() => expect(mockedAuth.getAdminSession).toHaveBeenCalledTimes(2));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not redirect after navigation away while a session check is pending", async () => {
    let resolveCheck!: (value: null) => void;
    mockedAuth.getAdminSession.mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve;
      }),
    );
    render(
      <AdminGuard>
        <p>Dane ofert</p>
      </AdminGuard>,
    );
    route.current = "/kontakt";
    resolveCheck(null);
    await waitFor(() => expect(mockedAuth.getAdminSession).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockNavigate).not.toHaveBeenCalled();
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
