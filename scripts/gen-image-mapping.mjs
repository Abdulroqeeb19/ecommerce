import fs from "node:fs";

const products = JSON.parse(fs.readFileSync("data/catalog-products.json", "utf8"));
const esc = (s) => '"' + String(s == null ? "" : s).replace(/"/g, '""') + '"';

let csv = "id,rename_photo_to,category,group,title,current_image\n";
for (const p of [...products].sort((a, b) => (a.category || "").localeCompare(b.category || "") || (a.group || "").localeCompare(b.group || "") || (a.title || "").localeCompare(b.title || ""))) {
  csv +=
    [esc(p.id), esc(p.id + ".jpg"), esc(p.category), esc(p.group || ""), esc(p.title || ""), esc(p.image || "")].join(",") +
    "\n";
}
fs.writeFileSync("data/image-mapping.csv", csv);
console.log("Written data/image-mapping.csv with " + products.length + " rows.");
console.log("rename_photo_to = the filename to drop into public/images/catalog/products/");