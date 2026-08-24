import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImageCleanupPendingError } from "@/lib/images/repository";
import type { OfferImage } from "@/lib/offers/types";

import { OfferImageManager } from "./OfferImageManager";

const {
  mockedDeleteOfferImage,
  mockedListOfferImages,
  mockedReorderOfferImages,
  mockedRetryOfferImageObjectCleanup,
  mockedSetOfferHeroImage,
  mockedUploadOfferImage,
} = vi.hoisted(() => ({
  mockedDeleteOfferImage: vi.fn(),
  mockedListOfferImages: vi.fn(),
  mockedReorderOfferImages: vi.fn(),
  mockedRetryOfferImageObjectCleanup: vi.fn(),
  mockedSetOfferHeroImage: vi.fn(),
  mockedUploadOfferImage: vi.fn(),
}));

vi.mock("@/lib/images/repository", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/images/repository")>();
  return {
    ...original,
    deleteOfferImage: mockedDeleteOfferImage,
    listOfferImages: mockedListOfferImages,
    reorderOfferImages: mockedReorderOfferImages,
    retryOfferImageObjectCleanup: mockedRetryOfferImageObjectCleanup,
    setOfferHeroImage: mockedSetOfferHeroImage,
    uploadOfferImage: mockedUploadOfferImage,
  };
});

const offerId = "a0f8e810-1df3-42d9-90df-2a1a69ad9a2c";
const jpegFile = new File(["image"], "surfer.jpeg", { type: "image/jpeg" });
const secondJpegFile = new File(["image two"], "surfer-two.jpeg", { type: "image/jpeg" });
const imageOne: OfferImage = {
  id: "b0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  path: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/b0f8e810-1df3-42d9-90df-2a1a69ad9a2c.jpeg",
  alt: "Surfer płynie po porannej fali.",
  position: 0,
  signedUrl: "https://example.test/private-image-one",
};
const imageTwo: OfferImage = {
  id: "c0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  path: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/c0f8e810-1df3-42d9-90df-2a1a69ad9a2c.jpeg",
  alt: "Deski stoją przy surf housie.",
  position: 1,
  signedUrl: "https://example.test/private-image-two",
};

const createDeferred = <Value,>() => {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const renderManager = (heroImagePath: string | null = null) => {
  const onHeroChanged = vi.fn();
  const onImagesChanged = vi.fn();
  render(
    <OfferImageManager
      offerId={offerId}
      heroImagePath={heroImagePath}
      disabled={false}
      onHeroChanged={onHeroChanged}
      onImagesChanged={onImagesChanged}
    />,
  );
  return { onHeroChanged, onImagesChanged };
};

beforeEach(() => {
  mockedListOfferImages.mockResolvedValue([]);
  mockedDeleteOfferImage.mockResolvedValue(undefined);
  mockedReorderOfferImages.mockResolvedValue(undefined);
  mockedRetryOfferImageObjectCleanup.mockResolvedValue(undefined);
  mockedSetOfferHeroImage.mockResolvedValue(undefined);
  mockedUploadOfferImage.mockResolvedValue(imageOne);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OfferImageManager", () => {
  it("does not start upload without a valid alternative text and announces it", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.upload(screen.getByLabelText("Wybierz plik obrazu"), jpegFile);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Opis alternatywny");
    expect(mockedUploadOfferImage).not.toHaveBeenCalled();
  });

  it("labels the required alternative text and explains its Polish length requirement", () => {
    renderManager();

    expect(screen.getByLabelText("Opis alternatywny (wymagany)")).toBeInTheDocument();
    expect(
      screen.getByText("Opisz krótko, co przedstawia zdjęcie; od 5 do 180 znaków."),
    ).toBeInTheDocument();
  });

  it("uploads a valid file and alternative text", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValueOnce([]).mockResolvedValueOnce([imageOne]);
    renderManager();

    await user.upload(screen.getByLabelText("Wybierz plik obrazu"), jpegFile);
    await user.type(screen.getByLabelText("Opis alternatywny (wymagany)"), imageOne.alt);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));

    await waitFor(() =>
      expect(mockedUploadOfferImage).toHaveBeenCalledWith(offerId, jpegFile, imageOne.alt, 0),
    );
    expect(screen.getByLabelText("Opis alternatywny (wymagany)")).toHaveValue("");
  });

  it("keeps the refreshed gallery when a stale initial load resolves after upload", async () => {
    const user = userEvent.setup();
    const initialLoad = createDeferred<OfferImage[]>();
    mockedListOfferImages
      .mockReturnValueOnce(initialLoad.promise)
      .mockResolvedValueOnce([imageOne])
      .mockResolvedValueOnce([imageOne, imageTwo]);
    mockedUploadOfferImage.mockResolvedValueOnce(imageOne).mockResolvedValueOnce(imageTwo);
    renderManager();

    await user.upload(screen.getByLabelText("Wybierz plik obrazu"), jpegFile);
    await user.type(screen.getByLabelText("Opis alternatywny (wymagany)"), imageOne.alt);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));
    await screen.findByText(imageOne.alt);

    initialLoad.resolve([
      imageTwo,
      { ...imageTwo, id: "d0f8e810-1df3-42d9-90df-2a1a69ad9a2c", position: 2 },
    ]);
    await waitFor(() => expect(screen.getByText(imageOne.alt)).toBeInTheDocument());

    await user.upload(screen.getByLabelText("Wybierz plik obrazu"), secondJpegFile);
    await user.type(screen.getByLabelText("Opis alternatywny (wymagany)"), imageTwo.alt);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));

    await waitFor(() =>
      expect(mockedUploadOfferImage).toHaveBeenLastCalledWith(
        offerId,
        secondJpegFile,
        imageTwo.alt,
        1,
      ),
    );
  });

  it("uses an empty alt for a private thumbnail and presents its description alongside it", async () => {
    mockedListOfferImages.mockResolvedValue([imageOne]);
    renderManager();

    const thumbnail = await waitFor(() => {
      const image = document.querySelector("img");
      expect(image).not.toBeNull();
      return image!;
    });
    expect(thumbnail).toHaveAttribute("alt", "");
    expect(screen.getByText(imageOne.alt)).toBeInTheDocument();
  });

  it("selects a gallery image as the hero", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValue([imageOne]);
    const { onHeroChanged } = renderManager();

    await user.click(await screen.findByRole("button", { name: "Ustaw jako obraz główny" }));

    await waitFor(() => expect(mockedSetOfferHeroImage).toHaveBeenCalledWith(offerId, imageOne.id));
    expect(onHeroChanged).toHaveBeenCalledWith(imageOne.path);
  });

  it("does not remove the current hero before another image is selected", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValue([imageOne]);
    renderManager(imageOne.path);

    await user.click(await screen.findByRole("button", { name: "Usuń zdjęcie" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Najpierw wybierz inny obraz główny");
    expect(mockedDeleteOfferImage).not.toHaveBeenCalled();
  });

  it("moves an image by sending the complete reordered id permutation", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValue([imageOne, imageTwo]);
    renderManager();

    const cards = await screen.findAllByRole("listitem");
    expect(within(cards[0]!).getByRole("button", { name: "Przesuń wyżej" })).toBeDisabled();
    expect(within(cards[1]!).getByRole("button", { name: "Przesuń niżej" })).toBeDisabled();

    await user.click(within(cards[1]!).getByRole("button", { name: "Przesuń wyżej" }));

    await waitFor(() =>
      expect(mockedReorderOfferImages).toHaveBeenCalledWith(offerId, [imageTwo.id, imageOne.id]),
    );
  });

  it("offers an object-cleanup retry without exposing its private path", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValue([imageOne]);
    mockedDeleteOfferImage.mockRejectedValue(new ImageCleanupPendingError(imageOne.path));
    renderManager();

    await user.click(await screen.findByRole("button", { name: "Usuń zdjęcie" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Usuń zdjęcie" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("wymaga ponowienia");
    expect(screen.getByRole("button", { name: "Ponów usunięcie pliku" })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(imageOne.path);

    await user.click(screen.getByRole("button", { name: "Ponów usunięcie pliku" }));
    await waitFor(() =>
      expect(mockedRetryOfferImageObjectCleanup).toHaveBeenCalledWith(imageOne.path),
    );
  });
});
