import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import type { OfferImage } from "@/lib/offers/types";
import { OfferGallery } from "./OfferGallery";

const makeImage = (alt: string, index: number): OfferImage => ({
  id: `photo-${index}`,
  path: `${index}.webp`,
  alt,
  position: index,
  category: "gallery",
  signedUrl: `https://example.test/${index}.webp`,
});
const images: [OfferImage, OfferImage, OfferImage] = [
  makeImage("Plaża", 0),
  makeImage("Dom", 1),
  makeImage("Góry", 2),
];

afterEach(cleanup);

describe("OfferGallery", () => {
  it("navigates and loops with horizontal swipes on the enlarged photo", async () => {
    const user = userEvent.setup();
    render(<OfferGallery images={images} />);
    await user.click(screen.getByRole("button", { name: "Powiększ zdjęcie: Plaża" }));
    const photo = within(screen.getByRole("dialog")).getByRole("img", { name: "Plaża" });
    fireEvent.touchStart(photo, {
      touches: [{ identifier: 1, clientX: 200, clientY: 100 }],
      changedTouches: [{ identifier: 1, clientX: 200, clientY: 100 }],
    });
    fireEvent.touchEnd(photo, {
      touches: [],
      changedTouches: [{ identifier: 1, clientX: 100, clientY: 100 }],
    });
    expect(within(screen.getByRole("dialog")).getByRole("img", { name: "Dom" })).toBeVisible();
    const nextPhoto = within(screen.getByRole("dialog")).getByRole("img", { name: "Dom" });
    fireEvent.touchStart(nextPhoto, {
      touches: [{ identifier: 2, clientX: 100, clientY: 100 }],
      changedTouches: [{ identifier: 2, clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(nextPhoto, {
      touches: [],
      changedTouches: [{ identifier: 2, clientX: 200, clientY: 100 }],
    });
    expect(within(screen.getByRole("dialog")).getByRole("img", { name: "Plaża" })).toBeVisible();
    fireEvent.touchStart(photo, {
      touches: [{ identifier: 3, clientX: 100, clientY: 100 }],
      changedTouches: [{ identifier: 3, clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(photo, {
      touches: [],
      changedTouches: [{ identifier: 3, clientX: 200, clientY: 100 }],
    });
    expect(within(screen.getByRole("dialog")).getByRole("img", { name: "Góry" })).toBeVisible();
  });

  it("ignores taps, short movements and predominantly vertical gestures", async () => {
    const user = userEvent.setup();
    render(<OfferGallery images={images} />);
    await user.click(screen.getByRole("button", { name: "Powiększ zdjęcie: Plaża" }));
    const photo = within(screen.getByRole("dialog")).getByRole("img", { name: "Plaża" });
    const start = { identifier: 1, clientX: 100, clientY: 100 };
    for (const end of [
      start,
      { ...start, clientX: 130 },
      { ...start, clientX: 160, clientY: 190 },
    ]) {
      fireEvent.touchStart(photo, { touches: [start], changedTouches: [start] });
      fireEvent.touchEnd(photo, { touches: [], changedTouches: [end] });
      expect(within(screen.getByRole("dialog")).getByRole("img", { name: "Plaża" })).toBeVisible();
    }
  });

  it("cancels a gesture when another finger touches or the browser cancels it", async () => {
    const user = userEvent.setup();
    render(<OfferGallery images={images} />);
    await user.click(screen.getByRole("button", { name: "Powiększ zdjęcie: Plaża" }));
    const dialog = screen.getByRole("dialog");
    const photo = within(dialog).getByRole("img", { name: "Plaża" });
    const first = { identifier: 1, clientX: 200, clientY: 100 };
    const second = { identifier: 2, clientX: 220, clientY: 100 };
    const end = { ...first, clientX: 100 };
    fireEvent.touchStart(photo, { touches: [first], changedTouches: [first] });
    fireEvent.touchStart(within(dialog).getByRole("button", { name: "Następne zdjęcie" }), {
      touches: [first, second],
      changedTouches: [second],
    });
    fireEvent.touchEnd(photo, { touches: [], changedTouches: [end] });
    expect(within(dialog).getByRole("img", { name: "Plaża" })).toBeVisible();
    fireEvent.touchStart(photo, { touches: [first], changedTouches: [first] });
    fireEvent.touchCancel(photo, { touches: [], changedTouches: [first] });
    fireEvent.touchEnd(photo, { touches: [], changedTouches: [end] });
    expect(within(dialog).getByRole("img", { name: "Plaża" })).toBeVisible();
  });

  it("forgets an unfinished gesture when the dialog closes", async () => {
    const user = userEvent.setup();
    render(<OfferGallery images={images} />);
    await user.click(screen.getByRole("button", { name: "Powiększ zdjęcie: Plaża" }));
    const first = { identifier: 1, clientX: 200, clientY: 100 };
    fireEvent.touchStart(within(screen.getByRole("dialog")).getByRole("img", { name: "Plaża" }), {
      touches: [first],
      changedTouches: [first],
    });
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Powiększ zdjęcie: Plaża" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.touchEnd(within(dialog).getByRole("img", { name: "Plaża" }), {
      touches: [],
      changedTouches: [{ ...first, clientX: 100 }],
    });
    expect(within(dialog).getByRole("img", { name: "Plaża" })).toBeVisible();
  });

  it("cancels a swipe when a second finger touches outside the dialog", async () => {
    const user = userEvent.setup();
    render(<OfferGallery images={images} />);
    await user.click(screen.getByRole("button", { name: "Powiększ zdjęcie: Plaża" }));
    const dialog = screen.getByRole("dialog");
    const photo = within(dialog).getByRole("img", { name: "Plaża" });
    const first = { identifier: 1, clientX: 200, clientY: 100 };
    const second = { identifier: 2, clientX: 2, clientY: 2 };
    fireEvent.touchStart(photo, { touches: [first], changedTouches: [first] });
    fireEvent.touchStart(document.body, { touches: [first, second], changedTouches: [second] });
    fireEvent.touchEnd(document.body, { touches: [first], changedTouches: [second] });
    fireEvent.touchEnd(photo, { touches: [], changedTouches: [{ ...first, clientX: 100 }] });
    expect(within(dialog).getByRole("img", { name: "Plaża" })).toBeVisible();
  });
  it("opens the clicked photo and loops in both directions with buttons and keys", async () => {
    const user = userEvent.setup();
    render(<OfferGallery images={images} title="Galeria" />);

    const thumbnail = screen.getByRole("button", { name: "Powiększ zdjęcie: Dom" });
    await user.click(thumbnail);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("img", { name: "Dom" })).toHaveAttribute(
      "src",
      images[1].signedUrl,
    );
    expect(within(dialog).getByRole("status")).toHaveTextContent("2 / 3");
    await user.click(within(dialog).getByRole("button", { name: "Następne zdjęcie" }));
    expect(within(dialog).getByRole("img", { name: "Góry" })).toBeVisible();
    await user.keyboard("{ArrowRight}");
    expect(within(dialog).getByRole("img", { name: "Plaża" })).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Poprzednie zdjęcie" }));
    expect(within(dialog).getByRole("img", { name: "Góry" })).toBeVisible();
    await user.keyboard("{ArrowLeft}");
    expect(within(dialog).getByRole("img", { name: "Dom" })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(thumbnail).toHaveFocus();
  });

  it("skips photos without URLs and hides navigation for a single available photo", async () => {
    const user = userEvent.setup();
    render(<OfferGallery images={[images[0], { ...images[1], signedUrl: null }]} />);
    expect(screen.queryByRole("button", { name: "Powiększ zdjęcie: Dom" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Powiększ zdjęcie: Plaża" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).queryByRole("button", { name: "Następne zdjęcie" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Poprzednie zdjęcie" }),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByRole("status")).toHaveTextContent("1 / 1");
    await user.keyboard("{ArrowRight}{ArrowLeft}");
    expect(within(dialog).getByRole("img", { name: "Plaża" })).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Zamknij" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps independent galleries separate", async () => {
    const user = userEvent.setup();
    render(
      <>
        <OfferGallery images={images.slice(0, 2)} />
        <OfferGallery images={[images[2]]} />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Powiększ zdjęcie: Plaża" }));
    await user.click(screen.getByRole("button", { name: "Następne zdjęcie" }));
    expect(within(screen.getByRole("dialog")).getByRole("img", { name: "Dom" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("2 / 2");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Powiększ zdjęcie: Góry" }));
    expect(screen.getByRole("status")).toHaveTextContent("1 / 1");
  });

  it("uses current image data and closes when the selected photo disappears", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<OfferGallery images={images} />);
    await user.click(screen.getByRole("button", { name: "Powiększ zdjęcie: Dom" }));
    const refreshed = { ...images[1], signedUrl: "https://example.test/refreshed.webp" };
    rerender(<OfferGallery images={[images[0], refreshed, images[2]]} />);
    expect(within(screen.getByRole("dialog")).getByRole("img", { name: "Dom" })).toHaveAttribute(
      "src",
      refreshed.signedUrl,
    );
    rerender(<OfferGallery images={[images[0], images[2]]} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<OfferGallery images={images} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
