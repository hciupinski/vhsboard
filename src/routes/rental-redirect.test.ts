import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("permanently redirects the legacy rental URL to the rental page", async () => {
  const redirects = await readFile("public/_redirects", "utf8");
  expect(redirects.split("\n")).toContain("/wypozyczalnia-snb-2/ /wypozyczalnia/ 301");
  expect(redirects.split("\n")).toContain("/wypozyczalnia-snb-2 /wypozyczalnia/ 301");
});
