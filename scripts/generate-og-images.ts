import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
const artwork = {
  home: { source: "carousel/hero-surf.jpg", lines: ["POZA CODZIENNYM", "PLANEM."] },
  about: { source: "about-us/mario-vhs.jpg", lines: ["POZNAJ EKIPĘ."] },
  trips: { source: "main/wyjazdy.jpg", lines: ["WYJAZDY.", "NA DESCE. RAZEM."] },
  events: { source: "main/eventy-1.jpg", lines: ["EVENTY.", "DOBRA ENERGIA."] },
  camps: { source: "main/obozy-zima.jpg", lines: ["OBOZY.", "SPORT I PRZYGODA."] },
  contact: { source: "about-us/mario-vhs.jpg", lines: ["POROZMAWIAJMY."] },
  offers: { source: "carousel/hero-surf.jpg", lines: ["TWÓJ KOLEJNY", "WYJAZD."] },
};
export async function generateOgImages(rootDirectory: string): Promise<void> {
  const output = join(rootDirectory, "public/og");
  await mkdir(output, { recursive: true });
  const logo = await readFile(join(rootDirectory, "public/logo-80.png"));
  for (const [key, { source, lines }] of Object.entries(artwork)) {
    const overlay = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="shade"><stop stop-color="#201c16" stop-opacity=".82"/><stop offset="1" stop-color="#201c16" stop-opacity=".16"/></linearGradient></defs><rect width="1200" height="630" fill="url(#shade)"/><rect x="48" y="48" width="108" height="108" rx="16" fill="#fcf7ee"/><g font-family="Arial, sans-serif" font-weight="bold" fill="#fcf7ee"><text x="184" y="120" font-size="60">VHSBOARD<tspan fill="#d45d20">.</tspan></text>${lines.map((line, index) => `<text x="52" y="${lines.length === 1 ? 460 : 390 + index * 82}" font-size="64">${line}</text>`).join("")}</g><text x="52" y="565" font-family="Arial, sans-serif" font-size="24" fill="#fcf7ee" letter-spacing="4">WYJAZDY · EVENTY · OBOZY</text></svg>`,
    );
    const buffer = await sharp(join(rootDirectory, "src/assets", source))
      .rotate()
      .resize(1200, 630, { fit: "cover" })
      .composite([{ input: overlay }, { input: logo, left: 62, top: 62 }])
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    if (buffer.length > 300 * 1024) throw new Error(`${key}: przekroczony budżet OG 300 KiB`);
    await writeFile(join(output, `${key}.jpg`), buffer);
  }
}
if (import.meta.main) await generateOgImages(process.cwd());
