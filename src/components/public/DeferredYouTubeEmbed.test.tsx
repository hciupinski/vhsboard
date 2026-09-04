import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DeferredYouTubeEmbed } from "./DeferredYouTubeEmbed";

describe("DeferredYouTubeEmbed", () => {
  it("loads the YouTube iframe only after activation and keeps a fallback link", async () => {
    const user = userEvent.setup();
    render(<DeferredYouTubeEmbed videoId="wff_iv8QJ4c" title="Obozy VHSBOARD" />);

    expect(screen.queryByTitle("Obozy VHSBOARD")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /obejrzyj na youtube/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=wff_iv8QJ4c",
    );

    await user.click(screen.getByRole("button", { name: "Odtwórz film: Obozy VHSBOARD" }));

    expect(screen.getByTitle("Obozy VHSBOARD")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/wff_iv8QJ4c",
    );
    expect(screen.getByRole("link", { name: /obejrzyj na youtube/i })).toBeInTheDocument();
  });
});
