/**
 * Import the store owner's Excel inventory (catalog_draft.json) into the
 * product store as real Product rows.
 *
 *   node scripts/import-catalog.mjs --preview --out data/catalog-products.json
 *   node scripts/import-catalog.mjs --apply   (upserts to live Supabase)
 *
 * Each Excel row becomes one Product row:
 *   - title      = variant label + type/description
 *   - group      = generic product name (used by the shop dropdown card)
 *   - category   = Home Essentials (or legacy "Kitchen Utensils") | Electrical Materials and Fittings | Babies Wears
 *   - stock      = qty from sheet
 *   - price      = 0 (Amount column is empty in the sheet - owner fixes prices later)
 *   - image      = mapped catalog image or category placeholder
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// --- resolve args ---
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const PREVIEW = argv.includes("--preview");
let DRAFT = "C:/Users/user/AppData/Local/Temp/opencode/catalog_draft.json";
let OUT = path.resolve("data/catalog-products.json");
const outIdx = argv.indexOf("--out");
if (outIdx >= 0 && argv[outIdx + 1]) OUT = path.resolve(argv[outIdx + 1]);
const draftIdx = argv.indexOf("--draft");
if (draftIdx >= 0 && argv[draftIdx + 1]) DRAFT = argv[draftIdx + 1];

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Generic-name -> dedicated image mapping (reuses existing curated assets).
const IMAGE_BY_GROUP = {
  POT: "/images/catalog/pot.png",
  "PRESSURE POT": "/images/catalog/pot.png",
  "STOCK POT": "/images/catalog/pot.png",
  PLATE: "/images/catalog/plate.png",
  "BREAKABLE PLATE": "/images/catalog/plate.png",
  "UNBREAKABLE PLATE": "/images/catalog/plate.png",
  "UNBREAKABLE DISH": "/images/catalog/plate.png",
  "UNBREAKABLE TRAY": "/images/catalog/plate.png",
  "TAKEAWAY PLATE": "/images/catalog/plate.png",
  "PLATE RACK": "/images/catalog/plate.png",
  SPOON: "/images/catalog/spoon.png",
  "KITCHEN SPOON": "/images/catalog/spoon.png",
  "SPOON HOLDER": "/images/catalog/spoon.png",
  BLENDER: "/images/catalog/blender.png",
  COOLER: "/images/catalog/cooler.png",
  "FOOD FLASK": "/images/catalog/cooler.png",
  BAG: "/images/catalog/bag.png",
  "SHOE RACK": "/images/catalog/shoe.png",
  "BABY CARE": "/images/catalog/babies-wear.png",
  SOCKET: "/images/catalog/sockets.png",
  PLUG: "/images/catalog/sockets.png",
  SWITCH: "/images/catalog/sockets.png",
  "LAMP - SOLAR": "/images/catalog/solar.png",
  SOLAR: "/images/catalog/solar.png",
  LAMPHOLDER: "/images/catalog/sockets.png",
  "EXTENTION WIRE": "/images/catalog/sockets.png",
  "KNIFE SWITCH": "/images/catalog/sockets.png",
  BATTERY: "/images/catalog/solar.png"
};

function imageFor(group, category, baby) {
  if (baby) return "/images/catalog/babies-placeholder.svg";
  const mapped = IMAGE_BY_GROUP[group];
  if (mapped) return mapped;
  if (category === "Electrical Materials and Fittings") return "/images/catalog/electrical-placeholder.svg";
  return "/images/catalog/kitchen-placeholder.svg";
}

function buildProducts(catalog) {
  const products = [];
  for (const g of Object.values(catalog.groups)) {
    const groupName = g.generic.trim();
    const category = g.category;
    g.variants.forEach((v, i) => {
      const base = slugify(groupName);
      const variantSlug = slugify(`${v.label} ${v.desc}`.trim());
      const title = [v.label, v.desc].filter(Boolean).join(" - ") || groupName;
      const babyCat = v.baby ? "Babies Wears" : category;
      const catCode = babyCat === "Kitchen Utensils" || babyCat === "Home Essentials" ? "k" : babyCat === "Electrical Materials and Fittings" ? "e" : "b";
      const id = `cat_${catCode}_${base}_${i + 1}`;
      products.push({
        id,
        slug: `${base}-${variantSlug || i + 1}`,
        title: title.length > 190 ? title.slice(0, 190) : title,
        category: babyCat,
        group: groupName,
        brand: "",
        price: 0,
        oldPrice: undefined,
        stock: v.qty ?? 0,
        rating: 0,
        reviews: 0,
        image: imageFor(groupName.toUpperCase(), category, v.baby),
        gallery: [],
        shortDescription: `${groupName}${v.desc ? ` - ${v.desc}` : ""}`.slice(0, 300),
        description: `${groupName}: ${title}. In stock. Quantity available: ${v.qty ?? "n/a"}.`,
        specs: [
          ...(v.label ? [{ label: "Model", value: v.label }] : []),
          ...(v.desc ? [{ label: "Details", value: v.desc }] : []),
          ...(v.qty != null ? [{ label: "Available", value: String(v.qty) }] : [])
        ],
        badge: undefined,
        featured: false,
        tags: [groupName.toLowerCase(), category.toLowerCase(), ...(v.baby ? ["babies", "baby"] : [])].slice(0, 30),
        miniStore: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  }
  return products;
}

// --- load draft & build rows ---
const catalog = JSON.parse(fs.readFileSync(DRAFT, "utf-8"));
const products = buildProducts(catalog);
const dedupedBySlug = new Map();
for (const p of products) {
  if (dedupedBySlug.has(p.slug)) {
    // clash: make slug unique
    const base = p.slug;
    let n = 2;
    while (dedupedBySlug.has(`${base}-${n}`)) n++;
    p.slug = `${base}-${n}`;
  }
  dedupedBySlug.set(p.slug, true);
}

// load .env.local when present (manual, dependency-free)
{
  const envPath = path.resolve(".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

if (PREVIEW || !APPLY) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(products, null, 2), "utf-8");
  const byCat = {};
  for (const p of products) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log(`Preview wrote ${products.length} products -> ${OUT}`);
  console.log("By category:", byCat);
  if (!APPLY) {
    console.log("(run with --apply to upsert into the live store)");
    process.exit(0);
  }
}

// --- apply: upsert to Supabase ---
if (APPLY) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.");
    process.exit(1);
  }
  const sb = createClient(url, key);
  // chunk to avoid huge payloads
  const chunk = 100;
  let ok = 0;
  for (let i = 0; i < products.length; i += chunk) {
    const slice = products.slice(i, i + chunk);
    const { error } = await sb.from("products").upsert(slice, { onConflict: "id" });
    if (error) {
      console.error(`Chunk ${i / chunk} failed:`, error.message);
      process.exitCode = 1;
      break;
    }
    ok += slice.length;
    console.log(`upserted ${ok}/${products.length}`);
  }
  console.log(ok === products.length ? `Done: ${ok} products imported.` : "Incomplete - see errors above.");
}