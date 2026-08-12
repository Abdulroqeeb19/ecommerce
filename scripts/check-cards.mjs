import fs from "node:fs";
const env = {};
for (const line of fs.readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: cc, error: ce } = await sb.from("category_cards").select("*");
if (ce) console.log("cat cards ERROR", ce.message);
else {
  console.log("--- category_cards (" + cc.length + ") ---");
  for (const c of cc) console.log(c.id, "|", c.name, "|", c.image, "| active:", c.active, "| sort:", c.sortOrder);
}

const { data: ci, error: ie } = await sb.from("catalog_items").select("*");
if (ie) console.log("cat items ERROR", ie.message);
else {
  console.log("\n--- catalog_items (" + ci.length + ") ---");
  for (const c of ci) console.log(c.id, "|", c.name, "|", c.image, "| active:", c.active, "| sort:", c.sortOrder);
}
