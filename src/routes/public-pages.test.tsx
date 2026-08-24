import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Route as AboutRoute } from "./o-nas";
import { Route as ContactRoute } from "./kontakt";
import { Route as EventsRoute } from "./eventy";
import { Route as HalfDayCampsRoute } from "./polkolonie";

const publicSiteEnv = {
  VITE_CONTACT_EMAIL: "kontakt@example.test",
  VITE_CONTACT_PHONE: "+48123456789",
  VITE_BUSINESS_NAME: "Testowa firma",
  VITE_BUSINESS_STREET: "ul. Przykładowa 1",
  VITE_BUSINESS_POSTAL_CODE: "00-001",
  VITE_BUSINESS_CITY: "Warszawa",
  VITE_BUSINESS_NIP: "1234567890",
  VITE_BUSINESS_REGON: "123456789",
};

const renderRoute = async (path: string, route: { options: { component?: unknown } }) => {
  for (const [name, value] of Object.entries(publicSiteEnv)) {
    vi.stubEnv(name, value);
  }
  const Component = route.options.component as ComponentType;
  const rootRoute = createRootRoute();
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path,
    component: Component,
  });
  const emptyRoutes = ["/", "/wyjazdy", "/eventy", "/polkolonie", "/o-nas", "/kontakt"]
    .filter((routePath) => routePath !== path)
    .map((routePath) =>
      createRoute({
        getParentRoute: () => rootRoute,
        path: routePath,
        component: () => null,
      }),
    );
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute, ...emptyRoutes]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  await router.load();
  return render(<RouterProvider router={router} />);
};

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("static public pages", () => {
  it("explains the event format and directs enquiries to contact", async () => {
    await renderRoute("/eventy", EventsRoute);

    expect(
      screen.getByRole("heading", { name: /eventy z torem skimboardowym/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /zapytaj o event/i })).toHaveAttribute(
      "href",
      "/kontakt",
    );
  });

  it("keeps half-day camps as an evergreen page without a booking CTA", async () => {
    await renderRoute("/polkolonie", HalfDayCampsRoute);

    expect(screen.getByRole("heading", { name: /półkolonie aktywnie/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /rezerwuj|zapisz/i })).not.toBeInTheDocument();
  });

  it("keeps discontinued services as company background rather than separate sales pages", async () => {
    await renderRoute("/o-nas", AboutRoute);

    expect(screen.getByText(/surfingu, snowboardingu i deskorolki/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /wypożyczalnia|szkoła surfingu/i }),
    ).not.toBeInTheDocument();
  });

  it("renders contact data only from the public deploy configuration", async () => {
    await renderRoute("/kontakt", ContactRoute);

    expect(screen.getAllByRole("link", { name: "kontakt@example.test" })[0]).toHaveAttribute(
      "href",
      "mailto:kontakt@example.test",
    );
    expect(screen.getAllByText("NIP: 1234567890")).toHaveLength(2);
  });
});
