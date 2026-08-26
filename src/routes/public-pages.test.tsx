import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Route as AboutRoute } from "./o-nas";
import { Route as ContactRoute } from "./kontakt";
import { Route as EventsRoute } from "./eventy";
import { Route as HalfDayCampsRoute } from "./polkolonie.index";
import { Route as HomeRoute } from "./index";

const publicSiteEnv = {
  VITE_SITE_URL: "https://vhsboard.pages.dev",
  VITE_SEO_INDEXING: "false",
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
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(["published-offers", "day_camp"], []);
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("static public pages", () => {
  it("presents the three main areas as photo-led entry points", async () => {
    await renderRoute("/", HomeRoute);

    const structuredData = document.querySelector('script[type="application/ld+json"]');
    expect(structuredData?.textContent).toContain('"Organization"');
    expect(structuredData?.textContent).toContain('"WebSite"');

    expect(
      screen.getByRole("heading", { name: /wybierz, od czego zaczynasz/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("topic-selector")).toHaveClass("topic-selector");
    expect(
      screen.getByTestId("topic-selector").querySelectorAll(".topic-selector__content"),
    ).toHaveLength(3);
    expect(
      screen.getByTestId("topic-selector").querySelectorAll(".topic-selector__content--contrast"),
    ).toHaveLength(3);
    expect(
      screen.getByTestId("topic-selector").querySelectorAll(".topic-selector__content--flush-left"),
    ).toHaveLength(3);
    expect(
      screen.getByTestId("topic-selector").querySelectorAll(".topic-selector__content--inset-left"),
    ).toHaveLength(0);
    expect(
      screen
        .getByTestId("topic-selector")
        .querySelectorAll(".topic-selector__content--safe-text-inset"),
    ).toHaveLength(3);
    expect(
      screen.getByTestId("topic-selector").querySelectorAll(".topic-selector__item--mobile-stack"),
    ).toHaveLength(3);
    expect(
      screen.getByTestId("topic-selector").querySelector(".topic-selector__content--2"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("topic-selector").querySelector(".topic-selector__content--3"),
    ).toBeInTheDocument();

    const entryPoints = [
      {
        href: "/wyjazdy",
        imageAlt: "Uczestnicy wyjazdu VHSBOARD z deskami surfingowymi na plaży",
      },
      {
        href: "/eventy",
        imageAlt: "Uczestnik eventu na mobilnym torze skimboardowym VHSBOARD",
      },
      {
        href: "/polkolonie",
        imageAlt:
          "Dziecko płynące na wakeboardzie podczas półkolonii VHSBOARD, obserwowane przez instruktora i grupę dzieci",
      },
    ];

    for (const entryPoint of entryPoints) {
      const link = screen.getByRole("img", { name: entryPoint.imageAlt }).closest("a");
      expect(link).toHaveAttribute("href", entryPoint.href);
    }
  });

  it("explains the mobile skimboard track format and directs enquiries to contact", async () => {
    await renderRoute("/eventy", EventsRoute);

    expect(
      screen.getByRole("heading", { name: /tor skimboardowy.*wynajem na eventy/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skimboarding/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=85_CDXNlPmg&t=1s",
    );
    expect(
      screen.getByText(/integracjach firmowych i piknikach pracowniczych/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/15, 20 i 30 metrów/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /zapytaj o event/i })).toHaveAttribute(
      "href",
      "/kontakt",
    );
  });

  it("explains seasonal half-day camps and communicates that new offers may appear soon", async () => {
    await renderRoute("/polkolonie", HalfDayCampsRoute);

    expect(screen.getByRole("heading", { name: /półkolonie aktywnie/i })).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /dziecko płynące na wakeboardzie podczas półkolonii/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/wakepark, skimboard i skateboarding/i)).toBeInTheDocument();
    expect(screen.getByText(/śnieg i snowboard/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /aktualne półkolonie/i })).toBeInTheDocument();
    expect(screen.getByText(/nie mamy teraz otwartych półkolonii/i)).toBeInTheDocument();
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
    expect(screen.getAllByText("NIP: 1234567890")).toHaveLength(1);
  });
});
