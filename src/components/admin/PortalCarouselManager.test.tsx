import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockedRepository = vi.hoisted(() => ({
  listAdminPortalCarouselImages: vi.fn(),
  savePortalCarouselImages: vi.fn(),
}));

vi.mock("@/lib/portal-carousel/repository", () => mockedRepository);

import { PortalCarouselManager } from "./PortalCarouselManager";

const hero = {
  path: "carousel/hero-surf.jpg",
  src: "/src/assets/carousel/hero-surf.jpg",
  label: "hero surf",
};
const winter = {
  path: "carousel/obozy-zima.jpg",
  src: "/src/assets/carousel/obozy-zima.jpg",
  label: "obozy zima",
};

beforeEach(() => {
  mockedRepository.listAdminPortalCarouselImages.mockResolvedValue([hero]);
  mockedRepository.savePortalCarouselImages.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("PortalCarouselManager", () => {
  it("adds a selection and saves its explicit order", async () => {
    const user = userEvent.setup();
    render(<PortalCarouselManager />);

    await user.click(await screen.findByRole("checkbox", { name: /obozy zima/i }));
    expect(mockedRepository.savePortalCarouselImages).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /zapisz karuzelę/i }));

    await waitFor(() =>
      expect(mockedRepository.savePortalCarouselImages).toHaveBeenCalledWith([
        "carousel/hero-surf.jpg",
        "carousel/obozy-zima.jpg",
      ]),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Karuzela została zapisana.");
  });

  it("moves the second selected image upward before saving", async () => {
    mockedRepository.listAdminPortalCarouselImages.mockResolvedValue([hero, winter]);
    const user = userEvent.setup();
    render(<PortalCarouselManager />);

    await user.click(await screen.findByRole("button", { name: /przenieś wyżej: obozy zima/i }));
    await user.click(screen.getByRole("button", { name: /zapisz karuzelę/i }));

    await waitFor(() =>
      expect(mockedRepository.savePortalCarouselImages).toHaveBeenCalledWith([
        "carousel/obozy-zima.jpg",
        "carousel/hero-surf.jpg",
      ]),
    );
  });

  it("removes an unchecked image from the saved selection", async () => {
    mockedRepository.listAdminPortalCarouselImages.mockResolvedValue([hero, winter]);
    const user = userEvent.setup();
    render(<PortalCarouselManager />);

    await user.click(await screen.findByRole("checkbox", { name: "hero surf" }));
    await user.click(screen.getByRole("button", { name: /zapisz karuzelę/i }));

    await waitFor(() =>
      expect(mockedRepository.savePortalCarouselImages).toHaveBeenCalledWith([
        "carousel/obozy-zima.jpg",
      ]),
    );
    expect(screen.queryByRole("listitem", { name: "hero surf" })).not.toBeInTheDocument();
  });

  it("disables controls that would move an image past either boundary", async () => {
    mockedRepository.listAdminPortalCarouselImages.mockResolvedValue([hero, winter]);
    render(<PortalCarouselManager />);

    const selectedList = await screen.findByRole("list", { name: /wybrane zdjęcia/i });
    const selectedItems = within(selectedList).getAllByRole("listitem");

    expect(
      within(selectedItems[0]!).getByRole("button", { name: /przenieś wyżej: hero surf/i }),
    ).toBeDisabled();
    expect(
      within(selectedItems[0]!).getByRole("button", { name: /przenieś niżej: hero surf/i }),
    ).toBeEnabled();
    expect(
      within(selectedItems[1]!).getByRole("button", { name: /przenieś wyżej: obozy zima/i }),
    ).toBeEnabled();
    expect(
      within(selectedItems[1]!).getByRole("button", { name: /przenieś niżej: obozy zima/i }),
    ).toBeDisabled();
  });

  it("shows a safe Polish error when saving fails", async () => {
    mockedRepository.savePortalCarouselImages.mockRejectedValue(
      new Error("service_role database details"),
    );
    const user = userEvent.setup();
    render(<PortalCarouselManager />);

    await screen.findByRole("checkbox", { name: "hero surf" });
    await user.click(screen.getByRole("button", { name: /zapisz karuzelę/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się zapisać karuzeli. Spróbuj ponownie.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("service_role database details");
  });

  it("keeps an empty selection editable after a failed save", async () => {
    mockedRepository.listAdminPortalCarouselImages.mockResolvedValue([]);
    mockedRepository.savePortalCarouselImages.mockRejectedValue(new Error("network details"));
    const user = userEvent.setup();
    render(<PortalCarouselManager />);

    const saveButton = await screen.findByRole("button", { name: /zapisz karuzelę/i });
    await user.click(saveButton);

    await screen.findByRole("alert");
    expect(saveButton).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "hero surf" })).toBeEnabled();
  });
});
