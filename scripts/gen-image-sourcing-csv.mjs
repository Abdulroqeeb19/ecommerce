import fs from "node:fs";

const products = JSON.parse(fs.readFileSync("data/catalog-products.json", "utf8"));
const groupMap = JSON.parse(fs.readFileSync("data/catalog-group-images.json", "utf8"));

const webDir = fs.existsSync("public/images/catalog/web")
  ? fs.readdirSync("public/images/catalog/web").filter((f) => !f.startsWith("."))
  : [];

const esc = (s) => {
  s = String(s == null ? "" : s);
  return '"' + s.replace(/"/g, '""') + '"';
};

let csv = "category,id,group,title,status,current_image,suggested_image,suggested_exists\n";
let matched = 0;
let unmatched = 0;
const missingGroups = new Set();

for (const x of products) {
  const g = x.group || "";
  const sug = groupMap[g] ? groupMap[g].image : "";
  const exists = sug ? webDir.includes(sug.split("/").pop()) : false;
  if (exists) matched++;
  else {
    unmatched++;
    if (sug) missingGroups.add(g + " -> " + sug);
    else missingGroups.add(g + " -> (none)");
  }
  const status = x.image.includes("placeholder") ? "NO-IMAGE" : "MISMATCH";
  csv +=
    [esc(x.category || ""), esc(x.id), esc(g), esc(x.title || ""), esc(status), esc(x.image || ""), esc(sug), exists ? "YES" : "NO"].join(",") +
    "\n";
}

fs.writeFileSync("data/product-image-sourcing.csv", csv);
console.log("CSV written: data/product-image-sourcing.csv");
console.log("suggested image exists for " + matched + " products, missing for " + unmatched);
if (missingGroups.size) {
  console.log("Groups without an existing web image (" + missingGroups.size + "):");
  for (const g of missingGroups) console.log("  " + g);
}
