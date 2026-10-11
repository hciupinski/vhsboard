import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventPlaceholderFigure } from "./EventPlaceholderFigure";

describe("EventPlaceholderFigure", () => {
  it("marks temporary event media with a visible caption", () => {
    render(
      <EventPlaceholderFigure
        image={{
          src: "/placeholder.webp",
          width: 1200,
          height: 800,
          webpSrcSet: "/placeholder.webp 1200w",
          avifSrcSet: "/placeholder.avif 1200w",
        }}
        alt="Mobilny tor skimboardowy podczas eventu"
      />,
    );

    expect(screen.getByRole("img", { name: /mobilny tor skimboardowy/i })).toBeInTheDocument();
  });
});
