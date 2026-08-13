import fs from "node:fs";

const products = JSON.parse(fs.readFileSync("data/catalog-products.json", "utf8"));
const esc = (s) => '"' + String(s == null ? "" : s).replace(/"/g, '""') + '"';

// CSV with a blank "new_price" column for the owner to fill in.
let csv = "id,category,group,title,current_price,new_price\n";
for (const p of products) {
  csv += [esc(p.id), esc(p.category), esc(p.group || ""), esc(p.title || ""), String(p.price ?? 0), ""].join(",") + "\n";
}
fs.writeFileSync("data/price-worksheet.csv", csv);
console.log("Written data/price-worksheet.csv with " + products.length + " rows (new_price left blank).");
console.log("Fill new_price per row, then run: node scripts/apply-prices.mjs <csv> --apply");
