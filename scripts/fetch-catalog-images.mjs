/**
 * Fetch a representative image for each catalog product group from Wikimedia
 * Commons (free-licensed photos), download it into public/images/catalog/web/,
 * and record source/license so it can be reviewed before applying.
 *
 *   node scripts/fetch-catalog-images.mjs --preview
 *     Downloads images + writes data/catalog-group-images.json (default).
 *   node scripts/fetch-catalog-images.mjs --apply
 *     Also updates the products in the live Supabase store with the new images.
 *
 * Wikimedia Commons images carry a free license (CC0 / CC-BY / CC-BY-SA ...).
 * The manifest records LicenseShortName and Artist per image so attribution
 * can be shown or verified. Review the manifest before going live.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// --- resolve args ---
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
let DRAFT = "C:/Users/user/AppData/Local/Temp/opencode/catalog_draft.json";
let OUT = path.resolve("data/catalog-group-images.json");
let IMG_DIR = path.resolve("public/images/catalog/web");
let PRODUCTS = path.resolve("data/catalog-products.json");
const outIdx = argv.indexOf("--out");
if (outIdx >= 0 && argv[outIdx + 1]) OUT = path.resolve(argv[outIdx + 1]);
const draftIdx = argv.indexOf("--draft");
if (draftIdx >= 0 && argv[draftIdx + 1]) DRAFT = argv[draftIdx + 1];

const UA = "AyindedunnyCatalogFetcher/1.0 (image matching script)";
const THUMB_WIDTH = 800;
const DELAY_MS = 2000; // be gentle with the Commons API
const MAX_RETRIES = 5;

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Retries a fetch on rate limits (429) and transient network errors. */
async function fetchWithBackoff(url, tries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA } });
    } catch {
      // network-level failure — wait and retry
      await new Promise((r) => setTimeout(r, DELAY_MS * attempt));
      continue;
    }
    if (res.ok) return res;
    if ((res.status === 429 || res.status === 503) && attempt < tries) {
      await new Promise((r) => setTimeout(r, DELAY_MS * attempt * 2));
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error("retries exhausted");
}

async function searchCommons(query, limit = 5) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}` +
    `&gsrnamespace=6&gsrlimit=${limit}` +
    "&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=" + THUMB_WIDTH +
    "&format=json&origin=*";
  const res = await fetchWithBackoff(url);
  const json = await res.json();
  const pages = Object.values(json.query?.pages || {});
  return pages
    .filter((p) => p.imageinfo?.[0]?.thumburl)
    .map((p) => {
      const md = p.imageinfo[0].extmetadata || {};
      return {
        title: p.title,
        thumbUrl: p.imageinfo[0].thumburl,
        license: (md.LicenseShortName?.value || "").trim(),
        artist: (md.Artist?.value || "").replace(/<[^>]+>/g, "").trim().slice(0, 120)
      };
    });
}

async function download(url, destPath) {
  const res = await fetchWithBackoff(url);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 512) throw new Error("File too small (likely an error page)");
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

// --- build the unique group list from the draft ---
const catalog = JSON.parse(fs.readFileSync(DRAFT, "utf-8"));
const groupsByName = new Map();
for (const g of Object.values(catalog.groups)) {
  const name = g.generic.trim();
  if (!groupsByName.has(name)) groupsByName.set(name, g.category);
}
const groups = Array.from(groupsByName.entries()).sort((a, b) => a[0].localeCompare(b[0]));
console.log(`${groups.length} unique product groups to fetch.`);

// --- fetch / reuse images ---
const manifest = {};
let fetched = 0;
let reused = 0;
let failed = 0;

for (const [name, category] of groups) {
  const slug = slugify(name);
  const ext = "jpg";
  const local = `/images/catalog/web/${slug}.${ext}`;
  const diskPath = path.join(IMG_DIR, `${slug}.${ext}`);

  if (fs.existsSync(diskPath) && fs.statSync(diskPath).size > 512) {
    manifest[name] = { image: local, reused: true };
    reused += 1;
    continue;
  }

  let picked = null;
  try {
    const results = await searchCommons(name);
    // Prefer real photos (JPG), skip vector/icon files and duplicates.
    picked = results.find((r) => /\.(jpg|jpeg)$/i.test(r.thumbUrl)) || results[0] || null;
    if (picked) {
      const bytes = await download(picked.thumbUrl.split("?")[0], diskPath);
      if (bytes > 0) {
        manifest[name] = {
          image: local,
          category,
          source: "wikimedia-commons",
          file: picked.title,
          license: picked.license || "",
          artist: picked.artist || "",
          width: THUMB_WIDTH
        };
        fetched += 1;
        console.log(`✓ ${name} (${category})`);
      }
    } else {
      failed += 1;
      console.log(`✗ ${name} — no image found`);
    }
  } catch (e) {
    failed += 1;
    console.log(`✗ ${name} — ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, DELAY_MS));
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2), "utf-8");
console.log(`\nFetched ${fetched}, reused ${reused}, failed ${failed}. Manifest -> ${OUT}`);

if (!APPLY) {
  console.log("(run with --apply to update product images in Supabase)");
  process.exit(0);
}

// --- apply: set group images on catalog products & upsert to Supabase ---
if (APPLY) {
  // load .env.local (manual, dependency-free)
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
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.");
    process.exit(1);
  }
  const sb = createClient(url, key);
  const products = JSON.parse(fs.readFileSync(PRODUCTS, "utf-8"));
  const updates = [];
  for (const p of products) {
    const entry = manifest[p.group];
    if (entry && entry.image) updates.push({ id: p.id, image: entry.image, updatedAt: new Date().toISOString() });
  }
  console.log(`Applying images to ${updates.length} product rows…`);
  const chunk = 100;
  let ok = 0;
  for (let i = 0; i < updates.length; i += chunk) {
    const slice = updates.slice(i, i + chunk);
    for (const row of slice) {
      const { error } = await sb.from("products").update({ image: row.image, updatedAt: row.updatedAt }).eq("id", row.id);
      if (error) {
        console.error(`Update ${row.id} failed:`, error.message);
        process.exitCode = 1;
        break;
      }
      ok += 1;
    }
    console.log(`updated ${ok}/${updates.length}`);
  }
  console.log(ok === updates.length ? `Done: ${ok} products updated.` : "Incomplete - see errors above.");
}
