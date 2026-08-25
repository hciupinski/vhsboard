import { describe, expect, it } from "vitest";

import { isBuildOnly } from "./build-mode";

describe("isBuildOnly", () => {
  it("disables remote prerendering only when CI explicitly requests it", () => {
    expect(isBuildOnly({ VHSBOARD_BUILD_ONLY: "true" })).toBe(true);
    expect(isBuildOnly({ VHSBOARD_BUILD_ONLY: "false" })).toBe(false);
    expect(isBuildOnly({})).toBe(false);
  });
});
