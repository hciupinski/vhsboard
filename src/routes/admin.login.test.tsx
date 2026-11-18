import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ signedIn: false }));
vi.mock("@/lib/auth/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/session")>()),
  getAdminSession: vi.fn(async () =>
    auth.signedIn ? { userId: "user-1", email: "admin@example.test", role: "admin" } : null,
  ),
  signInWithPassword: vi.fn(async () => {
    auth.signedIn = true;
  }),
  signOut: vi.fn(async () => {
    auth.signedIn = false;
  }),
}));
vi.mock("@/lib/offers/admin-repository", () => ({
  listAdminOffers: vi.fn().mockResolvedValue([]),
}));
import { routeTree } from "@/routeTree.gen";

afterEach(() => {
  cleanup();
  auth.signedIn = false;
});
it.each(["/admin", "/admin/dokumenty", "/admin/oferta-testowa"])(
  "returns to %s on the first successful sign-in after the guard redirects",
  async (path) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history: createMemoryHistory({ initialEntries: [path] }),
    });
    await router.load();
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("E-mail"), "admin@example.test");
    expect(router.state.location.search).toEqual({ next: path });
    await user.type(screen.getByLabelText("Hasło"), "password");
    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
    await waitFor(() => expect(router.state.location.pathname).toBe(path));
  },
);
