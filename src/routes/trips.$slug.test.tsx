import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { Route } from "./trips.$slug";

describe("legacy trip route", () => {
  it("redirects a safe legacy slug to its permanent /wyjazdy address", () => {
    try {
      Route.options.beforeLoad?.({ params: { slug: "atlantic-surf-week" } } as never);
      throw new Error("Expected a redirect");
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
      expect(error).toMatchObject({
        options: { to: "/wyjazdy/$slug", params: { slug: "atlantic-surf-week" } },
      });
    }
  });

  it("does not interpolate an unsafe legacy slug into a redirect", () => {
    expect(() =>
      Route.options.beforeLoad?.({ params: { slug: "https://example.test" } } as never),
    ).toThrow();
  });
});
