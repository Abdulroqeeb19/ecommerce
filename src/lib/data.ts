import type { Product } from "./types";
import { SCHOOL_SHOP_ITEMS } from "./schoolItems";
import { SHOP_CATEGORIES } from "./catalogCategories";

const cimg = (name: string) => `/images/catalog/${name}.png`;

export const SEED_PRODUCTS: Product[] = [
  {
    id: "p_kitchen_pot",
    slug: "stainless-cookware-pot",
    title: "Stainless Steel Cookware Pot",
    category: "Home Essentials",
    brand: "Rivo",
    price: 38.0,
    stock: 40,
    rating: 4.6,
    reviews: 92,
    image: cimg("pot"),
    shortDescription: "Heavy-duty stainless steel pot for everyday cooking.",
    description:
      "A robust stainless steel cooking pot built for everyday kitchens. Even heat distribution, comfortable heat-proof handles and a tight-fitting lid make it ideal for stews, soups and rice dishes.",
    specs: [
      { label: "Material", value: "18/8 Stainless Steel" },
      { label: "Capacity", value: "Large family size" },
      { label: "Compatible", value: "Gas and Electric" }
    ],
    featured: true,
    tags: ["kitchen", "pot", "cookware", "utensils"]
  },
  {
    id: "p_kitchen_blender",
    slug: "high-speed-kitchen-blender",
    title: "High-Speed Kitchen Blender",
    category: "Home Essentials",
    brand: "Binatone",
    price: 52.0,
    oldPrice: 62.0,
    stock: 28,
    rating: 4.7,
    reviews: 130,
    image: cimg("blender"),
    shortDescription: "Powerful blender for smoothies, soups and sauces.",
    description:
      "Blend, puree and liquefy with ease. A powerful motor, stainless steel blades and a large jug handle everyday cooking, from fruit smoothies to fresh soups.",
    specs: [
      { label: "Power", value: "500W" },
      { label: "Jug", value: "1.5L Stainless Steel" },
      { label: "Speeds", value: "2 speeds + pulse" }
    ],
    featured: true,
    tags: ["kitchen", "blender", "appliance", "utensils"]
  },
  {
    id: "p_kitchen_cooler",
    slug: "insulated-food-cooler",
    title: "Insulated Food Cooler",
    category: "Home Essentials",
    brand: "Thermos",
    price: 29,
    stock: 35,
    rating: 4.5,
    reviews: 61,
    image: cimg("cooler"),
    shortDescription: "Keeps food hot or drinks cold for hours.",
    description:
      "Double-wall insulation keeps meals hot and drinks cold on the go. Ideal for outings, offices and school lunch breaks.",
    specs: [
      { label: "Capacity", value: "10L" },
      { label: "Insulation", value: "Double-wall" },
      { label: "Keep time", value: "Up to 10 hours" }
    ],
    tags: ["kitchen", "cooler", "utensils"]
  },
  {
    id: "p_babies_shoe",
    slug: "soft-sole-baby-shoes",
    title: "Soft-Sole Baby Shoes",
    category: "Baby and Kids Essentials",
    brand: "NewBaby",
    price: 12,
    stock: 50,
    rating: 4.6,
    reviews: 66,
    image: cimg("shoe"),
    shortDescription: "Breathable, flexible shoes for little feet.",
    description:
      "Crafted with breathable fabric and flexible soles to support natural movement as your baby learns to walk. Lightweight, easy to slip on and gentle on tiny feet.",
    specs: [
      { label: "Material", value: "Breathable fabric" },
      { label: "Sole", value: "Flexible rubber" },
      { label: "Sizes", value: "0-12 months" }
    ],
    tags: ["babies", "shoes", "footwear", "wears"]
  },
  {
    id: "p_babies_singlet",
    slug: "baby-singlet-set",
    title: "Baby Singlet Set",
    category: "Baby and Kids Essentials",
    brand: "TinyTots",
    price: 14,
    stock: 45,
    rating: 4.5,
    reviews: 54,
    image: cimg("singlet"),
    shortDescription: "Soft cotton singlets, gentle on baby skin.",
    description:
      "Made from pure, breathable cotton to keep your baby comfortable all day. Durably stitched and machine washable for everyday wear.",
    specs: [
      { label: "Fabric", value: "100% Cotton" },
      { label: "Pack", value: "Set of 3" },
      { label: "Sizes", value: "0-24 months" }
    ],
    tags: ["babies", "singlet", "clothes", "wears"]
  },
  {
    id: "p_babies_bag",
    slug: "diaper-baby-bag",
    title: "Spacious Baby Bag",
    category: "Baby and Kids Essentials",
    brand: "Cuddles",
    price: 26,
    stock: 30,
    rating: 4.4,
    reviews: 41,
    image: cimg("bag"),
    shortDescription: "Organized bag for all baby essentials.",
    description:
      "Roomy multi-pocket baby bag keeps nappies, bottles, wipes and spare clothes neatly organized. Comfortable, water-resistant and easy to carry.",
    specs: [
      { label: "Pockets", value: "8 compartments" },
      { label: "Material", value: "Water-resistant" },
      { label: "Strap", value: "Adjustable" }
    ],
    tags: ["babies", "bag", "sundries", "wears"]
  },

  // --- School Shop Items (from "School Shop Items List.xlsx", mini-store only) ---
  ...SCHOOL_SHOP_ITEMS
];

export const QUICK_FILTER_TABS = ["All", ...SHOP_CATEGORIES.map((c) => c.name)] as const;
