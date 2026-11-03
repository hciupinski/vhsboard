import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import ts from "typescript";
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

it("generates a catalogue whose paths remain checked by TypeScript", async () => {
  const root = await fixture();
  const imageDirectory = join(root, "src/lib/images");
  await writeFile(
    join(imageDirectory, "responsive.ts"),
    await readFile(join(process.cwd(), "src/lib/images/responsive.ts"), "utf8"),
  );
  const usage = join(imageDirectory, "usage.ts");
  await writeFile(
    usage,
    `import { getLocalImage } from "./responsive";
import { LOCAL_IMAGE_ASSETS } from "./local-assets.generated";
getLocalImage("carousel/portrait.jpg");
LOCAL_IMAGE_ASSETS["carousel/portrait.jpg"].width;
// @ts-expect-error Deleted or renamed sources cannot be referenced.
getLocalImage("carousel/deleted.jpg");
// @ts-expect-error File extensions are case sensitive.
getLocalImage("carousel/portrait.JPG");
declare const unvalidatedPath: string;
// @ts-expect-error Unvalidated strings cannot bypass the catalogue.
getLocalImage(unvalidatedPath);
// @ts-expect-error The catalogue must not have a string index signature.
LOCAL_IMAGE_ASSETS["carousel/deleted.jpg"];
`,
  );
  const program = ts.createProgram([usage], {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    types: [],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  expect(
    diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")),
  ).toEqual([]);
});
