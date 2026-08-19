import fs from "node:fs";

const products = JSON.parse(fs.readFileSync("data/catalog-products.json", "utf8"));
const bySlug = new Map();
const byId = new Map();
const priceZero = [];
const noGroup = [];
const dupSlug = [];
const dupId = [];
const badCat = new Set();
const validCats = new Set(["Home Essentials", "Kitchen Utensils", "Electrical Materials and Fittings", "Babies Wears"]);

for (const p of products) {
  if (byId.has(p.id)) dupId.push(p.id);
  else byId.set(p.id, p);
  if (bySlug.has(p.slug)) dupSlug.push(p.slug + " (" + p.id + ")");
  else bySlug.set(p.slug, p);
  if (p.price === 0 || p.price == null) priceZero.push(p.id);
  if (!p.group) noGroup.push(p.id);
  if (!validCats.has(p.category)) badCat.add(p.category + " -> " + p.id);
}

console.log("total products:", products.length);
console.log("duplicate ids:", dupId.length, dupId.slice(0, 10));
console.log("duplicate slugs:", dupSlug.length, dupSlug.slice(0, 10));
console.log("price 0:", priceZero.length);
console.log("missing group:", noGroup.length, noGroup.slice(0, 10));
console.log("bad category:", [...badCat]);

const groupCount = new Map();
for (const p of products) groupCount.set(p.group, (groupCount.get(p.group) || 0) + 1);
const bigGroups = [...groupCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log("largest groups:", bigGroups.map(([g, n]) => g + "=" + n).join(", "));