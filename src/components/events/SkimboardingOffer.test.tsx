import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SkimboardingOffer } from "./SkimboardingOffer";

describe("the preserved skimboarding offer", () => {
  it("shows track options, event service details and a contact route", () => {
    render(<SkimboardingOffer />);
    expect(screen.getByRole("heading", { name: /tor skimboardowy.*wynajem/i })).toBeInTheDocument();
    expect(screen.getByText(/15, 20 i 30 metrów/i)).toBeInTheDocument();
    expect(screen.getByText(/torem stacjonarnym/i)).toBeInTheDocument();
    expect(screen.getByText(/montaż i demontaż/i)).toBeInTheDocument();
    expect(screen.getByText(/podstawowy.*standard.*premium/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /napisz do nas/i })).toHaveAttribute(
      "href",
      "/kontakt",
    );
  });
});
