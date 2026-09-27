import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CookieConsentProvider } from "@/components/cookie-consent/CookieConsentProvider";
import type { DayCampOffer, TripOffer } from "@/lib/offers/types";

const mockedListPublicPortalCarouselImages = vi.hoisted(() => vi.fn());
const mockedListPublishedOffers = vi.hoisted(() => vi.fn());

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
  vi.unstubAllGlobals();
});

beforeEach(() => {
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
  it("keeps the static fallback carousel when configuration cannot be read", async () => {
    mockedListPublicPortalCarouselImages.mockRejectedValue(new Error("offline"));

    await renderRoute("/", HomeRoute);

    await waitFor(() => expect(mockedListPublicPortalCarouselImages).toHaveBeenCalledOnce());
    expect(screen.getAllByTestId("hero-carousel-slide")).toHaveLength(2);
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

  it("extends the home page from current offers to the brand story and contact CTA", async () => {
    mockedListPublishedOffers.mockImplementation((kind: "trip" | "day_camp") =>
      Promise.resolve(kind === "trip" ? [homeTrip] : [homeCamp]),
    );

    await renderRoute("/", HomeRoute);

    expect(
      await screen.findByRole("heading", { name: "NAJBLIŻSZE NA RADARZE" }),
    ).toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: "Poznaj VHSBOARD" })).toHaveAttribute("href", "/o-nas");
    const contactHeading = screen.getByRole("heading", { name: "GOTOWY NA COŚ POZA PLANEM?" });
    expect(contactHeading).toBeInTheDocument();
    const contactSection = contactHeading.closest("section");
    if (!contactSection) throw new Error("Nie znaleziono końcowej sekcji kontaktowej");

    expect(within(contactSection).getByRole("link", { name: "Napisz do nas" })).toHaveAttribute(
      "href",
      "/kontakt",
    );
    expect(within(contactSection).getByRole("link", { name: "Zobacz wyjazdy" })).toHaveAttribute(
      "href",
      "/wyjazdy",
    );
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

  it("presents the mobile skimboard track format and directs enquiries to contact", async () => {
    await renderRoute("/eventy", EventsRoute);

    expect(
      screen.getByRole("heading", { name: /przyciąga ludzi.*surfing dla każdego/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Strefa Skate" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /strefa letnia w centrum handlowym/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/integracjach firmowych i piknikach pracowniczych/i),
    ).toBeInTheDocument();
    expect(screen.getByText("obozach dla dzieci i młodzieży")).toBeInTheDocument();
    expect(screen.queryByText("obozach i obozach dla dzieci i młodzieży")).not.toBeInTheDocument();
    expect(screen.getByText(/15 m, 20 m, 22 m, 30 m/i)).toBeInTheDocument();

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
    expect(
      screen.getByRole("img", {
        name: /uczestnik obozu wakeboardowego na jeziorze podczas letnich zajęć/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /uczestniczka obozu snowboardowego podczas zimowej jazdy w górach/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /najbliższe terminy/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Dla dzieci w jakim wieku są obozy i półkolonie VHS?",
      }),
    ).toBeInTheDocument();
  });

  it("keeps discontinued services as company background rather than separate sales pages", async () => {
    await renderRoute("/o-nas", AboutRoute);

    expect(screen.getByText(/surfingu, snowboardingu i deskorolki/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /wypożyczalnia|szkoła surfingu/i }),
    ).not.toBeInTheDocument();
  });

  it("gives the VHS story a founder portrait and visual links to the board sports", async () => {
    await renderRoute("/o-nas", AboutRoute);

    expect(screen.getByRole("heading", { name: /poznaj mariusza/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /od miasta po góry/i })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /mariusz podczas jazdy na deskorolce/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /snowboardzista w locie nad śnieżnym skokiem/i }),
    ).toBeInTheDocument();
  });

  it("leads the VHS activity story from the mountains into skimboarding and surfing", async () => {
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
      "Snowboardzista w locie nad śnieżnym skokiem",
      "Mobilny tor skimboardowy VHS przygotowany do aktywności na świeżym powietrzu",
      "Mariusz w koszulce VHS podczas surfowego wyjazdu",
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
