/**
 * Seed the Supabase backend with the 54 school-shop items (mini-store catalog)
 * from src/lib/schoolItems.ts, and remove any stray legacy mini-store items so
 * the mini-store only shows the official school list.
 *
 *   node scripts/import-school-items.mjs --preview   (print what would change)
 *   node scripts/import-school-items.mjs --apply     (upsert + clean up live Supabase)
 *
 * Pricing fields are merged into the specs JSONB column (see toSchoolRow) since
 * the Supabase products table has no scalar columns for them.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SCHOOL_SHOP_ITEMS, SCHOOL_ITEM_IDS, toSchoolRow } from "../src/lib/schoolItems.ts";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const PREVIEW = argv.includes("--preview") || !APPLY;

function seedRowFor(p) {
  const row = toSchoolRow(p);
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
}

{
  const envPath = path.resolve(".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

if (PREVIEW) {
  console.log(`Preview: ${SCHOOL_SHOP_ITEMS.length} school items would be upserted.`);
  console.log("Stray legacy mini-store items would be deleted:");
  if (!APPLY) console.log("(run with --apply to upsert and clean up live Supabase)");
}

if (APPLY) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.");
    process.exit(1);
  }
  const sb = createClient(url, key);

  // 1. Delete stray legacy mini-store items not in the official school list.
  const { data: existing, error: fetchErr } = await sb.from("products").select("id,title").eq("miniStore", true);
  if (fetchErr) {
    console.error("Could not list mini-store products:", fetchErr.message);
    process.exit(1);
  }
  const strays = (existing || []).filter((r) => !SCHOOL_ITEM_IDS.has(String(r.id)));
  for (const stray of strays) {
    console.log(`Deleting stray mini-store item: ${stray.id} | ${stray.title}`);
    const { error: delErr } = await sb.from("products").delete().eq("id", stray.id);
    if (delErr) {
      console.error(`Delete failed for ${stray.id}:`, delErr.message);
    } else {
      await sb.from("deleted_products").upsert({ id: stray.id, deletedAt: new Date().toISOString() }, { onConflict: "id" });
    }
  }

  // 2. Upsert the official school items.
  const rows = SCHOOL_SHOP_ITEMS.map(seedRowFor);
  const chunk = 100;
  let ok = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await sb.from("products").upsert(slice, { onConflict: "id" });
    if (error) {
      console.error(`Chunk ${i / chunk} failed:`, error.message);
      process.exitCode = 1;
      break;
    }
    ok += slice.length;
    console.log(`upserted ${ok}/${rows.length}`);
  }
  console.log(
    ok === rows.length
      ? `Done: ${ok} school items seeded, ${strays.length} stray item(s) removed.`
      : "Incomplete - see errors above."
  );
}
