import fs from "node:fs";
import cp from "node:child_process";

const files = cp
  .execSync('git ls-files "src/**/*.{ts,tsx,mjs,js,css}" "data/*.json" "public/images/**"', { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((f) => !f.startsWith("public/images/")); // skip the image files themselves

const refs = new Set();
for (const f of files) {
  const txt = fs.readFileSync(f, "utf8");
  const re = /\/images\/[A-Za-z0-9_/.\-]+/g;
  let m;
  while ((m = re.exec(txt))) {
    let v = m[0];
    v = v.replace(/["'`)]*$/, "");
    if (v.startsWith("/images/") && !v.endsWith(".{") && !v.includes("{{")) refs.add(v);
  }
}

const missing = [];
for (const r of refs) {
  const p = "public" + r;
  if (!fs.existsSync(p)) missing.push(r);
}
console.log("unique image refs in code:", refs.size);
console.log("missing on disk:", missing.length);
for (const r of [...refs].sort()) {
  if (!fs.existsSync("public" + r)) console.log("  MISSING: " + r);
}