import type { Product, ProductSpec } from "./types";

/**
 * School shop items imported from "School Shop Items List.xlsx".
 *
 * Column mapping (from the workbook):
 *   General Name -> group | Type -> type | Measure -> measure
 *   Cost Prize: Qty -> costQty, Unit Price -> costUnitPrice, Amount -> costAmount
 *   Selling Prize: Pcs -> sellPcs, Unit Price -> sellUnitPrice, Amount -> sellAmount
 *   Gaining -> profit  (expected profit = sellAmount - costAmount)
 *
 * Prices are stored in Naira exactly as they appear in the workbook.
 * Students only ever see title, type and sellUnitPrice; the cost and profit
 * fields are used for manager/admin follow-up only.
 */

const IMG = "/images/products/school-item-placeholder.svg";
const BRAND = "AYINDEDUNNY ENTERPRISE";

interface SchoolItemRow {
  group: string;
  type?: string;
  measure?: string;
  costQty: number;
  costUnitPrice: number;
  sellPcs: number;
  sellUnitPrice: number;
  category: "Snacks and Drinks" | "Pantry Staples" | "Personal Care" | "Stationery";
}

const ROWS: SchoolItemRow[] = [
  { group: "Bama", measure: "Roll", costQty: 1, costUnitPrice: 800, sellPcs: 10, sellUnitPrice: 100, category: "Snacks and Drinks" },
  { group: "Biscuit", type: "Fab", measure: "Ctn", costQty: 1, costUnitPrice: 10500, sellPcs: 24, sellUnitPrice: 550, category: "Snacks and Drinks" },
  { group: "Biscuit", type: "Nice", measure: "Ctn", costQty: 1, costUnitPrice: 6700, sellPcs: 24, sellUnitPrice: 400, category: "Snacks and Drinks" },
  { group: "Biscuit", type: "Mix", measure: "Dozen", costQty: 5, costUnitPrice: 1100, sellPcs: 60, sellUnitPrice: 125, category: "Snacks and Drinks" },
  { group: "Biscuit", type: "Honeybeen", measure: "Ctn", costQty: 1, costUnitPrice: 4600, sellPcs: 24, sellUnitPrice: 250, category: "Snacks and Drinks" },
  { group: "Biscuit", type: "Big Munkchin", measure: "Ctn", costQty: 1, costUnitPrice: 9600, sellPcs: 24, sellUnitPrice: 500, category: "Snacks and Drinks" },
  { group: "Biscuit", type: "Small Munkchin", measure: "Ctn", costQty: 0.5, costUnitPrice: 10500, sellPcs: 30, sellUnitPrice: 200, category: "Snacks and Drinks" },
  { group: "Biscuit", type: "Cabin", measure: "Ctn", costQty: 1, costUnitPrice: 3300, sellPcs: 36, sellUnitPrice: 125, category: "Snacks and Drinks" },
  { group: "Bread", type: "Short Bread", measure: "Ctn", costQty: 1, costUnitPrice: 6700, sellPcs: 24, sellUnitPrice: 400, category: "Snacks and Drinks" },
  { group: "Bread 1", measure: "", costQty: 4, costUnitPrice: 800, sellPcs: 4, sellUnitPrice: 1000, category: "Snacks and Drinks" },
  { group: "Bread 2", measure: "", costQty: 5, costUnitPrice: 400, sellPcs: 5, sellUnitPrice: 450, category: "Snacks and Drinks" },
  { group: "Bread 3", measure: "", costQty: 7, costUnitPrice: 350, sellPcs: 7, sellUnitPrice: 400, category: "Snacks and Drinks" },
  { group: "Butter", type: "Peanut", measure: "Roll", costQty: 4, costUnitPrice: 900, sellPcs: 40, sellUnitPrice: 150, category: "Pantry Staples" },
  { group: "Butter", type: "Chocolate Spread", measure: "Roll", costQty: 2, costUnitPrice: 900, sellPcs: 20, sellUnitPrice: 125, category: "Pantry Staples" },
  { group: "Cake", type: "Wao", measure: "Roll", costQty: 2, costUnitPrice: 1200, sellPcs: 20, sellUnitPrice: 200, category: "Snacks and Drinks" },
  { group: "Cake", type: "Snow", measure: "Roll", costQty: 2, costUnitPrice: 1100, sellPcs: 20, sellUnitPrice: 150, category: "Snacks and Drinks" },
  { group: "Chin Chin", type: "Chocolate", measure: "Ctn", costQty: 0.5, costUnitPrice: 8000, sellPcs: 40, sellUnitPrice: 125, category: "Snacks and Drinks" },
  { group: "Chin Chin", type: "Stixi", measure: "Ctn", costQty: 0.5, costUnitPrice: 8000, sellPcs: 40, sellUnitPrice: 125, category: "Snacks and Drinks" },
  { group: "Chin Chin", type: "Phocus", measure: "Pack", costQty: 4, costUnitPrice: 1200, sellPcs: 48, sellUnitPrice: 125, category: "Snacks and Drinks" },
  { group: "Chin Chin", type: "Gala", measure: "Roll", costQty: 1, costUnitPrice: 1800, sellPcs: 10, sellUnitPrice: 200, category: "Snacks and Drinks" },
  { group: "Chin Chin", type: "Rocky Bite - Big", measure: "Roll", costQty: 1, costUnitPrice: 1000, sellPcs: 6, sellUnitPrice: 250, category: "Snacks and Drinks" },
  { group: "Chin Chin", type: "Rocky Bite - Small", measure: "Roll", costQty: 2, costUnitPrice: 750, sellPcs: 16, sellUnitPrice: 125, category: "Snacks and Drinks" },
  { group: "Chin Chin", type: "Rice Snow", measure: "Roll", costQty: 1, costUnitPrice: 900, sellPcs: 10, sellUnitPrice: 125, category: "Snacks and Drinks" },
  { group: "Chips", type: "Party", measure: "Roll", costQty: 2, costUnitPrice: 900, sellPcs: 20, sellUnitPrice: 125, category: "Snacks and Drinks" },
  { group: "Choco", type: "3 in 1", measure: "Roll", costQty: 1, costUnitPrice: 3500, sellPcs: 10, sellUnitPrice: 400, category: "Snacks and Drinks" },
  { group: "Cornflakes", measure: "Roll", costQty: 1, costUnitPrice: 1400, sellPcs: 10, sellUnitPrice: 250, category: "Snacks and Drinks" },
  { group: "Energy Drink", type: "Fearless", measure: "Pack", costQty: 1, costUnitPrice: 4600, sellPcs: 12, sellUnitPrice: 600, category: "Snacks and Drinks" },
  { group: "Gari", measure: "Mudu", costQty: 21, costUnitPrice: 400, sellPcs: 168, sellUnitPrice: 100, category: "Pantry Staples" },
  { group: "Golden Morn", type: "Amazingday", measure: "Roll", costQty: 1, costUnitPrice: 1900, sellPcs: 10, sellUnitPrice: 250, category: "Snacks and Drinks" },
  { group: "Groundnut", measure: "", costQty: 1, costUnitPrice: 2000, sellPcs: 52, sellUnitPrice: 50, category: "Snacks and Drinks" },
  { group: "Indomie 1", measure: "Sachet", costQty: 4, costUnitPrice: 450, sellPcs: 4, sellUnitPrice: 500, category: "Snacks and Drinks" },
  { group: "Indomie 2", measure: "Sachet", costQty: 4, costUnitPrice: 300, sellPcs: 4, sellUnitPrice: 350, category: "Snacks and Drinks" },
  { group: "Indomie 3", measure: "Sachet", costQty: 4, costUnitPrice: 250, sellPcs: 4, sellUnitPrice: 300, category: "Snacks and Drinks" },
  { group: "Milk", type: "Peak", measure: "Roll", costQty: 1, costUnitPrice: 1800, sellPcs: 10, sellUnitPrice: 250, category: "Snacks and Drinks" },
  { group: "Milk", type: "Peak", measure: "Tin", costQty: 3, costUnitPrice: 800, sellPcs: 3, sellUnitPrice: 850, category: "Snacks and Drinks" },
  { group: "Milk", type: "Hollandia", measure: "Roll", costQty: 1, costUnitPrice: 2000, sellPcs: 10, sellUnitPrice: 300, category: "Snacks and Drinks" },
  { group: "Milo", measure: "Roll", costQty: 1, costUnitPrice: 1800, sellPcs: 10, sellUnitPrice: 250, category: "Snacks and Drinks" },
  { group: "Pen", measure: "Pack", costQty: 1, costUnitPrice: 3500, sellPcs: 50, sellUnitPrice: 100, category: "Stationery" },
  { group: "Soap", type: "Washing", measure: "Bar", costQty: 1, costUnitPrice: 1600, sellPcs: 2, sellUnitPrice: 850, category: "Personal Care" },
  { group: "Soap", type: "Detergent", measure: "Roll", costQty: 1, costUnitPrice: 1800, sellPcs: 4, sellUnitPrice: 600, category: "Personal Care" },
  { group: "Soft Drink", type: "Coke", measure: "Pack", costQty: 4, costUnitPrice: 4600, sellPcs: 48, sellUnitPrice: 500, category: "Snacks and Drinks" },
  { group: "Soft Drink", type: "Small Bigi", measure: "Pack", costQty: 4, costUnitPrice: 2400, sellPcs: 48, sellUnitPrice: 300, category: "Snacks and Drinks" },
  { group: "Soft Drink", type: "Maltina", measure: "Pack", costQty: 3, costUnitPrice: 5300, sellPcs: 36, sellUnitPrice: 600, category: "Snacks and Drinks" },
  { group: "Spaghetti", measure: "Sachet", costQty: 3, costUnitPrice: 1000, sellPcs: 3, sellUnitPrice: 1200, category: "Pantry Staples" },
  { group: "Sugar", measure: "Mudu", costQty: 2, costUnitPrice: 3000, sellPcs: 80, sellUnitPrice: 100, category: "Pantry Staples" },
  { group: "Sweet", type: "Small", measure: "Sachet", costQty: 4, costUnitPrice: 450, sellPcs: 180, sellUnitPrice: 16.67, category: "Snacks and Drinks" },
  { group: "Sweet", type: "Chupa Chupa", measure: "Roll", costQty: 4, costUnitPrice: 800, sellPcs: 40, sellUnitPrice: 100, category: "Snacks and Drinks" },
  { group: "Sweet", type: "Robo Choco", measure: "Roll", costQty: 2, costUnitPrice: 600, sellPcs: 20, sellUnitPrice: 70, category: "Snacks and Drinks" },
  { group: "Sweet", type: "Tiktok", measure: "Roll", costQty: 4, costUnitPrice: 250, sellPcs: 20, sellUnitPrice: 100, category: "Snacks and Drinks" },
  { group: "Sweet", type: "Carame", measure: "Pcs", costQty: 2, costUnitPrice: 700, sellPcs: 90, sellUnitPrice: 33.33, category: "Snacks and Drinks" },
  { group: "Sweet", type: "Tom Tom", measure: "", costQty: 1, costUnitPrice: 1000, sellPcs: 48, sellUnitPrice: 50, category: "Snacks and Drinks" },
  { group: "Tin Tomatoes", measure: "Roll", costQty: 1, costUnitPrice: 1200, sellPcs: 10, sellUnitPrice: 250, category: "Pantry Staples" },
  { group: "Vegetable Oil", type: "Power Oil", measure: "Roll", costQty: 1, costUnitPrice: 1800, sellPcs: 10, sellUnitPrice: 300, category: "Pantry Staples" },
  { group: "Water", type: "Bottled", measure: "Pack", costQty: 4, costUnitPrice: 1700, sellPcs: 48, sellUnitPrice: 200, category: "Snacks and Drinks" }
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildSchoolItem(row: SchoolItemRow, index: number): Product {
  const n = index + 1;
  const base = slugify(row.group);
  const typePart = row.type ? slugify(row.type) : "";
  const costAmount = round2(row.costQty * row.costUnitPrice);
  const sellAmount = round2(row.sellPcs * row.sellUnitPrice);
  const profit = round2(sellAmount - costAmount);
  const title = row.type ? `${row.group} (${row.type})` : row.group;
  const supplyType = row.category === "Stationery" ? "supplies" : "grocery";
  const measureText = row.measure ? row.measure : "";

  return {
    id: `msf_${String(n).padStart(2, "0")}`,
    slug: typePart ? `${base}-${typePart}` : `${base}-${n}`,
    title,
    group: row.group,
    category: row.category,
    brand: BRAND,
    price: row.sellUnitPrice,
    stock: 100,
    rating: 0,
    reviews: 0,
    image: IMG,
    shortDescription: `${title}${measureText ? ` · ${measureText}` : ""} — school shop item.`,
    description: `${title}${row.type ? ` (${row.type})` : ""}. ${measureText ? `Measure: ${measureText}. ` : ""}Bought ${row.costQty} @ ${row.costUnitPrice}, sold at ${row.sellUnitPrice} per piece.`,
    specs: [],
    tags: [row.group.toLowerCase(), "mini-store", "school", supplyType],
    miniStore: true,
    supplyType,
    type: row.type,
    measure: row.measure,
    costQty: row.costQty,
    costUnitPrice: row.costUnitPrice,
    costAmount,
    sellPcs: row.sellPcs,
    sellUnitPrice: row.sellUnitPrice,
    sellAmount,
    profit
  };
}

export const SCHOOL_SHOP_ITEMS: Product[] = ROWS.map(buildSchoolItem);

/**
 * Structured pricing fields that are persisted inside the product's `specs`
 * JSONB column (the Supabase `products` table has no dedicated columns for
 * the school-shop cost/selling figures). Kept out of the student-facing page;
 * only the manager/admin views read them.
 */
export const PRICING_SPEC_LABELS: Record<string, string> = {
  type: "Type",
  measure: "Measure",
  costQty: "Cost Qty",
  costUnitPrice: "Cost Unit Price",
  costAmount: "Cost Amount",
  sellPcs: "Sell Pcs",
  sellUnitPrice: "Sell Unit Price",
  sellAmount: "Sell Amount",
  profit: "Expected Gain"
};

const PRICING_SPEC_KEYS = Object.keys(PRICING_SPEC_LABELS);

export function isPricingSpec(label: string): boolean {
  return Object.values(PRICING_SPEC_LABELS).includes(label);
}

export function pricingSpecs(p: Product): ProductSpec[] {
  const out: ProductSpec[] = [];
  for (const key of PRICING_SPEC_KEYS) {
    const value = p[key as keyof Product];
    if (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) {
      out.push({ label: PRICING_SPEC_LABELS[key], value: String(value) });
    }
  }
  return out;
}

/** Hydrate typed cost/selling fields from `specs` entries (Supabase round-trip). */
export function applyPricingSpecs(p: Product): Product {
  if (!Array.isArray(p.specs) || p.specs.length === 0) return p;
  const labelToKey = new Map(Object.values(PRICING_SPEC_LABELS).map((label, i) => [label, PRICING_SPEC_KEYS[i]]));
  const next: Product = { ...p };
  for (const spec of p.specs) {
    const key = labelToKey.get(spec.label);
    if (!key) continue;
    if (key === "type" || key === "measure") {
      if (next[key as "type" | "measure"] === undefined && spec.value) (next as unknown as Record<string, unknown>)[key] = spec.value;
    } else if (next[key as "costQty"] === undefined) {
      const num = Number(spec.value);
      if (Number.isFinite(num)) (next as unknown as Record<string, unknown>)[key] = num;
    }
  }
  return next;
}

/** Build the Supabase-safe product row: pricing typed fields merged into specs. */
export function toSchoolRow(p: Product): Product {
  const { type, measure, costQty, costUnitPrice, costAmount, sellPcs, sellUnitPrice, sellAmount, profit, ...rest } = p;
  void type;
  void measure;
  void costQty;
  void costUnitPrice;
  void costAmount;
  void sellPcs;
  void sellUnitPrice;
  void sellAmount;
  void profit;
  const baseSpecs = (p.specs || []).filter((s) => !isPricingSpec(s.label));
  const merged: Product = { ...rest, specs: [...baseSpecs, ...pricingSpecs(p)] };
  return merged;
}

export const SCHOOL_ITEM_IDS = new Set(SCHOOL_SHOP_ITEMS.map((p) => p.id));
