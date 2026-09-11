import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeferredYouTubeEmbed } from "./DeferredYouTubeEmbed";

describe("DeferredYouTubeEmbed", () => {
  it("renders the YouTube iframe immediately and keeps a fallback link", () => {
    render(<DeferredYouTubeEmbed videoId="wff_iv8QJ4c" title="Obozy VHSBOARD" />);

    expect(screen.getByTitle("Obozy VHSBOARD")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/wff_iv8QJ4c",
    );
    expect(screen.queryByRole("button", { name: /odtwórz film/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /obejrzyj na youtube/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=wff_iv8QJ4c",
    );
  });
});
