import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType, PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EditableOffer, EditableOfferInput } from "@/lib/offers/editor-schema";
import { Route as AdminEditorRoute } from "./admin.$slug";

const {
  mockedCanPublishOffer,
  mockedCreateOffer,
  mockedGetAdminOffer,
  mockedSetOfferStatus,
  mockedUpdateOffer,
} = vi.hoisted(() => ({
  mockedCanPublishOffer: vi.fn(),
  mockedCreateOffer: vi.fn(),
  mockedGetAdminOffer: vi.fn(),
  mockedSetOfferStatus: vi.fn(),
  mockedUpdateOffer: vi.fn(),
}));

vi.mock("@/lib/offers/admin-repository", () => ({
  canPublishOffer: mockedCanPublishOffer,
  createOffer: mockedCreateOffer,
  getAdminOffer: mockedGetAdminOffer,
  setOfferStatus: mockedSetOfferStatus,
  updateOffer: mockedUpdateOffer,
}));

vi.mock("@/components/admin/AdminGuard", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/components/admin/AdminGuard")>();
  return {
    ...original,
    AdminGuard: ({ children }: PropsWithChildren) => children,
  };
});

const completeInput: EditableOfferInput = {
  slug: "atlantic-surf-week",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "Siedem dni w Ericeirze.",
  shortDescription: "Poranne sesje, dobry surf house i kolacje po wodzie.",
  content: {
    paragraphs: ["Tekst o wyjeździe."],
    highlights: ["Dwie sesje dziennie"],
    included: ["Nocleg"],
    excluded: ["Lot"],
    schedule: [{ day: "Dzień 1", text: "Przyjazd." }],
  },
  location: "Ericeira, Portugalia",
  startDate: null,
  endDate: null,
  durationDays: 7,
  groupSizeMin: null,
  groupSizeMax: null,
  priceFrom: 3100,
  currency: "PLN",
  bookingUrl: "https://tripahead.example/atlantic-surf-week",
  heroImagePath: null,
};

const draftOffer: EditableOffer = {
  id: "a0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  ...completeInput,
  status: "draft",
};

const publishedOffer: EditableOffer = { ...draftOffer, status: "published" };
const readyHeroImagePath = "offers/atlantic-surf-week/hero.jpg";
const readyInput: EditableOfferInput = { ...completeInput, heroImagePath: readyHeroImagePath };
const readyDraftOffer: EditableOffer = { ...draftOffer, ...readyInput };
const readyPublishedOffer: EditableOffer = { ...readyDraftOffer, status: "published" };
const publishReadinessMessage = "Dodaj obraz główny z opisem alternatywnym przed publikacją.";

const createDeferred = <Value,>() => {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const expectInvalidationAfterStatusChange = (
  invalidateQueries: ReturnType<typeof vi.spyOn>,
  queryKey: string[],
) => {
  const statusCallOrder = mockedSetOfferStatus.mock.invocationCallOrder[0];
  const matchingInvalidationOrders = invalidateQueries.mock.calls.flatMap(([filters], index) =>
    JSON.stringify(filters.queryKey) === JSON.stringify(queryKey)
      ? [invalidateQueries.mock.invocationCallOrder[index]]
      : [],
  );

  expect(matchingInvalidationOrders.some((order) => order > statusCallOrder)).toBe(true);
};

const setValue = (label: string | RegExp, value: string) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

const fillEditor = async (value: EditableOfferInput) => {
  const user = userEvent.setup();
  setValue("Tytuł wyjazdu", value.title);
  setValue("Adres oferty", value.slug);
  setValue("Miejsce", value.location);
  setValue("Liczba dni", String(value.durationDays));
  setValue("Cena od", String(value.priceFrom));
  setValue("Krótki opis", value.shortDescription);
  setValue("Adres rezerwacji TripAhead", value.bookingUrl);

  await user.click(screen.getByRole("tab", { name: "O wyjeździe" }));
  setValue("Zdanie wprowadzające", value.subtitle);
  setValue("Akapity opisu 1", value.content.paragraphs[0]);
  setValue("Najlepsze momenty 1", value.content.highlights[0]);

  await user.click(screen.getByRole("tab", { name: "W cenie i poza" }));
  setValue("W cenie 1", value.content.included[0]);
  setValue("Poza ceną 1", value.content.excluded[0]);

  await user.click(screen.getByRole("tab", { name: "Dzień po dniu" }));
  setValue("Dzień 1 — nazwa", value.content.schedule[0].day);
  setValue("Dzień 1 — opis", value.content.schedule[0].text);
};

const renderAdminEditor = async ({
  slug,
  initialValue,
  waitForEditor = true,
}: {
  slug: string;
  initialValue?: EditableOfferInput;
  waitForEditor?: boolean;
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const rootRoute = createRootRoute();
  const EditorComponent = AdminEditorRoute.options.component as ComponentType;
  const editorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/$slug",
    component: EditorComponent,
  });
  const adminListRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([editorRoute, adminListRoute]),
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [`/admin/${slug}`] }),
  });

  await router.load();
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  if (waitForEditor) {
    await screen.findByText(slug === "new" ? "Nowa oferta" : /Oferta|tydzień/i);
  }
  if (initialValue) await fillEditor(initialValue);

  return { queryClient, router, ...rendered };
};

beforeEach(() => {
  mockedCanPublishOffer.mockResolvedValue(true);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("admin offer editor route", () => {
  it("disables publishing for an invalid local form without mutating", async () => {
    const user = userEvent.setup();
    mockedGetAdminOffer.mockResolvedValue(readyDraftOffer);
    await renderAdminEditor({ slug: readyDraftOffer.slug });
    const titleInput = screen.getByLabelText("Tytuł wyjazdu");

    await waitFor(() => expect(screen.getByRole("button", { name: "Opublikuj" })).toBeEnabled());
    await user.clear(titleInput);

    const publishButton = screen.getByRole("button", { name: "Opublikuj" });
    expect(publishButton).toBeDisabled();
    await user.click(publishButton);
    expect(mockedUpdateOffer).not.toHaveBeenCalled();
    expect(mockedSetOfferStatus).not.toHaveBeenCalled();
  });

  it("keeps publishing disabled for a complete but unsaved offer", async () => {
    const user = userEvent.setup();
    await renderAdminEditor({ slug: "new", initialValue: completeInput });

    const publishButton = screen.getByRole("button", { name: "Opublikuj" });
    expect(publishButton).toBeDisabled();
    await user.click(publishButton);
    expect(mockedCanPublishOffer).not.toHaveBeenCalled();
    expect(mockedCreateOffer).not.toHaveBeenCalled();
    expect(mockedSetOfferStatus).not.toHaveBeenCalled();
  });

  it("disables publishing and explains missing persisted hero readiness", async () => {
    const user = userEvent.setup();
    mockedGetAdminOffer.mockResolvedValue(readyDraftOffer);
    mockedCanPublishOffer.mockResolvedValue(false);

    await renderAdminEditor({ slug: readyDraftOffer.slug });

    expect(await screen.findByText(publishReadinessMessage)).toHaveAttribute("role", "alert");
    const publishButton = screen.getByRole("button", { name: "Opublikuj" });
    expect(publishButton).toBeDisabled();
    await user.click(publishButton);
    expect(mockedUpdateOffer).not.toHaveBeenCalled();
    expect(mockedSetOfferStatus).not.toHaveBeenCalled();
  });

  it("enables publishing for a complete persisted offer with ready hero metadata", async () => {
    mockedGetAdminOffer.mockResolvedValue(readyDraftOffer);

    await renderAdminEditor({ slug: readyDraftOffer.slug });

    await waitFor(() => expect(screen.getByRole("button", { name: "Opublikuj" })).toBeEnabled());
    expect(mockedCanPublishOffer).toHaveBeenCalledWith(readyDraftOffer.id);
  });

  it("saves a new draft, navigates to its slug, and leaves public caches untouched", async () => {
    const user = userEvent.setup();
    mockedCreateOffer.mockResolvedValue(draftOffer);
    mockedGetAdminOffer.mockResolvedValue(draftOffer);
    const { queryClient, router } = await renderAdminEditor({
      slug: "new",
      initialValue: completeInput,
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: "Zapisz szkic" }));

    await waitFor(() => expect(mockedCreateOffer).toHaveBeenCalled());
    expect(mockedCreateOffer.mock.calls[0]?.[0]).toEqual(completeInput);
    await waitFor(() => expect(router.state.location.pathname).toBe(`/admin/${draftOffer.slug}`));
    expect(mockedSetOfferStatus).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-offers"] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-offer", draftOffer.slug],
    });
    expect(invalidateQueries).not.toHaveBeenCalledWith({ queryKey: ["published-offers"] });
    expect(invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: ["published-offer", draftOffer.slug],
    });
  });

  it("preserves the specific readiness message when status publication is rejected", async () => {
    const user = userEvent.setup();
    mockedGetAdminOffer.mockResolvedValue(readyDraftOffer);
    mockedUpdateOffer.mockResolvedValue(readyDraftOffer);
    mockedSetOfferStatus.mockRejectedValue(new Error(publishReadinessMessage));
    await renderAdminEditor({ slug: readyDraftOffer.slug });

    await waitFor(() => expect(screen.getByRole("button", { name: "Opublikuj" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Opublikuj" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(publishReadinessMessage);
    expect(screen.getByRole("alert")).not.toHaveTextContent("Nie udało się opublikować oferty");
    expect(mockedSetOfferStatus).toHaveBeenCalledWith(readyDraftOffer.id, "published");
  });

  it("updates an existing draft before publishing it", async () => {
    const user = userEvent.setup();
    mockedGetAdminOffer.mockResolvedValue(readyDraftOffer);
    mockedUpdateOffer.mockResolvedValue(readyDraftOffer);
    mockedSetOfferStatus.mockResolvedValue(readyPublishedOffer);
    const { queryClient } = await renderAdminEditor({ slug: readyDraftOffer.slug });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    await waitFor(() => expect(screen.getByRole("button", { name: "Opublikuj" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Opublikuj" }));

    await waitFor(() =>
      expect(mockedSetOfferStatus).toHaveBeenCalledWith(readyDraftOffer.id, "published"),
    );
    expect(mockedUpdateOffer).toHaveBeenCalledWith(readyDraftOffer.id, readyInput);
    expect(mockedCreateOffer).not.toHaveBeenCalled();
    expect(mockedUpdateOffer.mock.invocationCallOrder[0]).toBeLessThan(
      mockedSetOfferStatus.mock.invocationCallOrder[0],
    );
    expectInvalidationAfterStatusChange(invalidateQueries, ["admin-offers"]);
    expectInvalidationAfterStatusChange(invalidateQueries, [
      "admin-offer",
      readyPublishedOffer.slug,
    ]);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["published-offers"] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["published-offer", readyPublishedOffer.slug],
    });
  });

  it("unpublishes an existing offer and invalidates public caches", async () => {
    const user = userEvent.setup();
    mockedGetAdminOffer.mockResolvedValue(publishedOffer);
    mockedSetOfferStatus.mockResolvedValue(draftOffer);
    const { queryClient } = await renderAdminEditor({ slug: publishedOffer.slug });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: "Cofnij publikację" }));

    await waitFor(() =>
      expect(mockedSetOfferStatus).toHaveBeenCalledWith(publishedOffer.id, "draft"),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["admin-offers"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["published-offers"] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["published-offer", publishedOffer.slug],
    });
  });

  it("keeps edited values and releases every action after a save error", async () => {
    const user = userEvent.setup();
    mockedGetAdminOffer.mockResolvedValue(draftOffer);
    mockedUpdateOffer.mockRejectedValue(new Error("raw backend details"));
    await renderAdminEditor({ slug: draftOffer.slug });
    const titleInput = screen.getByLabelText("Tytuł wyjazdu");

    await user.clear(titleInput);
    await user.type(titleInput, "Zmieniony tytuł wyjazdu");
    await user.click(screen.getByRole("button", { name: "Zapisz szkic" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się zapisać oferty");
    expect(screen.getByRole("alert")).not.toHaveTextContent("raw backend details");
    expect(titleInput).toHaveValue("Zmieniony tytuł wyjazdu");
    await waitFor(() => expect(screen.getByRole("button", { name: "Zapisz szkic" })).toBeEnabled());
    expect(screen.getByRole("button", { name: "Opublikuj" })).toBeEnabled();
  });

  it("blocks every editor action while one mutation is pending", async () => {
    const user = userEvent.setup();
    const deferredUpdate = createDeferred<EditableOffer>();
    mockedGetAdminOffer.mockResolvedValue(draftOffer);
    mockedUpdateOffer.mockReturnValue(deferredUpdate.promise);
    await renderAdminEditor({ slug: draftOffer.slug });

    await user.click(screen.getByRole("button", { name: "Zapisz szkic" }));

    await waitFor(() => expect(mockedUpdateOffer).toHaveBeenCalled());
    expect(screen.getByLabelText("Tytuł wyjazdu")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zapisz szkic" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Opublikuj" })).toBeDisabled();

    deferredUpdate.resolve(draftOffer);
    await waitFor(() => expect(screen.getByRole("button", { name: "Zapisz szkic" })).toBeEnabled());
  });

  it("navigates to the returned slug and queries the new route key after editing a slug", async () => {
    const user = userEvent.setup();
    const renamedInput = { ...completeInput, slug: "nowy-atlantic-surf-week" };
    const renamedOffer = { ...draftOffer, ...renamedInput };
    mockedGetAdminOffer.mockImplementation(async (requestedSlug) =>
      requestedSlug === renamedOffer.slug ? renamedOffer : draftOffer,
    );
    mockedUpdateOffer.mockResolvedValue(renamedOffer);
    const { queryClient, router } = await renderAdminEditor({ slug: draftOffer.slug });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    const slugInput = screen.getByLabelText("Adres oferty");
    await user.clear(slugInput);
    await user.type(slugInput, renamedInput.slug);
    await user.click(screen.getByRole("button", { name: "Zapisz szkic" }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/admin/${renamedOffer.slug}`));
    await waitFor(() => expect(mockedGetAdminOffer).toHaveBeenCalledWith(renamedOffer.slug));
    expect(mockedUpdateOffer).toHaveBeenCalledWith(draftOffer.id, renamedInput);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-offer", draftOffer.slug],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin-offer", renamedOffer.slug],
    });
  });

  it("renders a not-found state when the persisted offer does not exist", async () => {
    mockedGetAdminOffer.mockResolvedValue(null);

    await renderAdminEditor({ slug: "missing-offer", waitForEditor: false });

    expect(await screen.findByText("Nie znaleziono tej oferty.")).toHaveAttribute("role", "status");
    expect(screen.queryByLabelText("Tytuł wyjazdu")).not.toBeInTheDocument();
  });
});
