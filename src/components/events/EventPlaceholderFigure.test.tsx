import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventPlaceholderFigure } from "./EventPlaceholderFigure";

describe("EventPlaceholderFigure", () => {
  it("marks temporary event media with a visible caption", () => {
    render(
      <EventPlaceholderFigure
        src="/placeholder.jpg"
        alt="Mobilny tor skimboardowy podczas eventu"
        caption="Zdjęcie zastępcze: realizacja toru skimboardowego podczas eventu."
      />,
    );

    expect(screen.getByRole("img", { name: /mobilny tor skimboardowy/i })).toBeInTheDocument();
    expect(screen.getByText(/^Zdjęcie zastępcze:/)).toBeInTheDocument();
  });
});
