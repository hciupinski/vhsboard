import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EventUseCasesScroller } from "./EventUseCasesScroller";

describe("EventUseCasesScroller", () => {
  it("renders every use case in a labelled horizontal list with visible scroll controls", () => {
    render(<EventUseCasesScroller items={["Pikniki rodzinne", "Targi"]} />);

    expect(
      screen.getByRole("list", { name: "Zastosowania toru skimboardowego" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pikniki rodzinne")).toBeInTheDocument();
    expect(screen.getByText("Targi")).toBeInTheDocument();
    expect(screen.getByText(/przesuń w bok/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /poprzednie zastosowania/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /następne zastosowania/i })).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it.each([true, false])(
  "scrolls instantly for keyboard activation (reduced=%s)",
  async (reduced) => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: reduced })),
    );
    render(<EventUseCasesScroller items={["Pikniki", "Targi"]} />);
    const list = screen.getByRole("list");
    const scrollBy = vi.fn();
    Object.defineProperty(list, "scrollBy", { value: scrollBy });
    vi.spyOn(list, "clientWidth", "get").mockReturnValue(300);
    const user = userEvent.setup();
    screen.getByRole("button", { name: "Pokaż następne zastosowania" }).focus();
    await user.keyboard("{Enter}");
    expect(scrollBy).toHaveBeenCalledWith({ left: 240, behavior: "auto" });
  },
);
it.each([true, false])("honors motion preference on pointer activation (reduced=%s)", (reduced) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduced })),
  );
  render(<EventUseCasesScroller items={["Pikniki", "Targi"]} />);
  const list = screen.getByRole("list");
  const scrollBy = vi.fn();
  Object.defineProperty(list, "scrollBy", { value: scrollBy });
  vi.spyOn(list, "clientWidth", "get").mockReturnValue(300);
  fireEvent.click(screen.getByRole("button", { name: "Pokaż poprzednie zastosowania" }), {
    detail: 1,
  });
  expect(scrollBy).toHaveBeenCalledWith({ left: -240, behavior: reduced ? "auto" : "smooth" });
});
