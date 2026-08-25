import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";

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

const renderPublicChrome = async (initialEntry: string) => {
  for (const [name, value] of Object.entries(publicSiteEnv)) {
    vi.stubEnv(name, value);
  }

  const rootRoute = createRootRoute();
  const routes = ["/", "/wyjazdy", "/eventy", "/polkolonie", "/o-nas", "/kontakt"].map((path) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => (
        <>
          <PublicHeader />
          <PublicFooter />
        </>
      ),
    }),
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });

  await router.load();
  return render(<RouterProvider router={router} />);
};

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("public navigation", () => {
  it("links to the final public pages and exposes the current page", async () => {
    await renderPublicChrome("/wyjazdy");

    expect(screen.getByRole("link", { name: "Wyjazdy" })).toHaveAttribute("href", "/wyjazdy");
    expect(screen.getByRole("link", { name: "Wyjazdy" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Kontakt" })).toHaveAttribute("href", "/kontakt");
    expect(screen.getByRole("link", { name: "Eventy" })).toHaveAttribute("href", "/eventy");
    expect(screen.getByRole("link", { name: "Półkolonie" })).toHaveAttribute("href", "/polkolonie");
  });

  it("opens the same navigation in a labelled mobile menu", async () => {
    const user = userEvent.setup();
    await renderPublicChrome("/");

    await user.click(screen.getByRole("button", { name: "Otwórz menu" }));

    const menu = screen.getByRole("dialog", { name: "Menu główne" });
    expect(menu).toBeInTheDocument();
    expect(menu.querySelector('a[href="/wyjazdy"]')).toHaveTextContent("Wyjazdy");
  });

  it("uses deployment configuration for contact details in the footer", async () => {
    await renderPublicChrome("/kontakt");

    expect(screen.getByRole("link", { name: "kontakt@example.test" })).toHaveAttribute(
      "href",
      "mailto:kontakt@example.test",
    );
  });
});
