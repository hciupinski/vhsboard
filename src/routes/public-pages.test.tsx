import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import type { FunctionComponent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CookieConsentProvider } from "@/components/cookie-consent/CookieConsentProvider";
import type { DayCampOffer, TripOffer } from "@/lib/offers/types";

const mockedListPublicPortalCarouselImages = vi.hoisted(() => vi.fn());
const mockedListPublishedOffers = vi.hoisted(() => vi.fn());
const mockedGetPublicPortalTheme = vi.hoisted(() => vi.fn());

vi.mock("@/lib/portal-theme/repository", () => ({
  getPublicPortalTheme: mockedGetPublicPortalTheme,
}));

vi.mock("@/lib/portal-carousel/repository", () => ({
  listPublicPortalCarouselImages: mockedListPublicPortalCarouselImages,
}));

vi.mock("@/lib/offers/public-repository", () => ({
  listPublishedOffers: mockedListPublishedOffers,
}));

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

const homeTrip: TripOffer = {
  id: "trip-1",
  slug: "atlantic-surf-week",
  offerKind: "trip",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "",
  shortDescription: "Poranne sesje na oceanie.",
  location: "Ericeira, Portugalia",
  startDate: "2099-06-12",
  endDate: "2099-06-18",
  durationDays: 7,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 3100,
  currency: "PLN",
  bookingUrl: "https://example.test/zapisy",
  showLastPlacesBadge: false,
  heroImageUrl: null,
  images: [],
  accommodationImages: [],
  content: { paragraphs: [], highlights: [], included: [], excluded: [], schedule: [] },
};

const homeCamp: DayCampOffer = {
  id: "camp-1",
  slug: "wakeboardowe-lato",
  offerKind: "day_camp",
  activity: "wake",
  title: "Wakeboardowe lato",
  subtitle: "",
  shortDescription: "Pięć aktywnych dni nad wodą.",
  location: "Warszawa",
  startDate: "2099-07-01",
  endDate: "2099-07-05",
  durationDays: 5,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 1200,
  currency: "PLN",
  bookingUrl: "https://example.test/zapisy",
  showLastPlacesBadge: false,
  heroImageUrl: null,
  images: [],
  accommodationImages: [],
  content: {
    paragraphs: [],
    highlights: [],
    included: [],
    excluded: [],
    dayProgram: [],
    venueDescription: "",
    parentInfo: { ageRange: "", supervision: "", safety: "" },
    terms: [],
  },
};

const renderRoute = async (path: string, route: { options: { component?: unknown } }) => {
  for (const [name, value] of Object.entries(publicSiteEnv)) {
    vi.stubEnv(name, value);
  }
  const Component = route.options.component as FunctionComponent;
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
  const view = render(
    <QueryClientProvider client={queryClient}>
      <CookieConsentProvider>
        <RouterProvider router={router} />
      </CookieConsentProvider>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
};

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  mockedGetPublicPortalTheme.mockReset();
  mockedGetPublicPortalTheme.mockResolvedValue("original");
  mockedListPublicPortalCarouselImages.mockReset();
  mockedListPublicPortalCarouselImages.mockResolvedValue([]);
  mockedListPublishedOffers.mockReset();
  mockedListPublishedOffers.mockResolvedValue([]);
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      disconnect = vi.fn();
      observe = vi.fn();
      takeRecords = vi.fn(() => []);
      unobserve = vi.fn();
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      disconnect = vi.fn();
      observe = vi.fn();
      unobserve = vi.fn();
    },
  );
  vi.stubGlobal("scrollTo", vi.fn());
});

describe("static public pages", () => {
  it("limits the homepage offer section to three cards", async () => {
    const offers = Array.from({ length: 10 }, (_, i) => ({
      ...homeTrip,
      id: `trip-${i}`,
      slug: `trip-${i}`,
      title: `TEST wyjazd ${i}`,
      startDate: "2099-01-01",
      endDate: "2099-01-07",
    }));
    mockedListPublishedOffers.mockImplementation((kind: "trip" | "day_camp") =>
      Promise.resolve(kind === "trip" ? offers : []),
    );
    await renderRoute("/", HomeRoute);
    const heading = await screen.findByRole("heading", { name: "ROZKŁAD JAZDY" });
    const section = heading.closest("section")!;
    await waitFor(() =>
      expect(
        within(section).getAllByRole("heading", { level: 3, name: /TEST wyjazd/ }),
      ).toHaveLength(3),
    );
  });
  it("keeps the static fallback carousel when configuration cannot be read", async () => {
    mockedListPublicPortalCarouselImages.mockRejectedValue(new Error("offline"));

    await renderRoute("/", HomeRoute);

    await waitFor(() => expect(mockedListPublicPortalCarouselImages).toHaveBeenCalledOnce());
    expect(screen.getAllByTestId("hero-carousel-slide")).toHaveLength(5);
  });

  it("uses ordered public carousel images when configuration loads", async () => {
    mockedListPublicPortalCarouselImages.mockResolvedValue([
      { path: "carousel/surf.jpg", src: "/surf.jpg", label: "Surf" },
      { path: "carousel/snow.jpg", src: "/snow.jpg", label: "Snow" },
    ]);

    await renderRoute("/", HomeRoute);

    await waitFor(() =>
      expect(
        screen.getAllByTestId("hero-carousel-slide").map((image) => image.getAttribute("src")),
      ).toEqual(["/surf.jpg", "/snow.jpg"]),
    );
  });

  it("presents the three main areas as photo-led entry points", async () => {
    await renderRoute("/", HomeRoute);

    const structuredData = document.querySelector('script[type="application/ld+json"]');
    expect(structuredData?.textContent).toContain('"Organization"');
    expect(structuredData?.textContent).toContain('"WebSite"');

    expect(screen.getByRole("heading", { name: /zacznij nową przygodę/i })).toBeInTheDocument();
    const hero = screen
      .getByRole("heading", { name: "Dobre rzeczy dzieją się poza codziennym planem" })
      .closest("section");
    if (!hero) throw new Error("Nie znaleziono sekcji hero");
    expect(hero.querySelector("[data-hero-copy]")).toHaveClass("bg-foreground/75");
    const heroTripLink = within(hero).getByRole("link", { name: "Zobacz wyjazdy" });
    expect(heroTripLink).toHaveAttribute("href", "/wyjazdy");
    expect(heroTripLink).not.toHaveClass("hidden");
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
      screen.getByTestId("topic-selector").querySelectorAll(".topic-selector__details"),
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
        imageAlt: "Uczestnicy wyjazdu snowboardowego VHSBOARD w zaśnieżonych górach",
      },
      {
        href: "/eventy",
        imageAlt: "Uczestnik eventu na mobilnym torze skimboardowym VHSBOARD",
      },
      {
        href: "/obozy",
        imageAlt: "Dziecko na snowboardzie podczas zimowego obozu VHSBOARD",
      },
    ];

    for (const entryPoint of entryPoints) {
      const link = screen.getByRole("img", { name: entryPoint.imageAlt }).closest("a");
      expect(link).toHaveAttribute("href", entryPoint.href);
    }
    expect(
      screen.getByRole("img", {
        name: "Uczestnik eventu na mobilnym torze skimboardowym VHSBOARD",
      }),
    ).toHaveAttribute("loading", "lazy");
    expect(
      screen.getByRole("img", {
        name: "Dziecko na snowboardzie podczas zimowego obozu VHSBOARD",
      }),
    ).toHaveAttribute("loading", "lazy");
  });

  it("extends the home page from current offers to the brand story and contact CTA", async () => {
    mockedListPublishedOffers.mockImplementation((kind: "trip" | "day_camp") =>
      Promise.resolve(kind === "trip" ? [homeTrip] : [homeCamp]),
    );

    await renderRoute("/", HomeRoute);

    expect(await screen.findByRole("heading", { name: "ROZKŁAD JAZDY" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: homeTrip.title })).toHaveAttribute(
      "href",
      "/wyjazdy/atlantic-surf-week",
    );
    expect(screen.getByRole("link", { name: homeCamp.title })).toHaveAttribute(
      "href",
      "/obozy/wakeboardowe-lato",
    );
    expect(
      screen.getByRole("heading", { name: "NIEWAŻNE GDZIE. WAŻNE, ŻE NA DESCE" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/VHSBOARD działa od 2017 roku\./i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Poznaj VHSBOARD" })).toHaveAttribute("href", "/o-nas");
    const contactHeading = screen.getByRole("heading", { name: "MASZ PYTANIA? POGADAJMY!" });
    expect(contactHeading).toBeInTheDocument();
    const contactSection = contactHeading.closest("section");
    if (!contactSection) throw new Error("Nie znaleziono końcowej sekcji kontaktowej");

    expect(within(contactSection).getByRole("link", { name: "Napisz do nas" })).toHaveAttribute(
      "href",
      "/kontakt",
    );
    expect(
      within(contactSection).queryByRole("link", { name: "Zobacz wyjazdy" }),
    ).not.toBeInTheDocument();
  });

  it("keeps category links when the home offer request fails", async () => {
    mockedListPublishedOffers.mockRejectedValue(new Error("offline"));

    await renderRoute("/", HomeRoute);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Nie udało się pobrać najbliższych ofert.");
    const homeOffersSection = alert.closest("section");
    if (!homeOffersSection) throw new Error("Nie znaleziono sekcji najbliższych ofert");

    expect(within(homeOffersSection).getByRole("link", { name: "Zobacz wyjazdy" })).toHaveAttribute(
      "href",
      "/wyjazdy",
    );
    expect(within(homeOffersSection).getByRole("link", { name: "Zobacz obozy" })).toHaveAttribute(
      "href",
      "/obozy",
    );
  });

  it("shows an accessible coming-soon message while preserving the event content behind it", async () => {
    await renderRoute("/eventy", EventsRoute);

    expect(
      screen.getByRole("heading", { level: 1, name: /szykujemy coś dobrego/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Nawigacja główna" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /zobacz wyjazdy/i })).toHaveAttribute(
      "href",
      "/wyjazdy",
    );
    expect(screen.getByRole("link", { name: /zapytaj o event/i })).toHaveAttribute(
      "href",
      "/kontakt",
    );
    const background = screen.getByText(/tor skimboardowy – przyciąga ludzi/i).closest("[inert]");
    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveTextContent("MIEJSKIE SPORTY, KTÓRE ŁĄCZĄ");
    expect(background).toHaveTextContent("Zobacz nas w akcji");
    expect(
      screen.queryByRole("heading", { name: /tor skimboardowy – przyciąga ludzi/i }),
    ).not.toBeInTheDocument();
  });

  it("lists upcoming camps without old archived camps", async () => {
    const offers = [
      {
        ...homeCamp,
        id: "old",
        title: "Starszy obóz",
        startDate: "2000-01-01",
        endDate: "2000-01-07",
      },
      {
        ...homeCamp,
        id: "later",
        title: "Późniejszy obóz",
        startDate: "2099-08-01",
        endDate: "2099-08-07",
      },
      {
        ...homeCamp,
        id: "recent",
        title: "Ostatnio zakończony obóz",
        startDate: "2001-01-01",
        endDate: "2001-01-07",
      },
      { ...homeCamp, id: "near", title: "Najbliższy obóz", startDate: "2099-07-01" },
    ];
    mockedListPublishedOffers.mockResolvedValue(offers);
    await renderRoute("/obozy", HalfDayCampsRoute);
    const section = screen.getByRole("region", { name: "NAJBLIŻSZE TERMINY" });
    await waitFor(() =>
      expect(within(section).getAllByRole("heading", { level: 3 })).toHaveLength(2),
    );
    expect(
      within(section)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(["Najbliższy obóz", "Późniejszy obóz"]);
  });

  it("presents active camps with current seasonal copy", async () => {
    await renderRoute("/obozy", HalfDayCampsRoute);

    expect(screen.getByRole("heading", { name: /zajawkowe obozy/i })).toBeInTheDocument();
    const campHero = screen.getByRole("heading", { name: /zajawkowe obozy/i }).closest("section")!;
    expect(campHero.querySelector("[data-hero-copy]")).toHaveClass("bg-foreground/75");
    expect(
      screen.getByText(
        /wakeboard, skimboard, deskorolka, sup i masa aktywności, które dzieciaki kochają najbardziej/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /uczestnik obozu wakeboardowego na jeziorze podczas letnich zajęć/i,
      }),
    ).toHaveAttribute(
      "src",
      expect.stringMatching(/^\/images\/generated\/obozy-obozy-lato-wakeboard-/),
    );
    expect(
      screen.getByRole("img", {
        name: /snowboardzista w czerwonej kurtce podczas zimowej jazdy w górach/i,
      }),
    ).toHaveAttribute("src", expect.stringMatching(/^\/images\/generated\/obozy-obozy-zima-/));
    expect(screen.getByRole("heading", { name: /najbliższe terminy/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Dla dzieci w jakim wieku są obozy i półkolonie VHS?",
      }),
    ).toBeInTheDocument();
  });

  it("updates the camp hero when the global portal theme changes in either direction", async () => {
    const { queryClient } = await renderRoute("/obozy", HalfDayCampsRoute);
    await waitFor(() =>
      expect(queryClient.getQueryData(["public", "portal-theme"])).toBe("original"),
    );
    const hero = screen.getByRole("heading", { name: /zajawkowe obozy/i }).closest("section")!;
    const image = () => within(hero).getByRole("img");

    expect(image()).toHaveAttribute(
      "src",
      expect.stringMatching(/^\/images\/generated\/obozy-main-obozy-lato-/),
    );

    await act(async () => {
      mockedGetPublicPortalTheme.mockResolvedValue("winter");
      await queryClient.invalidateQueries({ queryKey: ["public", "portal-theme"] });
    });
    await waitFor(() =>
      expect(image()).toHaveAttribute(
        "src",
        expect.stringMatching(/^\/images\/generated\/obozy-main-obozy-zima-/),
      ),
    );
    for (const source of hero.querySelectorAll("picture source")) {
      expect(source.getAttribute("srcset")).toMatch(/^\/images\/generated\/obozy-main-obozy-zima-/);
    }

    await act(async () => {
      mockedGetPublicPortalTheme.mockResolvedValue("original");
      await queryClient.invalidateQueries({ queryKey: ["public", "portal-theme"] });
    });
    await waitFor(() =>
      expect(image()).toHaveAttribute(
        "src",
        expect.stringMatching(/^\/images\/generated\/obozy-main-obozy-lato-/),
      ),
    );
  });

  it("shows the revised company story", async () => {
    await renderRoute("/o-nas", AboutRoute);

    expect(screen.getByText(/Zajawka do sportów sprawiła/i)).toBeInTheDocument();
  });

  it("shows the revised home and about copy", async () => {
    const home = await renderRoute("/", HomeRoute);
    expect(
      screen.getByText(
        "Obozy i półkolonie dla dzieci i młodzieży - dobra zabawa w małych grupach.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Chcesz dołączyć do wyjazdu, wybrać obóz dla dziecka/),
    ).toBeInTheDocument();
    home.unmount();
    await renderRoute("/o-nas", AboutRoute);
    expect(screen.getByText(/Doświadczenie eventowe zdobywał w Red Bullu/)).toBeInTheDocument();
    expect(screen.getByText(/Poznaj nas bliżej - sprawdź/)).toBeInTheDocument();
  });

  it("gives the VHS story a founder portrait and visual links to the board sports", async () => {
    await renderRoute("/o-nas", AboutRoute);

    expect(screen.getByRole("heading", { name: /poznaj mariusza/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /od miasta po góry/i })).toBeInTheDocument();
    const founderPhotos = screen.getByRole("figure", {
      name: "Mariusz na deskorolce, skimboardzie i snowboardzie",
    });
    expect(
      Array.from(founderPhotos.querySelectorAll("img"), (image) => image.getAttribute("src")),
    ).toEqual([
      expect.stringMatching(/\/about-us-mario-skate-\d+-/),
      expect.stringMatching(/\/about-us-mario-skim-2-\d+-/),
      expect.stringMatching(/\/about-us-mario-snow-\d+-/),
    ]);
    expect(within(founderPhotos).queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /uczestnicy wyjazdu surfingowego z deskami na plaży/i }),
    ).toBeInTheDocument();
  });

  it("shows the supplied surfing, city skateboarding and mountain photos in the activity story", async () => {
    await renderRoute("/o-nas", AboutRoute);

    const activities = screen
      .getByRole("heading", { name: /od miasta po góry/i })
      .closest("section");
    if (!activities) {
      throw new Error("Nie znaleziono sekcji VHS w ruchu");
    }

    expect(
      within(activities)
        .getAllByRole("img")
        .map((image) => image.getAttribute("alt")),
    ).toEqual([
      "Uczestnicy wyjazdu surfingowego z deskami na plaży",
      "Dzieci ćwiczące jazdę na deskorolkach z instruktorem podczas miejskiego eventu",
      "Grupa snowboardzistów z deskami na tle ośnieżonych gór",
    ]);
  });

  it("renders contact data only from the public deploy configuration", async () => {
    await renderRoute("/kontakt", ContactRoute);

    expect(screen.getAllByRole("link", { name: "kontakt@example.test" })[0]).toHaveAttribute(
      "href",
      "mailto:kontakt@example.test",
    );
    expect(screen.getAllByText("NIP: 1234567890")).toHaveLength(1);
  });

  it("keeps the social callout at the bottom of the contact card", async () => {
    await renderRoute("/kontakt", ContactRoute);

    const socialCallout = screen.getByRole("heading", {
      name: /sprawdź co u nas słychać i dołącz do społeczności vhs/i,
    });

    expect(socialCallout).toHaveClass("mt-auto");
    expect(socialCallout.closest("section")).toHaveClass("flex", "flex-col");
  });
});
