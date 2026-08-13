import fs from "node:fs";
import path from "node:path";

/**
 * Link real per-product photos dropped into public/images/catalog/products/
 * to matching products, then propagate the photo to every variant of the same
 * product group (within the same category). Handles double/mixed extensions
 * like "cat_b_food-flask_1.jpg.jpg" and renames them to "<id><ext>".
 *
 *   node scripts/apply-product-images.mjs           (local catalog update only)
 *   node scripts/apply-product-images.mjs --apply   (also upsert to Supabase)
 */
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const PRODUCTS_DIR = path.resolve("public/images/catalog/products");
const VALID_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const productsPath = path.resolve("data/catalog-products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
const byId = new Map(products.map((p) => [p.id, p]));

fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
const files = fs.readdirSync(PRODUCTS_DIR).filter((f) => !f.startsWith("."));

// ---- match dropped files to product ids (strip all trailing extensions) ----
function findId(name) {
  let s = name;
  while (s.includes(".")) {
    s = s.slice(0, s.lastIndexOf("."));
    if (byId.has(s)) return s;
  }
  return null;
}

const dropped = new Map(); // id -> image path
const unknown = [];
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!VALID_EXTS.has(ext)) {
    unknown.push(file + " (unsupported extension)");
    continue;
  }
  const id = findId(file);
  if (!id) {
    unknown.push(file);
    continue;
  }
  const cleanName = id + ext;
  if (cleanName !== file) fs.renameSync(path.join(PRODUCTS_DIR, file), path.join(PRODUCTS_DIR, cleanName));
  dropped.set(id, "/images/catalog/products/" + cleanName);
}

// ---- group fallback: first dropped photo per (group, category) ----
const groupFallback = new Map(); // "group|category" -> image
for (const [id, image] of dropped) {
  const p = byId.get(id);
  if (!p) continue;
  const key = (p.group || "") + "|" + (p.category || "");
  if (!groupFallback.has(key)) groupFallback.set(key, image);
}

// ---- apply own photo or group fallback to every product ----
const changed = [];
const targets = []; // every product that should carry an assigned photo
for (const p of products) {
  const own = dropped.get(p.id);
  const fallback = groupFallback.get((p.group || "") + "|" + (p.category || ""));
  const target = own || fallback || null;
  if (target) targets.push({ id: p.id, group: p.group, category: p.category, title: p.title, image: target });
  if (target && target !== p.image) {
    p.image = target;
    p.updatedAt = new Date().toISOString();
    changed.push({ id: p.id, group: p.group, category: p.category, title: p.title, image: target });
  }
}

if (changed.length) {
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), "utf8");
}
console.log("Dropped files: " + dropped.size + ", unmatched: " + unknown.length);
for (const u of unknown) console.log("  UNMATCHED: " + u);
console.log("Products updated: " + changed.length);
const byGroup = {};
for (const c of changed) byGroup[c.group] = (byGroup[c.group] || 0) + 1;
for (const [g, n] of Object.entries(byGroup)) console.log("  " + g + ": " + n + " variant(s) -> " + changed.find((c) => c.group === g).image);

if (!APPLY) {
  console.log("Local catalog updated. Run with --apply to sync images to Supabase.");
  process.exit(0);
}

// ---- upsert target products to Supabase ----
const toPush = targets;
if (toPush.length === 0) {
  console.log("No products to push.");
  process.exit(0);
}
{
  const envPath = path.resolve(".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    process.exit(1);
  }
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key);
  const ids = new Set(toPush.map((c) => c.id));
  const PRICING_SPEC_LABELS = {
    type: "Type",
    measure: "Measure",
    costQty: "Cost Qty",
    costUnitPrice: "Cost Unit Price",
    costAmount: "Cost Amount",
    sellPcs: "Sell Pcs",
    sellUnitPrice: "Sell Unit Price",
    sellAmount: "Sell Amount",
    profit: "Expected Gain"
  };
  const PRICING_KEYS = Object.keys(PRICING_SPEC_LABELS);
  const PRICING_VALUES = Object.values(PRICING_SPEC_LABELS);
  const isPricingSpec = (label) => PRICING_VALUES.includes(label);
  const pricingSpecs = (p) =>
    PRICING_KEYS.map((k) => {
      const v = p[k];
      return v === undefined || v === "" || v === null ? null : { label: PRICING_SPEC_LABELS[k], value: String(v) };
    }).filter(Boolean);
  const seedRowFor = (p) => {
    const { type, measure, costQty, costUnitPrice, costAmount, sellPcs, sellUnitPrice, sellAmount, profit, ...rest } = p;
    void type; void measure; void costQty; void costUnitPrice; void costAmount;
    void sellPcs; void sellUnitPrice; void sellAmount; void profit;
    const baseSpecs = (p.specs || []).filter((s) => !isPricingSpec(s.label));
    const row = { ...rest, specs: [...baseSpecs, ...pricingSpecs(p)] };
    return {
      ...row,
      brand: row.brand ?? "",
      price: row.price ?? 0,
      stock: row.stock ?? 0,
      rating: row.rating ?? 0,
      reviews: row.reviews ?? 0,
      image: row.image ?? "",
      gallery: row.gallery ?? [],
      shortDescription: row.shortDescription ?? "",
      description: row.description ?? "",
      specs: row.specs ?? [],
      featured: row.featured ?? false,
      tags: row.tags ?? [],
      miniStore: row.miniStore ?? false
    };
  };
  const rows = products.filter((p) => ids.has(p.id)).map(seedRowFor);
  let ok = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const slice = rows.slice(i, i + 100);
    const { error } = await sb.from("products").upsert(slice, { onConflict: "id" });
    if (error) {
      console.error("Chunk failed:", error.message);
      process.exitCode = 1;
      break;
    }
    ok += slice.length;
  }
  console.log(ok === rows.length ? "Done: " + ok + " products updated in Supabase." : "Incomplete.");
}
