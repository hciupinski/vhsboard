import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FloatingBookingCta } from "./FloatingBookingCta";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FloatingBookingCta", () => {
  it("hides when the footer enters the viewport and returns when scrolling above it", () => {
    const callbacks: IntersectionObserverCallback[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          callbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    const footer = document.createElement("footer");
    const page = document.createElement("div");
    page.setAttribute("data-trip-detail", "");
    page.append(footer);
    document.body.append(page);
    const ref = createRef<HTMLElement>();
    Object.assign(ref, { current: document.createElement("aside") });
    render(
      <FloatingBookingCta
        cardRef={ref}
        href="https://example.test/book"
        label="Przejdź do zapisów"
      />,
    );
    act(() =>
      callbacks[0]!(
        [
          {
            isIntersecting: false,
            boundingClientRect: { bottom: -1 },
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
    );
    expect(screen.getByRole("link", { name: "Przejdź do zapisów" })).toBeVisible();
    act(() =>
      callbacks[1]!(
        [{ isIntersecting: true, boundingClientRect: { top: 500 } } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(screen.queryByRole("link", { name: "Przejdź do zapisów" })).toBeNull();
    act(() =>
      callbacks[1]!(
        [{ isIntersecting: false, boundingClientRect: { top: 2000 } } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(screen.getByRole("link", { name: "Przejdź do zapisów" })).toBeVisible();
    page.remove();
  });
  it("appears only after the booking card is scrolled past and hides when it returns", () => {
    let notify!: IntersectionObserverCallback;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          notify = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const card = document.createElement("aside");
    const ref = createRef<HTMLElement>();
    Object.assign(ref, { current: card });
    const { unmount } = render(
      <FloatingBookingCta
        cardRef={ref}
        href="https://example.test/book"
        label="Przejdź do zapisów"
      />,
    );
    expect(screen.queryByRole("link", { name: "Przejdź do zapisów" })).toBeNull();
    act(() =>
      notify(
        [
          {
            isIntersecting: false,
            boundingClientRect: { bottom: 2000 },
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
    );
    expect(screen.queryByRole("link", { name: "Przejdź do zapisów" })).toBeNull();
    act(() =>
      notify(
        [
          {
            isIntersecting: false,
            boundingClientRect: { bottom: -1 },
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
    );
    expect(screen.getByRole("link", { name: "Przejdź do zapisów" })).toHaveAttribute(
      "href",
      "https://example.test/book",
    );
    act(() =>
      notify(
        [
          {
            isIntersecting: true,
            boundingClientRect: { bottom: 100 },
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
    );
    expect(screen.queryByRole("link", { name: "Przejdź do zapisów" })).toBeNull();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
  it("hides for open dialogs and cookie banner and restores the action afterwards", async () => {
    let notify!: IntersectionObserverCallback;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const ref = createRef<HTMLElement>();
    Object.assign(ref, { current: document.createElement("aside") });
    render(
      <FloatingBookingCta cardRef={ref} href="#turnusy" label="Wybierz turnus" showOnMobile />,
    );
    act(() =>
      notify(
        [
          {
            isIntersecting: false,
            boundingClientRect: { bottom: -1 },
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
    );
    expect(screen.getByRole("link", { name: "Wybierz turnus" })).toHaveAttribute(
      "href",
      "#turnusy",
    );
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    await act(async () => {
      document.body.append(dialog);
    });
    expect(screen.queryByRole("link", { name: "Wybierz turnus" })).toBeNull();
    await act(async () => {
      dialog.remove();
    });
    expect(screen.getByRole("link", { name: "Wybierz turnus" })).toBeVisible();
    const banner = document.createElement("div");
    banner.id = "cookie-consent-heading";
    await act(async () => {
      document.body.append(banner);
    });
    expect(screen.queryByRole("link", { name: "Wybierz turnus" })).toBeNull();
    await act(async () => {
      banner.remove();
    });
  });
});
