import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import sharp, { type OutputInfo } from "sharp";
import {
  imageBudget,
  listImageSources,
  renderImageCatalogue,
  sourceHash,
  type ImageManifest,
} from "./image-assets";

export async function generateImageAssets(rootDirectory: string): Promise<void> {
  const sourcesDirectory = join(rootDirectory, "src/assets");
  const outputDirectory = join(rootDirectory, "public/images/generated");
  const manifest: ImageManifest = { version: 1, images: {} };
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  for (const filename of await listImageSources(sourcesDirectory)) {
    const key = relative(sourcesDirectory, filename).split(sep).join("/");
    const input = await readFile(filename);
    const oriented = await sharp(input).rotate().toBuffer({ resolveWithObject: true });
    const widths = [
      ...new Set(
        [480, 960, 1600].map((width) =>
          Math.min(
            width,
            oriented.info.width,
            Math.round(oriented.info.width * Math.min(1, 1920 / oriented.info.height)),
          ),
        ),
      ),
    ];
    const variants: ImageManifest["images"][string]["variants"] = [];
    for (const width of widths) {
      for (const format of ["webp", "avif"] as const) {
        let exported: { data: Buffer; info: OutputInfo } | undefined;
        const qualityStart = format === "webp" ? 82 : 50;
        const qualityMin = format === "webp" ? 62 : 35;
        for (let quality = qualityStart; quality >= qualityMin; quality -= 5) {
          const pipeline = sharp(oriented.data).resize({ width, withoutEnlargement: true });
          exported = await (
            format === "webp" ? pipeline.webp({ quality }) : pipeline.avif({ quality, effort: 4 })
          ).toBuffer({ resolveWithObject: true });
          if (exported.data.length <= imageBudget(width)) break;
        }
        if (!exported || exported.data.length > imageBudget(width))
          throw new Error(`${key}: przekroczony budżet obrazu ${width}px ${format}`);
        const name = `${key.replace(/\.[^.]+$/, "").replaceAll("/", "-")}-${width}-${sourceHash(exported.data).slice(0, 12)}.${format}`;
        await writeFile(join(outputDirectory, name), exported.data);
        variants.push({
          path: `/images/generated/${name}`,
          width: exported.info.width,
          height: exported.info.height,
          format,
          bytes: exported.data.length,
        });
      }
    }
    const largest = variants.filter((v) => v.format === "webp").at(-1);
    if (!largest) throw new Error(`Brak eksportu: ${key}`);
    const srcSet = (format: "webp" | "avif") =>
      variants
        .filter((v) => v.format === format)
        .map((v) => `${v.path} ${v.width}w`)
        .join(", ");
    manifest.images[key] = {
      sourceHash: sourceHash(input),
      asset: {
        src: largest.path,
        width: largest.width,
        height: largest.height,
        webpSrcSet: srcSet("webp"),
        avifSrcSet: srcSet("avif"),
      },
      variants,
    };
  }
  await writeFile(join(outputDirectory, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await mkdir(join(rootDirectory, "src/lib/images"), { recursive: true });
  await writeFile(
    join(rootDirectory, "src/lib/images/local-assets.generated.ts"),
    await renderImageCatalogue(manifest.images),
  );
}
if (import.meta.main) await generateImageAssets(process.cwd());
