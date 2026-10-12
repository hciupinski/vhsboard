import { readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { imageBudget, listImageSources, renderImageCatalogue, sourceHash } from "./image-assets";

const manifestSchema = z.object({
  version: z.literal(1),
  images: z.record(
    z.object({
      sourceHash: z.string(),
      asset: z.object({
        src: z.string(),
        width: z.number().positive(),
        height: z.number().positive(),
        webpSrcSet: z.string(),
        avifSrcSet: z.string(),
      }),
      variants: z.array(
        z.object({
          path: z.string().startsWith("/images/generated/"),
          width: z.number().positive(),
          height: z.number().positive(),
          format: z.enum(["webp", "avif"]),
          bytes: z.number().positive(),
        }),
      ),
    }),
  ),
});
export async function checkImageAssets(rootDirectory: string): Promise<void> {
  const manifest = manifestSchema.parse(
    JSON.parse(
      await readFile(join(rootDirectory, "public/images/generated/manifest.json"), "utf8"),
    ),
  );
  if (
    (await readFile(join(rootDirectory, "src/lib/images/local-assets.generated.ts"), "utf8")) !==
    (await renderImageCatalogue(manifest.images))
  )
    throw new Error("Nieaktualny katalog aplikacji. Uruchom images:generate.");
  const sourcesDirectory = join(rootDirectory, "src/assets");
  const keys = (await listImageSources(sourcesDirectory)).map((filename) =>
    relative(sourcesDirectory, filename).split(sep).join("/"),
  );
  if (JSON.stringify(keys) !== JSON.stringify(Object.keys(manifest.images)))
    throw new Error("Niezgodny katalog obrazów. Uruchom images:generate.");
  for (const [key, { sourceHash: expectedHash, asset, variants }] of Object.entries(
    manifest.images,
  )) {
    const source = await readFile(join(sourcesDirectory, key));
    if (sourceHash(source) !== expectedHash) throw new Error(`Nieaktualne źródło: ${key}`);
    const oriented = await sharp(source).rotate().toBuffer({ resolveWithObject: true });
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
    for (const format of ["webp", "avif"] as const) {
      const formatVariants = variants.filter((v) => v.format === format);
      if (JSON.stringify(formatVariants.map((v) => v.width)) !== JSON.stringify(widths))
        throw new Error(`Brak wariantu: ${key}`);
      const expectedSet = formatVariants.map((v) => `${v.path} ${v.width}w`).join(", ");
      if (asset[format === "webp" ? "webpSrcSet" : "avifSrcSet"] !== expectedSet)
        throw new Error(`Niezgodny srcset: ${key}`);
    }
    for (const variant of variants) {
      if (variant.path.includes("..")) throw new Error("Niebezpieczna ścieżka obrazu");
      const filename = join(rootDirectory, "public", variant.path);
      const file = await stat(filename);
      if (file.size > imageBudget(variant.width) || file.size !== variant.bytes)
        throw new Error(`Niezgodny rozmiar: ${variant.path}`);
      const metadata = await sharp(filename).metadata();
      if (
        metadata.width !== variant.width ||
        metadata.height !== variant.height ||
        metadata.format !== (variant.format === "avif" ? "heif" : "webp")
      )
        throw new Error(`Niezgodne wymiary lub format: ${variant.path}`);
    }
    const largest = variants.filter((v) => v.format === "webp").at(-1);
    if (
      !largest ||
      asset.src !== largest.path ||
      asset.width !== largest.width ||
      asset.height !== largest.height
    )
      throw new Error(`Niezgodny fallback: ${key}`);
  }
}
if (import.meta.main) await checkImageAssets(process.cwd());
