import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import type { FunctionComponent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Route as AdminDocumentsRoute } from "./admin.dokumenty";
import { Route as AdminPortalRoute } from "./admin.portal";

const { mockedGetAdminSession, mockedListAdminPortalCarouselImages } = vi.hoisted(() => ({
  mockedGetAdminSession: vi.fn(),
  mockedListAdminPortalCarouselImages: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getAdminSession: mockedGetAdminSession,
  signOut: vi.fn(),
}));

vi.mock("@/lib/portal-carousel/repository", () => ({
  listAdminPortalCarouselImages: mockedListAdminPortalCarouselImages,
  savePortalCarouselImages: vi.fn(),
}));

vi.mock("@/components/admin/ContactDocumentManager", () => ({
  ContactDocumentManager: () => null,
}));

const renderAdminPage = async (Component: FunctionComponent, initialEntry: string) => {
  const rootRoute = createRootRoute();
  const currentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: initialEntry,
    component: Component,
  });
  const linkedPaths = ["/", "/admin", "/admin/dokumenty", "/admin/portal", "/admin/login"]
    .filter((path) => path !== initialEntry)
    .map((path) =>
      createRoute({
        getParentRoute: () => rootRoute,
        path,
        component: () => null,
      }),
    );
  const router = createRouter({
    routeTree: rootRoute.addChildren([currentRoute, ...linkedPaths]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });

  await router.load();
  return render(<RouterProvider router={router} />);
};

beforeEach(() => {
  mockedListAdminPortalCarouselImages.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("admin portal route", () => {
  it("protects the Portal route with AdminGuard", async () => {
    mockedGetAdminSession.mockReturnValue(new Promise(() => undefined));

    await renderAdminPage(AdminPortalRoute.options.component as FunctionComponent, "/admin/portal");

    expect(screen.getByText("Sprawdzamy dostęp…")).toBeInTheDocument();
    expect(screen.queryByText("Karuzela strony głównej")).not.toBeInTheDocument();
  });

  it("keeps the Portal route out of search indexes", () => {
    const head = AdminPortalRoute.options.head?.({} as never) as {
      meta?: Array<Record<string, string>>;
    };

    expect(head.meta).toContainEqual({ title: "Portal — CMS VHSBOARD" });
    expect(head.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
  });

  it("renders the carousel manager and links to Oferty and Dokumenty", async () => {
    mockedGetAdminSession.mockResolvedValue({ user: {} });

    await renderAdminPage(AdminPortalRoute.options.component as FunctionComponent, "/admin/portal");

    expect(
      await screen.findByRole("heading", { name: "Karuzela strony głównej" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Karuzela portalu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Oferty" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Dokumenty" })).toHaveAttribute(
      "href",
      "/admin/dokumenty",
    );
  });
});

describe("admin documents navigation", () => {
  it("links the documents header to Portal", async () => {
    mockedGetAdminSession.mockResolvedValue({ user: {} });

    await renderAdminPage(
      AdminDocumentsRoute.options.component as FunctionComponent,
      "/admin/dokumenty",
    );

    expect(await screen.findByRole("link", { name: "Portal" })).toHaveAttribute(
      "href",
      "/admin/portal",
    );
  });
});
