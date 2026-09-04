import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CookieConsentProvider } from "@/components/cookie-consent/CookieConsentProvider";

import { Route as AboutRoute } from "./o-nas";
import { Route as ContactRoute } from "./kontakt";
import { Route as EventsRoute } from "./eventy";
import { Route as HalfDayCampsRoute } from "./obozy.index";
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
  VITE_BUSINESS_BANK_ACCOUNT: "12345678901234567890123456",
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
  const emptyRoutes = ["/", "/wyjazdy", "/eventy", "/obozy", "/o-nas", "/kontakt"]
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
      <CookieConsentProvider>
        <RouterProvider router={router} />
      </CookieConsentProvider>
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

    expect(screen.getByRole("heading", { name: /zacznij nową przygodę/i })).toBeInTheDocument();
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
        href: "/obozy",
        imageAlt:
          "Dziecko płynące na wakeboardzie podczas obozu VHSBOARD, obserwowane przez instruktora i grupę dzieci",
      },
    ];

    for (const entryPoint of entryPoints) {
      const link = screen.getByRole("img", { name: entryPoint.imageAlt }).closest("a");
      expect(link).toHaveAttribute("href", entryPoint.href);
    }
  });

  it("presents the mobile skimboard track format and directs enquiries to contact", async () => {
    await renderRoute("/eventy", EventsRoute);

    expect(
      screen.getByRole("heading", { name: /przyciąga ludzi.*wciąga do zabawy/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /strefa skate/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /strefa letnia w centrum handlowym/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/integracjach firmowych i piknikach pracowniczych/i),
    ).toBeInTheDocument();
    expect(screen.getByText("obozach dla dzieci i młodzieży")).toBeInTheDocument();
    expect(screen.queryByText("obozach i obozach dla dzieci i młodzieży")).not.toBeInTheDocument();
    expect(screen.getByText(/15 m, 20 m, 22 m, 30 m/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Zdjęcie zastępcze:/)).toHaveLength(6);
    expect(
      screen.getAllByText("Zdjęcie zastępcze: realizacja toru skimboardowego podczas eventu."),
    ).toHaveLength(3);

    const expectPlaceholderImage = (caption: string, alt: string) => {
      const figure = screen.getByText(caption).closest("figure");
      if (!figure) {
        throw new Error(`Nie znaleziono figury dla podpisu: ${caption}`);
      }

      expect(within(figure).getByRole("img")).toHaveAccessibleName(alt);
    };

    expectPlaceholderImage(
      "Zdjęcie zastępcze: strefa skate z deskorolką, rolkami i warsztatami.",
      "Dziecko uczące się skimboardingu pod opieką instruktora na mobilnym torze",
    );
    expectPlaceholderImage(
      "Zdjęcie zastępcze: letnia strefa z torem skimboardowym w centrum handlowym.",
      "Uczestnik ślizgający się po mobilnym torze skimboardowym podczas plenerowego eventu",
    );
    expectPlaceholderImage(
      "Zdjęcie zastępcze: mobilne tory skimboardowe w różnych długościach.",
      "Dziecko uczące się skimboardingu pod opieką instruktora na mobilnym torze",
    );

    const gallery = screen.getByRole("heading", { name: /zobacz nas w akcji/i }).closest("section");
    if (!gallery) {
      throw new Error("Nie znaleziono sekcji galerii Eventów");
    }
    expect(
      within(gallery).getByRole("img", {
        name: "Uczestnik korzystający z mobilnego toru skimboardowego podczas eventu",
      }),
    ).toBeInTheDocument();
    expect(
      within(gallery).getByRole("img", {
        name: "Dziecko uczące się skimboardingu pod opieką instruktora",
      }),
    ).toBeInTheDocument();
    expect(
      within(gallery).getAllByText(
        "Zdjęcie zastępcze: realizacja toru skimboardowego podczas eventu.",
      ),
    ).toHaveLength(2);
    expect(screen.getByRole("heading", { name: /zobacz nas w akcji/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /plan dnia/i })).not.toBeInTheDocument();
    for (const eventLink of screen.getAllByRole("link", { name: /zapytaj o event/i })) {
      expect(eventLink).toHaveAttribute("href", "/kontakt");
    }
  });

  it("presents active camps with current seasonal copy", async () => {
    await renderRoute("/obozy", HalfDayCampsRoute);

    expect(screen.getByRole("heading", { name: /zajawkowe obozy/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /wakeboard, skimboard, deskorolka, sup i masa aktywności, które dzieciaki kochają najbardziej/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /najbliższe terminy/i })).toBeInTheDocument();
    expect(screen.queryByText(/półkoloni/i)).not.toBeInTheDocument();
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
