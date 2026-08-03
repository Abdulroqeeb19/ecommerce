import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixelFn) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

// Lightning bolt polygon (normalized coords 0..1)
const BOLT = [
  [0.56, 0.06],
  [0.3, 0.52],
  [0.46, 0.52],
  [0.38, 0.94],
  [0.68, 0.44],
  [0.5, 0.44]
];

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function roundedRect(x, y, w, h, r, px, py) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const rx = Math.min(r, w / 2), ry = Math.min(r, h / 2);
  const nx = Math.max(x + rx, Math.min(px, x + w - rx));
  const ny = Math.max(y + ry, Math.min(py, y + h - ry));
  return (px - nx) ** 2 + (py - ny) ** 2 <= rx * ry;
}

function makeIcon(size, { maskable = false, shape = "square" } = {}) {
  const c1 = hex("#1D4ED8");
  const c2 = hex("#0EA5E9");
  const c3 = hex("#172554");
  return encodePng(size, (x, y) => {
    const u = x / (size - 1);
    const v = y / (size - 1);
    const a = (v + u) / 2;

    let r = c1[0] * (1 - a) + c2[0] * a;
    let g = c1[1] * (1 - a) + c2[1] * a;
    let b = c1[2] * (1 - a) + c2[2] * a;

    // subtle vignette
    const dx = (x - size / 2) / size;
    const dy = (y - size / 2) / size;
    const d = Math.sqrt(dx * dx + dy * dy) * 1.6;
    r = Math.max(0, r - d * 40);
    g = Math.max(0, g - d * 40);
    b = Math.max(0, b - d * 40);

    let alpha = 255;

    // shape (icon-only transparent background)
    if (shape === "circle") {
      const rad = size / 2;
      if ((x - rad) ** 2 + (y - rad) ** 2 > rad * rad) return [0, 0, 0, 0];
    } else if (shape === "rounded") {
      if (!roundedRect(0, 0, size, size, size * 0.2, x, y)) return [0, 0, 0, 0];
    }

    // maskable safe zone background (fills full square)
    if (maskable && (u < 0.1 || u > 0.9 || v < 0.1 || v > 0.9)) {
      return [r, g, b, alpha];
    }

    const minSafe = 0.18;
    const maxSafe = 0.82;
    const inSafe = u >= minSafe && u <= maxSafe && v >= minSafe && v <= maxSafe;

    // circuit traces
    const trace = (u < 0.4 && (v > 0.82 && v < 0.86)) || (u > 0.6 && (v > 0.82 && v < 0.86));
    if (trace && alpha === 255) {
      r = 224; g = 242; b = 254;
      return [r, g, b, alpha];
    }

    if (inSafe && pointInPoly(u, v, BOLT)) {
      const edge = Math.max(
        Math.abs(u - 0.56) / 0.2,
        Math.abs(v - 0.5) / 0.44
      );
      const boost = 1 + (1 - edge) * 0.15;
      return [Math.min(255, Math.floor(255 * boost)), Math.min(255, Math.floor(200 * boost)), Math.min(255, Math.floor(40 * boost)), alpha];
    }

    if (alpha === 255 && d < 0.5) {
      const glow = 1 - d * 0.5;
      r = Math.min(255, r + glow * 30);
      g = Math.min(255, g + glow * 30);
      b = Math.min(255, b + glow * 30);
    }

    return [Math.floor(r), Math.floor(g), Math.floor(b), alpha];
  });
}

writeFileSync(join(outDir, "icon-192.png"), makeIcon(192, { shape: "square" }));
writeFileSync(join(outDir, "icon-512.png"), makeIcon(512, { shape: "square" }));
writeFileSync(join(outDir, "icon-maskable-512.png"), makeIcon(512, { maskable: true }));
writeFileSync(join(outDir, "apple-touch-icon.png"), makeIcon(180, { shape: "circle" }));
console.log("Generated PWA icons");
