import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
