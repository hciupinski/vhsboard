import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeferredYouTubeEmbed } from "./DeferredYouTubeEmbed";

describe("DeferredYouTubeEmbed", () => {
  it("renders the YouTube iframe without an outer panel or fallback link", () => {
    render(<DeferredYouTubeEmbed videoId="wff_iv8QJ4c" title="Obozy VHSBOARD" />);

    const iframe = screen.getByTitle("Obozy VHSBOARD");

    expect(iframe).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/wff_iv8QJ4c");
    expect(iframe.parentElement).toHaveClass("rounded-2xl", "bg-foreground");
    expect(iframe.parentElement).not.toHaveClass("border", "p-5", "shadow-warm");
    expect(screen.queryByRole("link", { name: /obejrzyj na youtube/i })).not.toBeInTheDocument();
  });
});
