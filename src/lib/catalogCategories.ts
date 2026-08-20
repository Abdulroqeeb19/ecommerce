export interface ShopCategory {
  /** Canonical Product.category value. Everything else derives from this. */
  name: string;
  /** Display order in the shop (Baby & Kids first, then Electrical, then Home Essentials). */
  order: number;
  /** Icon key mapped to a lucide icon by UI components. */
  iconKey: "baby" | "plug" | "utensils";
  /** Category-card tagline shown on the home page carousel. */
  tagline: string;
  /** Category-card image shown on the home page carousel. */
  image: string;
  /** Shop URL for this category. */
  href: string;
  /** Id of the category card in the category_cards store / admin panel. */
  cardId: string;
  /** Legacy catalogue-item category labels that fold into this shop category. */
  aliases: string[];
}

/**
 * Single source of truth for the shop categories and catalogues.
 *
 * The product catalogue is divided into exactly three categories — "Baby and
 * Kids Essentials", "Electrical Materials and Fittings" and "Home Essentials". All UI
 * (sidebars, filters, headers, home carousels), the admin catalog drop-downs
 * and the category-card seeding derive from this list so the site stays
 * consistent as things change.
 */
export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    name: "Baby and Kids Essentials",
    order: 1,
    iconKey: "baby",
    tagline: "Comfort for your little ones",
    image: "/images/catalog/babies-wear.png",
    href: `/shop?category=${encodeURIComponent("Baby and Kids Essentials")}`,
    cardId: "card_babies",
    aliases: [
      "Baby and Kids Essentials",
      "Babies Wears",
      "Babies Wears and Footwear",
      "Bags and Sundries"
    ]
  },
  {
    name: "Electrical Materials and Fittings",
    order: 2,
    iconKey: "plug",
    tagline: "Sockets, solar and fittings",
    image: "/images/catalog/sockets.png",
    href: `/shop?category=${encodeURIComponent("Electrical Materials and Fittings")}`,
    cardId: "card_electrical",
    aliases: ["Electrical Fittings"]
  },
  {
    name: "Home Essentials",
    order: 3,
    iconKey: "utensils",
    tagline: "Home and cooking essentials",
    image: "/images/catalog/pot.png",
    href: `/shop?category=${encodeURIComponent("Home Essentials")}`,
    cardId: "card_kitchen",
    aliases: ["Home Essentials"]
  }
];

/** Canonical shop-category names in display order. */
export const SHOP_CATEGORY_NAMES: string[] = SHOP_CATEGORIES.map((c) => c.name);

/** Shop-category name -> the catalogue-item category labels that belong to it. */
export const CATALOG_CATEGORY_KEYS: Record<string, string[]> = Object.fromEntries(
  SHOP_CATEGORIES.map((c) => [c.name, c.aliases])
);

/** Ids of the category cards that must always be shown on the home page. */
export const CATEGORY_CARD_IDS: string[] = SHOP_CATEGORIES.map((c) => c.cardId);

/** Resolves any known (including legacy) category label to its canonical shop category. */
export function canonicalCategory(category: string): string {
  const hit = SHOP_CATEGORIES.find((c) => c.aliases.includes(category));
  return hit ? hit.name : category;
}