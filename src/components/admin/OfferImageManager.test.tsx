import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImageCleanupPendingError, ImageRepositoryError } from "@/lib/images/repository";
import type { OfferImage } from "@/lib/offers/types";

import { OfferImageManager } from "./OfferImageManager";

const {
  mockedDeleteOfferImage,
  mockedListOfferImages,
  mockedReorderOfferImages,
  mockedRetryOfferImageObjectCleanup,
  mockedSetOfferHeroImage,
  mockedSetOfferImageInStory,
  mockedUploadOfferImage,
} = vi.hoisted(() => ({
  mockedDeleteOfferImage: vi.fn(),
  mockedListOfferImages: vi.fn(),
  mockedReorderOfferImages: vi.fn(),
  mockedRetryOfferImageObjectCleanup: vi.fn(),
  mockedSetOfferHeroImage: vi.fn(),
  mockedSetOfferImageInStory: vi.fn(),
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
    setOfferImageInStory: mockedSetOfferImageInStory,
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
  category: "gallery",
  signedUrl: "https://example.test/private-image-one",
};
const imageTwo: OfferImage = {
  id: "c0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  path: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/c0f8e810-1df3-42d9-90df-2a1a69ad9a2c.jpeg",
  alt: "Deski stoją przy surf housie.",
  position: 1,
  category: "gallery",
  signedUrl: "https://example.test/private-image-two",
};
const imageThree: OfferImage = {
  id: "d0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
  path: "offers/a0f8e810-1df3-42d9-90df-2a1a69ad9a2c/d0f8e810-1df3-42d9-90df-2a1a69ad9a2c.jpeg",
  alt: "Instruktor obserwuje trzecią falę.",
  position: 2,
  category: "gallery",
  signedUrl: "https://example.test/private-image-three",
};

const createDeferred = <Value,>() => {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const renderManager = (
  heroImagePath: string | null = null,
  category: OfferImage["category"] = "gallery",
) => {
  const onHeroChanged = vi.fn();
  const onImagesChanged = vi.fn();
  render(
    <OfferImageManager
      offerId={offerId}
      heroImagePath={heroImagePath}
      disabled={false}
      category={category}
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
  mockedSetOfferImageInStory.mockResolvedValue(undefined);
  mockedUploadOfferImage.mockResolvedValue(imageOne);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OfferImageManager", () => {
  it("preserves a safe upload error and selected inputs so the user can retry", async () => {
    mockedUploadOfferImage.mockRejectedValueOnce(
      new ImageRepositoryError(
        "Nie udało się przygotować zdjęcia. Wybierz inny plik JPG, PNG lub WebP.",
      ),
    );
    const user = userEvent.setup();
    renderManager();
    const file = screen.getByLabelText("Wybierz plik obrazu");
    const alt = screen.getByLabelText("Opis alternatywny (wymagany)");
    await waitFor(() => expect(file).toBeEnabled());
    await user.upload(file, jpegFile);
    await user.type(alt, imageOne.alt);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wybierz inny plik JPG, PNG lub WebP",
    );
    expect(alt).toHaveValue(imageOne.alt);
    expect((file as HTMLInputElement).files?.[0]).toBe(jpegFile);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));
    await waitFor(() => expect(alt).toHaveValue(""));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables both fields and prevents duplicate submissions while upload is pending", async () => {
    const pending = createDeferred<OfferImage>();
    mockedUploadOfferImage.mockReturnValueOnce(pending.promise);
    const user = userEvent.setup();
    renderManager();
    const file = screen.getByLabelText("Wybierz plik obrazu");
    const alt = screen.getByLabelText("Opis alternatywny (wymagany)");
    await waitFor(() => expect(file).toBeEnabled());
    await user.upload(file, jpegFile);
    await user.type(alt, imageOne.alt);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));
    expect(file).toBeDisabled();
    expect(alt).toBeDisabled();
    const button = screen.getByRole("button", { name: "Dodawanie zdjęcia…" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(mockedUploadOfferImage).toHaveBeenCalledOnce();
    pending.resolve(imageOne);
    await waitFor(() => expect(alt).toBeEnabled());
    expect(alt).toHaveValue("");
  });

  it.each(["gallery", "accommodation", "resort_map"] as const)(
    "announces an oversized file immediately in the %s uploader and keeps the error while editing alt",
    async (category) => {
      const user = userEvent.setup();
      renderManager(null, category);
      const input = screen.getByLabelText("Wybierz plik obrazu");
      await waitFor(() => expect(input).toBeEnabled());
      await user.upload(
        input,
        new File([new Uint8Array(8 * 1024 * 1024 + 1)], "duze.jpg", { type: "image/jpeg" }),
      );
      expect(screen.getByRole("alert")).toHaveTextContent(/za duży.*8 MiB/);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription(/za duży.*8 MiB/);
      await user.type(screen.getByLabelText("Opis alternatywny (wymagany)"), imageOne.alt);
      expect(screen.getByRole("alert")).toHaveTextContent("8 MiB");
      await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));
      expect(input).toHaveFocus();
      expect(mockedUploadOfferImage).not.toHaveBeenCalled();
      await user.upload(input, jpegFile);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));
      await waitFor(() =>
        expect(screen.getByLabelText("Opis alternatywny (wymagany)")).toHaveValue(""),
      );
      expect((input as HTMLInputElement).files).toHaveLength(0);
      expect(mockedUploadOfferImage).toHaveBeenCalledOnce();
      expect(mockedUploadOfferImage.mock.calls[0]).toEqual(
        category === "gallery"
          ? [offerId, jpegFile, imageOne.alt, 0]
          : [offerId, jpegFile, imageOne.alt, 0, category],
      );
    },
  );

  it.each([
    ["animacja.gif", "image/gif", /format.*JPG.*PNG.*WebP/i],
    ["zdjecie.heic", "image/jpeg", /rozszerzenie.*JPG.*PNG.*WebP/i],
    ["zdjecie.png", "image/jpeg", /nie pasuje.*JPEG/i],
  ])("explains the reason for rejecting %s before upload", async (name, type, message) => {
    const user = userEvent.setup({ applyAccept: false });
    renderManager();
    const input = screen.getByLabelText("Wybierz plik obrazu");
    await waitFor(() => expect(input).toBeEnabled());
    await user.upload(input, new File(["image"], name as string, { type: type as string }));
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(mockedUploadOfferImage).not.toHaveBeenCalled();
  });

  it("associates missing-file and alt errors with their fields and corrects them independently", async () => {
    const user = userEvent.setup();
    renderManager();
    const file = screen.getByLabelText("Wybierz plik obrazu");
    const alt = screen.getByLabelText("Opis alternatywny (wymagany)");
    await waitFor(() => expect(file).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));
    expect(file).toHaveAccessibleDescription(/Wybierz plik obrazu/);
    expect(alt).toHaveAccessibleDescription(/od 5 do 180 znaków/);
    expect(alt).toHaveAttribute("aria-invalid", "true");
    await user.upload(file, jpegFile);
    expect(file).toHaveAttribute("aria-invalid", "false");
    expect(alt).toHaveAttribute("aria-invalid", "true");
    await user.type(alt, "   a   ");
    expect(alt).toHaveAttribute("aria-invalid", "true");
    await user.clear(alt);
    await user.type(alt, imageOne.alt);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps labels unique when multiple uploaders of the same category are mounted", async () => {
    renderManager();
    renderManager();
    const files = screen.getAllByLabelText("Wybierz plik obrazu");
    const alts = screen.getAllByLabelText("Opis alternatywny (wymagany)");
    expect(files).toHaveLength(2);
    expect(alts).toHaveLength(2);
    expect(new Set([...files, ...alts].map((input) => input.id)).size).toBe(4);
  });

  it("allows selecting a gallery image for the description", async () => {
    mockedListOfferImages
      .mockResolvedValueOnce([imageOne])
      .mockResolvedValue([{ ...imageOne, showInStory: true }]);
    const user = userEvent.setup();
    renderManager();
    await user.click(
      await screen.findByRole("button", { name: `Zdjęcie przy opisie: ${imageOne.alt}` }),
    );
    expect(mockedSetOfferImageInStory).toHaveBeenCalledWith(offerId, imageOne.id, true);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: `Zdjęcie przy opisie: ${imageOne.alt}` }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
  });

  it("prevents selecting a fourth image while allowing deselection", async () => {
    mockedListOfferImages.mockResolvedValue([
      ...[imageOne, imageTwo, imageThree].map((image) => ({ ...image, showInStory: true })),
      {
        ...imageThree,
        id: "e0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
        alt: "Czwarte zdjęcie w galerii",
      },
    ]);
    renderManager();
    expect(
      await screen.findByRole("button", { name: "Zdjęcie przy opisie: Czwarte zdjęcie w galerii" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: `Zdjęcie przy opisie: ${imageOne.alt}` }),
    ).toBeEnabled();
  });
  it("does not start upload without a valid alternative text and announces it", async () => {
    const user = userEvent.setup();
    renderManager();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Dodaj zdjęcie" })).toBeEnabled(),
    );
    await user.upload(screen.getByLabelText("Wybierz plik obrazu"), jpegFile);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Opis alternatywny");
    expect(mockedUploadOfferImage).not.toHaveBeenCalled();
  });

  it("labels the required alternative text and explains its Polish length requirement", () => {
    renderManager();

    expect(screen.getByLabelText("Opis alternatywny (wymagany)")).toBeRequired();
    expect(
      screen.getByText("Opisz krótko, co przedstawia zdjęcie; od 5 do 180 znaków."),
    ).toBeInTheDocument();
  });

  it("uploads a valid file and alternative text", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValueOnce([]).mockResolvedValueOnce([imageOne]);
    const { onImagesChanged } = renderManager();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Dodaj zdjęcie" })).toBeEnabled(),
    );

    await user.upload(screen.getByLabelText("Wybierz plik obrazu"), jpegFile);
    await user.type(screen.getByLabelText("Opis alternatywny (wymagany)"), imageOne.alt);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));

    await waitFor(() =>
      expect(mockedUploadOfferImage).toHaveBeenCalledWith(offerId, jpegFile, imageOne.alt, 0),
    );
    await waitFor(() => expect(onImagesChanged).toHaveBeenCalledOnce());
    expect(screen.getByLabelText("Opis alternatywny (wymagany)")).toHaveValue("");
  });

  it("disables upload until the authoritative gallery load resolves", async () => {
    const initialLoad = createDeferred<OfferImage[]>();
    mockedListOfferImages.mockReturnValueOnce(initialLoad.promise);
    renderManager();

    expect(screen.getByLabelText("Wybierz plik obrazu")).toBeDisabled();
    expect(screen.getByLabelText("Opis alternatywny (wymagany)")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dodaj zdjęcie" })).toBeDisabled();

    initialLoad.resolve([imageOne]);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Dodaj zdjęcie" })).toBeEnabled(),
    );
  });

  it("uses the maximum persisted position plus one after deleting a middle image", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValueOnce([imageOne, imageTwo, imageThree]);
    mockedUploadOfferImage.mockResolvedValue({ ...imageTwo, position: 3 });
    const { onImagesChanged } = renderManager();

    const cards = await screen.findAllByRole("listitem");
    await user.click(
      within(cards[1]!).getByRole("button", { name: `Usuń zdjęcie: ${imageTwo.alt}` }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Usuń zdjęcie" }));
    await waitFor(() => expect(mockedDeleteOfferImage).toHaveBeenCalledWith(imageTwo.id));

    await user.upload(screen.getByLabelText("Wybierz plik obrazu"), secondJpegFile);
    await user.type(screen.getByLabelText("Opis alternatywny (wymagany)"), imageTwo.alt);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));

    await waitFor(() =>
      expect(mockedUploadOfferImage).toHaveBeenCalledWith(offerId, secondJpegFile, imageTwo.alt, 3),
    );
    expect(onImagesChanged).toHaveBeenCalledTimes(2);
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
    const { onHeroChanged, onImagesChanged } = renderManager();

    await user.click(
      await screen.findByRole("button", {
        name: `Ustaw jako obraz główny: ${imageOne.alt}`,
      }),
    );

    await waitFor(() => expect(mockedSetOfferHeroImage).toHaveBeenCalledWith(offerId, imageOne.id));
    expect(onHeroChanged).toHaveBeenCalledWith(imageOne.path);
    expect(onImagesChanged).toHaveBeenCalledOnce();
  });

  it("keeps accommodation images separate and never offers them as a hero", async () => {
    const user = userEvent.setup();
    const accommodationImage = {
      ...imageOne,
      id: "e0f8e810-1df3-42d9-90df-2a1a69ad9a2c",
      alt: "Apartament z widokiem na ocean.",
      category: "accommodation" as const,
    };
    mockedListOfferImages.mockResolvedValue([imageOne, accommodationImage]);
    mockedUploadOfferImage.mockResolvedValue(accommodationImage);
    renderManager(null, "accommodation");

    expect(await screen.findByText(accommodationImage.alt)).toBeInTheDocument();
    expect(screen.queryByText(imageOne.alt)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: `Ustaw jako obraz główny: ${accommodationImage.alt}` }),
    ).not.toBeInTheDocument();

    await user.upload(screen.getByLabelText("Wybierz plik obrazu"), jpegFile);
    await user.type(screen.getByLabelText("Opis alternatywny (wymagany)"), accommodationImage.alt);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));
    await waitFor(() =>
      expect(mockedUploadOfferImage).toHaveBeenCalledWith(
        offerId,
        jpegFile,
        accommodationImage.alt,
        1,
        "accommodation",
      ),
    );
  });

  it("does not remove the current hero before another image is selected", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValue([imageOne]);
    renderManager(imageOne.path);

    await user.click(await screen.findByRole("button", { name: `Usuń zdjęcie: ${imageOne.alt}` }));

    expect(screen.getByRole("alert")).toHaveTextContent("Najpierw wybierz inny obraz główny");
    expect(mockedDeleteOfferImage).not.toHaveBeenCalled();
  });

  it("moves an image by sending the complete reordered id permutation", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValue([imageOne, imageTwo]);
    const { onImagesChanged } = renderManager();

    const cards = await screen.findAllByRole("listitem");
    expect(
      within(cards[0]!).getByRole("button", { name: `Przesuń wyżej: ${imageOne.alt}` }),
    ).toBeDisabled();
    expect(
      within(cards[1]!).getByRole("button", { name: `Przesuń niżej: ${imageTwo.alt}` }),
    ).toBeDisabled();

    await user.click(
      within(cards[1]!).getByRole("button", { name: `Przesuń wyżej: ${imageTwo.alt}` }),
    );

    await waitFor(() =>
      expect(mockedReorderOfferImages).toHaveBeenCalledWith(offerId, [imageTwo.id, imageOne.id]),
    );
    expect(onImagesChanged).toHaveBeenCalledOnce();
  });

  it("does not invite a duplicate upload when only gallery refresh fails", async () => {
    const user = userEvent.setup();
    mockedListOfferImages
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("refresh unavailable"));
    const { onImagesChanged } = renderManager();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Dodaj zdjęcie" })).toBeEnabled(),
    );

    await user.upload(screen.getByLabelText("Wybierz plik obrazu"), jpegFile);
    await user.type(screen.getByLabelText("Opis alternatywny (wymagany)"), imageOne.alt);
    await user.click(screen.getByRole("button", { name: "Dodaj zdjęcie" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("została zapisana");
    expect(alert).not.toHaveTextContent("Spróbuj ponownie");
    expect(mockedUploadOfferImage).toHaveBeenCalledOnce();
    expect(onImagesChanged).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Opis alternatywny (wymagany)")).toHaveValue("");
  });

  it("keeps a successful deletion when cache synchronization fails", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValue([imageOne]);
    const { onImagesChanged } = renderManager();
    onImagesChanged.mockRejectedValue(new Error("cache unavailable"));

    await user.click(await screen.findByRole("button", { name: `Usuń zdjęcie: ${imageOne.alt}` }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Usuń zdjęcie" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("została zapisana");
    expect(alert).not.toHaveTextContent("Spróbuj ponownie");
    expect(screen.queryByText(imageOne.alt)).not.toBeInTheDocument();
    expect(mockedDeleteOfferImage).toHaveBeenCalledOnce();
    expect(onImagesChanged).toHaveBeenCalledOnce();
  });

  it("offers an object-cleanup retry without exposing its private path", async () => {
    const user = userEvent.setup();
    mockedListOfferImages.mockResolvedValue([imageOne]);
    mockedDeleteOfferImage.mockRejectedValue(new ImageCleanupPendingError(imageOne.path));
    renderManager();

    await user.click(await screen.findByRole("button", { name: `Usuń zdjęcie: ${imageOne.alt}` }));
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
