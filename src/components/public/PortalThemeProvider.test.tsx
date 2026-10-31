import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getTheme } = vi.hoisted(() => ({ getTheme: vi.fn() }));
vi.mock("@/lib/portal-theme/repository", () => ({ getPublicPortalTheme: getTheme }));
import { PortalThemeProvider } from "./PortalThemeProvider";

const clients: QueryClient[] = [];

async function setup(path = "/") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(client);
  const root = createRootRoute({
    component: () => (
      <QueryClientProvider client={client}>
        <PortalThemeProvider>
          <Outlet />
        </PortalThemeProvider>
      </QueryClientProvider>
    ),
  });
  const routes = ["/", "/kontakt", "/admin/portal", "/admin-shell"].map((routePath) =>
    createRoute({
      getParentRoute: () => root,
      path: routePath,
      component: () => <p>Treść strony</p>,
    }),
  );
  const router = createRouter({
    routeTree: root.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  const view = render(<RouterProvider router={router} />);
  return { ...view, client, router };
}

const expectTheme = (theme: string) =>
  expect(document.documentElement).toHaveAttribute("data-portal-theme", theme);

beforeEach(() => {
  getTheme.mockResolvedValue("winter");
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  focusManager.setFocused(undefined);
  vi.useRealTimers();
  vi.resetAllMocks();
  document.documentElement.removeAttribute("data-portal-theme");
});

describe("global public portal theme", () => {
  it.each(["winter", "original"])(
    "applies %s on html, including body-level dialogs",
    async (theme) => {
      getTheme.mockResolvedValue(theme);
      const { unmount } = await setup();
      await waitFor(() => expectTheme(theme));
      unmount();
      expect(document.documentElement).not.toHaveAttribute("data-portal-theme");
    },
  );

  it("keeps content available with the original palette while settings are unavailable", async () => {
    getTheme.mockRejectedValue(new Error("offline"));
    const { getByText } = await setup();
    await waitFor(() => expectTheme("original"));
    expect(getByText("Treść strony")).toBeInTheDocument();
  });

  it.each(["/admin/portal", "/admin-shell"])(
    "does not fetch or apply the public theme to %s",
    async (path) => {
      await setup(path);
      expect(document.documentElement).not.toHaveAttribute("data-portal-theme");
      expect(getTheme).not.toHaveBeenCalled();
    },
  );

  it("removes the theme in CMS and reloads the global setting on public re-entry", async () => {
    const { router } = await setup();
    await waitFor(() => expectTheme("winter"));
    await act(() => router.navigate({ to: "/admin/portal" }));
    expect(document.documentElement).not.toHaveAttribute("data-portal-theme");
    getTheme.mockResolvedValue("original");
    await act(() => router.navigate({ to: "/kontakt" }));
    await waitFor(() => expectTheme("original"));
  });

  it("retains the last valid theme during a failed background refresh", async () => {
    const { client } = await setup();
    await waitFor(() => expectTheme("winter"));
    getTheme.mockRejectedValue(new Error("offline"));
    await act(() => client.invalidateQueries({ queryKey: ["public", "portal-theme"] }));
    expectTheme("winter");
    getTheme.mockResolvedValue("original");
    await act(() => client.invalidateQueries({ queryKey: ["public", "portal-theme"] }));
    await waitFor(() => expectTheme("original"));
  });

  it("refreshes when returning to the browser tab", async () => {
    await setup();
    await waitFor(() => expectTheme("winter"));
    act(() => focusManager.setFocused(false));
    getTheme.mockResolvedValue("original");
    act(() => focusManager.setFocused(true));
    await waitFor(() => expectTheme("original"));
  });

  it("picks up a global change after 30 seconds without reloading the page", async () => {
    vi.useFakeTimers();
    await setup();
    await act(() => vi.advanceTimersByTimeAsync(10));
    expectTheme("winter");
    getTheme.mockResolvedValue("original");
    await act(() => vi.advanceTimersByTimeAsync(30_010));
    expectTheme("original");
  });

  it("does not poll a background tab", async () => {
    vi.useFakeTimers();
    await setup();
    await act(() => vi.advanceTimersByTimeAsync(10));
    expectTheme("winter");
    act(() => focusManager.setFocused(false));
    getTheme.mockResolvedValue("original");
    await act(() => vi.advanceTimersByTimeAsync(30_010));
    expectTheme("winter");
    act(() => focusManager.setFocused(true));
    await act(() => vi.advanceTimersByTimeAsync(10));
    expectTheme("original");
  });
});
