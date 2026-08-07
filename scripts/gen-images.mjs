import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "images", "products");
mkdirSync(outDir, { recursive: true });

const PRODUCTS = [
  ["ultrabook-x15", "UltraBook X15", "Laptops"],
  ["zenbook-pro-14", "ZenBook Pro 14", "Laptops"],
  ["thinkbook-e14", "ThinkBook E14", "Laptops"],
  ["chromebook-flex", "Chromebook Flex", "Laptops"],
  ["pulse-5g-smartphone", "Pulse 5G", "Smartphones"],
  ["airbuds-pro-wireless", "AirBuds Pro", "Audio"],
  ["officejet-pro-print", "OfficeJet Pro", "Printers"],
  ["laser-jet-mono", "LaserJet Mono", "Printers"],
  ["ink-tank-scanner", "EcoTank A3", "Printers"],
  ["ergonomic-office-chair", "Mesh Office Chair", "Office"],
  ["standing-desk-dual", "Standing Desk", "Office"],
  ["ergonomic-keyboard", "Split Keyboard", "Office"],
  ["ultrawide-monitor-34", "34\" UltraWide", "Monitors"],
  ["4k-monitor-27", "27\" 4K Monitor", "Monitors"],
  ["mesh-wifi-6-router", "Mesh Wi-Fi 6", "Networking"],
  ["ssd-2tb-nvme", "2TB NVMe SSD", "Storage"],
  ["ups-1200va", "1200VA UPS", "Power"],
  ["20000mah-powerbank", "Power Bank", "Power"],
  ["smart-tower-surge-protector", "Surge Tower", "Power"],
  ["exercise-books-pack-10", "Exercise Books", "School"],
  ["geometry-set-compass", "Geometry Set", "School"],
  ["school-backpack-45l", "School Backpack", "School"],
  ["ballpoint-pens-pack-12", "Ballpoint Pens", "School"],
  ["ruled-notebooks-pack-5", "Ruled Notebooks", "School"],
  ["pencil-eraser-set", "Pencil and Eraser Set", "School"],
  ["rice-5kg-bag", "Rice 5kg", "Grocery"],
  ["instant-noodles-carton-12", "Instant Noodles", "Grocery"],
  ["vegetable-oil-1l", "Vegetable Oil", "Grocery"],
  ["cereal-breakfast-box", "Cereal Breakfast", "Grocery"],
  ["milk-powder-400g", "Milk Powder", "Grocery"],
  ["drinking-water-pack-12", "Drinking Water", "Grocery"]
];

const DEVICE_COLORS = [
  ["#1D4ED8", "#0EA5E9"],
  ["#0F172A", "#2563EB"],
  ["#1e293b", "#0EA5E9"],
  ["#7c3aed", "#2563EB"],
  ["#0369a1", "#38bdf8"],
  ["#4338ca", "#818cf8"],
  ["#1e40af", "#22d3ee"],
  ["#312e81", "#0EA5E9"],
  ["#0c4a6e", "#0EA5E9"]
];

function pickGradient(seed) {
  const colors = DEVICE_COLORS[seed % DEVICE_COLORS.length];
  return {
    from: colors[0],
    to: colors[1],
    glow: colors[1] + "66",
    line: colors[1] + "99"
  };
}

function shapeFor(category) {
  switch (category) {
    case "Laptops":
      return `
        <rect x="140" y="150" width="320" height="205" rx="14" fill="url(#screen)" stroke="url(#lineG)" stroke-width="2"/>
        <rect x="150" y="160" width="300" height="175" rx="8" fill="#0B1220"/>
        <rect x="300" y="355" width="120" height="12" rx="6" fill="#cbd5e1"/>
        <rect x="280" y="355" width="120" height="12" rx="6" fill="#cbd5e1"/>
        <circle cx="420" cy="368" r="5" fill="#0EA5E9"/>`;
    case "Smartphones":
      return `
        <rect x="215" y="140" width="170" height="320" rx="26" fill="url(#screen)" stroke="url(#lineG)" stroke-width="2"/>
        <circle cx="300" cy="470" r="16" fill="none" stroke="#0EA5E9" stroke-width="3"/>
        <rect x="286" y="152" width="28" height="5" rx="2.5" fill="#0EA5E9" opacity="0.8"/>`;
    case "Printers":
      return `
        <rect x="140" y="220" width="320" height="190" rx="18" fill="url(#screen)" stroke="url(#lineG)" stroke-width="2"/>
        <rect x="160" y="260" width="200" height="6" rx="3" fill="#0B1220"/>
        <rect x="160" y="280" width="200" height="6" rx="3" fill="#0B1220"/>
        <rect x="160" y="300" width="160" height="6" rx="3" fill="#0B1220"/>
        <rect x="140" y="360" width="320" height="30" rx="10" fill="#0B1220" opacity="0.6"/>
        <rect x="150" y="250" width="90" height="70" rx="6" fill="#0B1220" opacity="0.5"/>
        <circle cx="420" cy="240" r="7" fill="#F59E0B"/>`;
    case "Monitors":
      return `
        <rect x="140" y="130" width="320" height="200" rx="12" fill="url(#screen)" stroke="url(#lineG)" stroke-width="2"/>
        <rect x="150" y="140" width="300" height="170" rx="6" fill="#0B1220"/>
        <rect x="282" y="330" width="36" height="34" rx="4" fill="#cbd5e1"/>
        <rect x="210" y="364" width="180" height="12" rx="6" fill="#94a3b8"/>
        <rect x="190" y="376" width="220" height="10" rx="5" fill="#64748b"/>`;
    case "Audio":
      return `
        <circle cx="205" cy="300" r="72" fill="#0B1220" stroke="url(#lineG)" stroke-width="2"/>
        <circle cx="395" cy="300" r="72" fill="#0B1220" stroke="url(#lineG)" stroke-width="2"/>
        <path d="M 205 372 Q 300 440 395 372" fill="none" stroke="url(#lineG)" stroke-width="12" stroke-linecap="round"/>
        <circle cx="205" cy="268" r="26" fill="url(#screen)"/>
        <circle cx="395" cy="268" r="26" fill="url(#screen)"/>`;
    case "Office":
      return `
        <rect x="240" y="120" width="120" height="260" rx="16" fill="url(#screen)" stroke="url(#lineG)" stroke-width="2"/>
        <rect x="160" y="400" width="280" height="16" rx="8" fill="#0B1220"/>
        <path d="M 170 400 L 170 360 L 430 360 L 430 400" fill="none" stroke="url(#lineG)" stroke-width="6"/>
        <path d="M 300 120 L 300 80" stroke="url(#lineG)" stroke-width="10" stroke-linecap="round"/>
        <path d="M 250 80 L 350 80" stroke="url(#lineG)" stroke-width="10" stroke-linecap="round"/>`;
    case "Networking":
      return `
        <rect x="170" y="200" width="260" height="180" rx="18" fill="url(#screen)" stroke="url(#lineG)" stroke-width="2"/>
        <circle cx="230" cy="250" r="22" fill="none" stroke="#0EA5E9" stroke-width="4"/>
        <circle cx="300" cy="250" r="22" fill="none" stroke="#0EA5E9" stroke-width="4"/>
        <circle cx="370" cy="250" r="22" fill="none" stroke="#0EA5E9" stroke-width="4"/>
        <circle cx="230" cy="250" r="7" fill="#0EA5E9"/>
        <circle cx="300" cy="250" r="7" fill="#0EA5E9"/>
        <circle cx="370" cy="250" r="7" fill="#0EA5E9"/>
        <rect x="190" y="310" width="220" height="34" rx="8" fill="#0B1220"/>`;
    case "Storage":
      return `
        <rect x="180" y="180" width="240" height="160" rx="16" fill="url(#screen)" stroke="url(#lineG)" stroke-width="2"/>
        <rect x="300" y="200" width="80" height="52" rx="6" fill="#0B1220"/>
        <rect x="312" y="212" width="24" height="28" rx="3" fill="#0EA5E9"/>
        <rect x="344" y="212" width="24" height="28" rx="3" fill="#0EA5E9"/>
        <text x="300" y="310" text-anchor="middle" font-family="'Segoe UI',sans-serif" font-size="22" font-weight="700" fill="#ffffff" opacity="0.85">NVMe</text>`;
    case "Power":
      return `
        <rect x="210" y="150" width="180" height="300" rx="30" fill="url(#screen)" stroke="url(#lineG)" stroke-width="2"/>
        <rect x="232" y="178" width="136" height="190" rx="14" fill="#0B1220"/>
        <rect x="240" y="186" width="120" height="120" rx="10" fill="none" stroke="#0EA5E9" stroke-width="3" opacity="0.7"/>
        <text x="300" y="275" text-anchor="middle" font-family="'Segoe UI',sans-serif" font-size="34" font-weight="800" fill="#22d3ee">%</text>
        <rect x="260" y="390" width="80" height="10" rx="5" fill="#0B1220"/>
        <circle cx="300" cy="452" r="14" fill="#0B1220"/>
        <circle cx="300" cy="452" r="7" fill="#F59E0B"/>`;
    case "School":
      return `
        <rect x="185" y="300" width="230" height="42" rx="8" fill="#0B1220"/>
        <rect x="185" y="268" width="230" height="42" rx="8" fill="url(#screen)"/>
        <rect x="185" y="236" width="230" height="42" rx="8" fill="url(#screen)"/>
        <rect x="185" y="204" width="230" height="42" rx="8" fill="url(#screen)"/>
        <rect x="150" y="170" width="300" height="150" rx="10" fill="none" stroke="#0EA5E9" stroke-width="2" opacity="0.4"/>
        <path d="M 300 170 L 300 140" stroke="#0EA5E9" stroke-width="8" stroke-linecap="round"/>
        <rect x="275" y="130" width="50" height="10" rx="5" fill="#e0f2fe"/>`;
    case "Grocery":
      return `
        <path d="M 210 470 L 175 210 Q 175 160 300 160 Q 425 160 425 210 L 390 470 Z" fill="url(#screen)" stroke="url(#lineG)" stroke-width="2"/>
        <path d="M 225 220 Q 225 120 300 120 Q 375 120 375 220" fill="none" stroke="#0EA5E9" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
        <circle cx="205" cy="200" r="16" fill="#0B1220"/>
        <circle cx="395" cy="200" r="16" fill="#0B1220"/>
        <path d="M 260 300 L 340 380 M 340 300 L 260 380" stroke="#0B1220" stroke-width="8" stroke-linecap="round" opacity="0.7"/>`;
    default:
      return `
        <rect x="170" y="170" width="260" height="200" rx="16" fill="url(#screen)" stroke="url(#lineG)" stroke-width="2"/>`;
  }
}

let gi = 0;
for (const [slug, name, category] of PRODUCTS) {
  const c = pickGradient(gi++);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.from}"/>
      <stop offset="100%" stop-color="${c.to}"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.from}"/>
      <stop offset="100%" stop-color="${c.to}"/>
    </linearGradient>
    <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0%" stop-color="${c.glow}"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <rect width="600" height="600" fill="url(#glow)"/>
  <g filter="drop-shadow(0 24px 48px rgba(2,6,23,0.45))">
    ${shapeFor(category)}
  </g>
  <circle cx="540" cy="70" r="90" fill="#ffffff" opacity="0.06"/>
  <circle cx="70" cy="540" r="120" fill="#ffffff" opacity="0.06"/>
  <text x="300" y="545" text-anchor="middle" font-family="'Segoe UI',sans-serif" font-size="30" font-weight="800" fill="#ffffff">${name}</text>
  <text x="300" y="575" text-anchor="middle" font-family="'Segoe UI',sans-serif" font-size="16" font-weight="500" fill="#e0f2fe" opacity="0.8">${category}</text>
</svg>`;
  writeFileSync(join(outDir, `${slug}.svg`), svg);
  console.log(`wrote ${slug}.svg`);
}

writeFileSync(join(outDir, "_count.txt"), String(PRODUCTS.length));
console.log(`Generated ${PRODUCTS.length} product images in ${outDir}`);
