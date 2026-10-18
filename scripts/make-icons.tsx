/**
 * Renders the app icons (the queen medallion, cut as octagons) to public/icons/.
 * Run once after changing the design: npx tsx scripts/make-icons.tsx
 */
import { writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og";

const BG = "#020304"; // --rail
const LINE = "#313a49"; // --line
const QUEEN = "#14d2ff"; // --queen

const oct = (r: number) =>
  Array.from({ length: 8 }, (_, i) => {
    const a = ((i * 45 + 22.5) * Math.PI) / 180;
    return `${(60 + r * Math.cos(a)).toFixed(2)},${(60 + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

/** The medallion on the frame colour; `scale` < 1 keeps it inside a maskable icon's safe zone. */
function svg(scale: number) {
  const points = Array.from({ length: 8 }, (_, i) => `<path d="M60 11 L64 26 L56 26 Z" fill="${LINE}" transform="rotate(${i * 45} 60 60)"/>`).join("");
  const t = `translate(${60 - 60 * scale} ${60 - 60 * scale}) scale(${scale})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${BG}"/><g transform="${t}"><polygon points="${oct(58)}" fill="none" stroke="${LINE}" stroke-width="2"/><polygon points="${oct(50)}" fill="none" stroke="${LINE}" stroke-width="2"/>${points}<polygon points="${oct(28)}" fill="${QUEEN}"/></g></svg>`;
}

async function png(file: string, size: number, scale: number) {
  const src = `data:image/svg+xml;base64,${Buffer.from(svg(scale)).toString("base64")}`;
  // eslint-disable-next-line @next/next/no-img-element
  const res = new ImageResponse(<img src={src} width={size} height={size} alt="" />, { width: size, height: size });
  await writeFile(`public/icons/${file}`, Buffer.from(await res.arrayBuffer()));
  console.log(`public/icons/${file}`);
}

async function main() {
  await png("icon-192.png", 192, 0.9);
  await png("icon-512.png", 512, 0.9);
  await png("maskable-512.png", 512, 0.62);
  await png("apple-touch-icon.png", 180, 0.8);
}
main();
