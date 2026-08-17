import { describe, expect, it } from "vitest";

import { getRouter } from "./router";

describe("application query cache", () => {
  it("marks public offer data stale before signed image URLs expire", () => {
    const router = getRouter();

    expect(router.options.context.queryClient.getDefaultOptions().queries?.staleTime).toBe(
      45 * 60 * 1000,
    );
  });
});
