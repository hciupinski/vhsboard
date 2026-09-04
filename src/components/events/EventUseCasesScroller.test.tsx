import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventUseCasesScroller } from "./EventUseCasesScroller";

describe("EventUseCasesScroller", () => {
  it("renders every use case in a labelled horizontal list", () => {
    render(<EventUseCasesScroller items={["Pikniki rodzinne", "Targi"]} />);

    expect(
      screen.getByRole("list", { name: "Zastosowania toru skimboardowego" }),
    ).toHaveTextContent("Pikniki rodzinneTargi");
  });
});
