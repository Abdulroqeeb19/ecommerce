import fs from "node:fs";
import path from "node:path";

/**
 * Apply prices from a filled-in worksheet CSV to catalog-products.json and
 * optionally upsert to Supabase.
 *
 *   node scripts/apply-prices.mjs data/price-worksheet.csv            (local only)
 *   node scripts/apply-prices.mjs data/price-worksheet.csv --apply    (also to Supabase)
 *
 * CSV columns: id,category,group,title,current_price,new_price
 * Rows with a non-empty, numeric new_price are applied.
 */
const argv = process.argv.slice(2);
const CSV_PATH = path.resolve(argv.find((a) => a.includes(".csv")) || "data/price-worksheet.csv");
const APPLY = argv.includes("--apply");

const lines = fs.readFileSync(CSV_PATH, "utf8").split(/\r?\n/).filter(Boolean);
const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
const idIdx = header.indexOf("id");
const priceIdx = header.indexOf("new_price");
if (idIdx < 0 || priceIdx < 0) {
  console.error("CSV must have id and new_price columns. Header:", header.join(","));
  process.exit(1);
}

const prices = new Map();
let filled = 0;
for (const line of lines.slice(1)) {
  // naive CSV parse (handles quoted fields, no embedded newlines)
  const cells = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  const id = (cells[idIdx] || "").trim();
  const raw = (cells[priceIdx] || "").trim();
  if (id && raw) {
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) {
      prices.set(id, n);
      filled++;
    }
  }
}
console.log("Parsed " + filled + " price rows from " + CSV_PATH);

const productsPath = path.resolve("data/catalog-products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
let changed = 0;
let notFound = 0;
for (const p of products) {
  if (prices.has(p.id)) {
    if (p.price !== prices.get(p.id)) {
      p.price = prices.get(p.id);
      p.updatedAt = new Date().toISOString();
      changed++;
    }
  } else if (filled > 0) {
    notFound++;
  }
}
console.log("Updated local catalog-products.json: changed=" + changed + " (unmatched ids=" + notFound + ")");
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), "utf8");

if (!APPLY) {
  console.log("Local update done. Run with --apply to upsert prices to Supabase.");
  process.exit(0);
}

// --- upsert to Supabase ---
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
  const rows = products.filter((p) => prices.has(p.id));
  let ok = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const slice = rows.slice(i, i + 100).map((p) => ({ id: p.id, price: p.price, updatedAt: p.updatedAt }));
    const { error } = await sb.from("products").upsert(slice, { onConflict: "id" });
    if (error) {
      console.error("Chunk failed:", error.message);
      process.exitCode = 1;
      break;
    }
    ok += slice.length;
  }
  console.log(ok === rows.length ? "Done: " + ok + " products priced in Supabase." : "Incomplete.");
}
