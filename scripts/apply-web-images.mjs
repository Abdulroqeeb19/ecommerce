import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");

const PRODUCTS = path.resolve("data/catalog-products.json");
const GROUP_MAP = path.resolve("data/catalog-group-images.json");

const products = JSON.parse(fs.readFileSync(PRODUCTS, "utf8"));
const groupMap = JSON.parse(fs.readFileSync(GROUP_MAP, "utf8"));

const webDir = fs.existsSync("public/images/catalog/web")
  ? fs.readdirSync("public/images/catalog/web")
  : [];

let changed = 0;
let missing = 0;
for (const p of products) {
  const sug = groupMap[p.group] ? groupMap[p.group].image : "";
  if (!sug) {
    missing++;
    continue;
  }
  const file = sug.split("/").pop();
  if (!webDir.includes(file)) {
    missing++;
    continue;
  }
  if (p.image !== sug) {
    p.image = sug;
    p.updatedAt = new Date().toISOString();
    changed++;
  }
}

fs.writeFileSync(PRODUCTS, JSON.stringify(products, null, 2), "utf8");
console.log(`Updated images in ${PRODUCTS}: changed=${changed} unchanged=${products.length - changed} missingGroupImage=${missing}`);

if (!APPLY) {
  console.log("Dry run: file updated locally. Run with --apply to also upsert to Supabase.");
  process.exit(0);
}

// --- apply to Supabase ---
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
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.");
    process.exit(1);
  }
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key);
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
  console.log(ok === products.length ? `Done: ${ok} products updated with web images.` : "Incomplete - see errors above.");
}
