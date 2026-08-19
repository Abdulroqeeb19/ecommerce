import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public/images/catalog");
const WEB = path.join(ROOT, "web");
const PRODUCTS = path.join(ROOT, "products");
const QUALITY = 84;
const BRAND = "Gadget Hub";

const svgWatermark = (w) => {
  const pillW = Math.max(120, Math.round(w * 0.3));
  const fs_ = Math.max(22, Math.round(w * 0.026));
  const padY = Math.round(fs_ * 0.38);
  const h = fs_ + padY * 2;
  const x0 = 4;
  const x1 = x0 + pillW;
  const y0 = 4;
  const y1 = y0 + h;
  const r = Math.round(h / 2);
  const svgW = pillW + 8;
  const svgH = h + 8;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">` +
    `<defs>` +
    `<linearGradient id="g" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#0f172a" stop-opacity="0.55"/>` +
    `<stop offset="1" stop-color="#1e293b" stop-opacity="0.55"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect x="${x0}" y="${y0}" width="${pillW}" height="${h}" rx="${r}" ry="${r}" fill="url(#g)"/>` +
    `<text x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2 + Math.round(fs_ * 0.34)}" font-family="Segoe UI, Arial, sans-serif" font-size="${fs_}" font-weight="600" fill="#ffffff" fill-opacity="0.88" text-anchor="middle">${BRAND}</text>` +
    `</svg>`;
  return { svg, svgW, svgH };
};

const imageExts = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const files = [];
for (const dir of [WEB, PRODUCTS]) {
  for (const f of fs.readdirSync(dir)) {
    if (imageExts.has(path.extname(f).toLowerCase())) {
      files.push({ dir, name: f, isWeb: dir === WEB });
    }
  }
}

let webDone = 0;
let prodDone = 0;
let origBytes = 0;
let newBytes = 0;
const failed = [];

for (const { dir, name, isWeb } of files) {
  const abs = path.join(dir, name);
  const before = fs.statSync(abs).size;
  origBytes += before;
  try {
    const input = fs.readFileSync(abs);
    const meta = await sharp(input).metadata();
    let pipeline = sharp(input);
    if (isWeb && meta.width) {
      const { svg, svgW, svgH } = svgWatermark(meta.width);
      pipeline = pipeline.composite([
        {
          input: Buffer.from(svg),
          left: Math.max(0, meta.width - svgW - 14),
          top: Math.max(0, meta.height - svgH - 14)
        }
      ]);
    }
    pipeline = pipeline.flatten({ background: "#ffffff" });
    const ext = path.extname(name).toLowerCase();
    if (ext === ".png") pipeline = pipeline.png({ compressionLevel: 9 });
    else if (ext === ".webp") pipeline = pipeline.webp({ quality: QUALITY });
    else pipeline = pipeline.jpeg({ quality: QUALITY, progressive: true, mozjpeg: true });

    const tmp = abs + ".tmp";
    await pipeline.toFile(tmp);
    fs.renameSync(tmp, abs);

    const after = fs.statSync(abs).size;
    newBytes += after;
    if (isWeb) webDone++;
    else prodDone++;
  } catch (e) {
    failed.push(abs + ": " + e.message);
  }
}

const pct = newBytes === 0 ? 0 : Math.round(((origBytes - newBytes) / origBytes) * 100);
console.log(`Processed: ${webDone} web (watermarked) + ${prodDone} products = ${webDone + prodDone} images, failed: ${failed.length}`);
console.log(`Bytes: ${origBytes} -> ${newBytes} (${pct}% smaller)`);
for (const f of failed) console.log("FAILED: " + f);