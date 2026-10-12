import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, expect, it } from "vitest";
import { generateImageAssets } from "./generate-image-assets";
import { checkImageAssets } from "./check-image-assets";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "vhsboard-images-"));
  directories.push(root);
  await mkdir(join(root, "src/assets/carousel"), { recursive: true });
  await writeFile(
    join(root, "src/assets/carousel/portrait.jpg"),
    await sharp({ create: { width: 200, height: 100, channels: 3, background: "#a45223" } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer(),
  );
  await generateImageAssets(root);
  return root;
}
it("exports an oriented small image without enlarging it", async () => {
  const root = await fixture();
  await expect(checkImageAssets(root)).resolves.toBeUndefined();
  const manifest = JSON.parse(
    await readFile(join(root, "public/images/generated/manifest.json"), "utf8"),
  );
  expect(manifest.images["carousel/portrait.jpg"].asset).toMatchObject({ width: 100, height: 200 });
  expect(manifest.images["carousel/portrait.jpg"].variants).toHaveLength(2);
});
it.each(["missing", "oversized", "dimensions", "stale-source", "stale-catalogue"] as const)(
  "rejects %s assets",
  async (condition) => {
    const root = await fixture();
    const manifest = JSON.parse(
      await readFile(join(root, "public/images/generated/manifest.json"), "utf8"),
    );
    const path = join(root, "public", manifest.images["carousel/portrait.jpg"].asset.src);
    if (condition === "missing") await rm(path);
    if (condition === "oversized") await writeFile(path, Buffer.alloc(181 * 1024));
    if (condition === "dimensions")
      await writeFile(
        path,
        await sharp({ create: { width: 30, height: 60, channels: 3, background: "red" } })
          .webp()
          .toBuffer(),
      );
    if (condition === "stale-source")
      await writeFile(join(root, "src/assets/carousel/portrait.jpg"), "changed");
    if (condition === "stale-catalogue")
      await writeFile(join(root, "src/lib/images/local-assets.generated.ts"), "changed");
    await expect(checkImageAssets(root)).rejects.toThrow();
  },
);
