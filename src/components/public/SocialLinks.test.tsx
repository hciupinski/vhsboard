import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SocialLinks } from "./SocialLinks";

describe("SocialLinks", () => {
  it("renders accessible SVG links that turn primary on interaction", () => {
    render(<SocialLinks />);

    for (const name of ["Facebook", "Instagram"]) {
      const link = screen.getByRole("link", { name });

      expect(link.querySelector("svg")).toBeInTheDocument();
      expect(link).toHaveClass("text-foreground", "hover:text-primary", "active:text-primary");
    }
  });
});
