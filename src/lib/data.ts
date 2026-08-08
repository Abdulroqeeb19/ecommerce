import type { Product } from "./types";

const cimg = (name: string) => `/images/catalog/${name}.png`;

export const SEED_PRODUCTS: Product[] = [
  {
    id: "p_kitchen_pot",
    slug: "stainless-cookware-pot",
    title: "Stainless Steel Cookware Pot",
    category: "Kitchen Utensils",
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
    category: "Kitchen Utensils",
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
    category: "Kitchen Utensils",
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
    category: "Babies Wears",
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
    category: "Babies Wears",
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
    category: "Babies Wears",
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
  {
    id: "p_electrical_sockets",
    slug: "wall-socket-panel",
    title: "Standard Wall Sockets",
    category: "Electrical Materials and Fittings",
    brand: "Legrand",
    price: 18,
    stock: 60,
    rating: 4.8,
    reviews: 140,
    image: cimg("sockets"),
    shortDescription: "Safe, durable electrical wall sockets.",
    description:
      "Flame-retardant wall sockets built for safe everyday use. Smooth finish, secure connections and sturdy build for homes and offices.",
    specs: [
      { label: "Type", value: "UK standard 3-pin" },
      { label: "Rated", value: "13A 250V" },
      { label: "Material", value: "Flame-retardant" }
    ],
    tags: ["electrical", "sockets", "fittings", "materials"]
  },
  {
    id: "p_electrical_solar",
    slug: "solar-panel-kit",
    title: "Solar Panel Lighting Kit",
    category: "Electrical Materials and Fittings",
    brand: "Solardown",
    price: 90,
    oldPrice: 110,
    stock: 20,
    rating: 4.6,
    reviews: 58,
    image: cimg("solar"),
    shortDescription: "Reliable solar power for homes and shops.",
    description:
      "A complete solar kit delivering dependable backup power. Panels, battery and lighting components are pre-configured for quick home and shop installation.",
    specs: [
      { label: "Output", value: "100W panel" },
      { label: "Battery", value: "20Ah sealed" },
      { label: "Includes", value: "Panels, battery and lights" }
    ],
    featured: true,
    tags: ["electrical", "solar", "fittings", "power"]
  },

  // --- Boarding School Supplies (mini-store, classified as "supplies") ---
  {
    id: "ms_exercise_books",
    slug: "exercise-books-pack-10",
    title: "Exercise Books Pack of 10",
    category: "Stationery",
    brand: "Smart Kids",
    price: 6.5,
    stock: 120,
    rating: 4.7,
    reviews: 38,
    image: "/images/products/exercise-books-pack-10.svg",
    shortDescription: "10 high-quality exercise books for school work.",
    description:
      "A pack of ten 40-leaf exercise books with smooth, bright paper. Firm spiral-free binding survives double covers and a full boarding-school term.",
    specs: [
      { label: "Contents", value: "10 books" },
      { label: "Pages", value: "64 leaves each" },
      { label: "Use", value: "Boarding school stationery" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["mini-store", "school", "supplies", "stationery"]
  },
  {
    id: "ms_ruled_notebooks",
    slug: "ruled-notebooks-pack-5",
    title: "Ruled Notebooks Pack of 5",
    category: "Stationery",
    brand: "Smart Kids",
    price: 5.0,
    stock: 100,
      rating: 4.6,
      reviews: 51,
    image: "/images/products/ruled-notebooks-pack-5.svg",
    shortDescription: "Five ruled notebooks for note taking.",
    description:
      "Five A4 ruled notebooks with sturdy card covers and smooth 70gsm paper. Ideal for boarding students who work through notebooks quickly each term.",
    specs: [
      { label: "Contents", value: "5 notebooks" },
      { label: "Size", value: "A4 ruled" },
      { label: "Use", value: "Boarding school stationery" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["mini-store", "school", "supplies", "stationery"]
  },
  {
    id: "ms_ballpoint_pens",
    slug: "ballpoint-pens-pack-12",
    title: "Ballpoint Pens Pack of 12",
    category: "Stationery",
    brand: "Bic",
    price: 4.2,
    stock: 90,
      rating: 4.8,
      reviews: 64,
    image: "/images/products/ballpoint-pens-pack-12.svg",
    shortDescription: "12 smooth-writing ballpoint pens.",
    description:
      "A dozen reliable blue ballpoint pens for daily classroom and examination use. Slim barrel, consistent ink flow and a clear plastic cap.",
    specs: [
      { label: "Contents", value: "12 pens" },
      { label: "Ink", value: "Blue" },
      { label: "Use", value: "Boarding school stationery" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["mini-store", "school", "supplies", "stationery"]
  },
  {
    id: "ms_geometry_set",
    slug: "geometry-set-compass",
    title: "Geometry Set with Compass",
    category: "Stationery",
    brand: "Staedler",
    price: 3.8,
    stock: 75,
      rating: 4.6,
      reviews: 33,
    image: "/images/products/geometry-set-compass.svg",
    shortDescription: "Complete geometry set for maths students.",
    description:
      "A full geometry kit with a sharpened compass, ruler, protractor and set squares in a protective case. Covers the maths syllabus for boarding students.",
    specs: [
      { label: "Contents", value: "Compass, ruler, protractor" },
      { label: "Material", value: "ABS plastic" },
      { label: "Use", value: "Mathematics" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["mini-store", "school", "supplies", "stationery"]
  },
  {
    id: "ms_school_backpack",
    slug: "school-backpack-45l",
    title: "School Backpack 45L",
    category: "School Bags",
    brand: "Nika",
    price: 28,
    oldPrice: 34,
    stock: 40,
      rating: 4.8,
      reviews: 72,
    image: "/images/products/school-backpack-45l.svg",
    shortDescription: "Roomy, padded backpack for boarding students.",
    description:
      "A 45-litre backpack with padded shoulder straps, a laptop sleeve and multiple compartments. Tough fabric handles the books and bedding of daily boarding-school life.",
    specs: [
      { label: "Capacity", value: "45 litres" },
      { label: "Laptop sleeve", value: "Up to 15.6in" },
      { label: "Use", value: "Boarding school" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["mini-store", "school", "supplies", "bags"]
  },

  // --- Groceries / Consumables (mini-store, classified as "grocery") ---
  {
    id: "ms_rice_5kg",
    slug: "rice-5kg-bag",
    title: "Rice 5kg Bag",
    category: "Pantry Staples",
    brand: "Mamador",
    price: 12,
    stock: 60,
      rating: 4.8,
      reviews: 72,
    image: "/images/products/rice-5kg-bag.svg",
    shortDescription: "Long-grain parboiled rice, 5kg bag.",
    description:
      "Clean long-grain parboiled rice in a sturdy 5kg bag. A boarding-school pantry staple that cooks evenly and keeps well in dry storage.",
    specs: [
      { label: "Weight", value: "5 kg" },
      { label: "Type", value: "Long-grain parboiled" },
      { label: "Use", value: "Boarding school pantry" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["mini-store", "school", "grocery", "pantry"]
  },
  {
    id: "ms_vegetable_oil",
    slug: "vegetable-oil-1l",
    title: "Vegetable Oil 1L",
    category: "Pantry Staples",
    brand: "Kings",
    price: 5.5,
    stock: 80,
      rating: 4.6,
      reviews: 58,
    image: "/images/products/vegetable-oil-1l.svg",
    shortDescription: "Refined vegetable cooking oil, 1L bottle.",
    description:
      "Refined vegetable oil in a convenient 1-litre bottle. Perfect for everyday cooking and household catering in boarding schools.",
    specs: [
      { label: "Volume", value: "1 litre" },
      { label: "Use", value: "Cooking oil" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["mini-store", "school", "grocery", "pantry"]
  },
  {
    id: "ms_milk_powder",
    slug: "milk-powder-400g",
    title: "Milk Powder 400g",
    category: "Pantry Staples",
    brand: "Peak",
    price: 7.0,
    stock: 70,
      rating: 4.7,
      reviews: 77,
    image: "/images/products/milk-powder-400g.svg",
    shortDescription: "Full-cream milk powder, 400g tin.",
    description:
      "Full-cream instant milk powder in a 400g tin. A simple, long-lasting dairy staple for tea, cereal and cooking in the boarding school pantry.",
    specs: [
      { label: "Weight", value: "400 g" },
      { label: "Type", value: "Full-cream instant" },
      { label: "Use", value: "Boarding school pantry" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["mini-store", "school", "grocery", "pantry"]
  },
  {
    id: "ms_instant_noodles",
    slug: "instant-noodles-carton-12",
    title: "Instant Noodles Carton of 12",
    category: "Snacks and Drinks",
    brand: "Indomie",
    price: 6.0,
    stock: 65,
      rating: 4.9,
      reviews: 112,
    image: "/images/products/instant-noodles-carton-12.svg",
    shortDescription: "Carton of 12 packs of instant noodles.",
    description:
      "A carton of 12 quick-cook instant noodle packs. A favourite snack meal for busy boarding-school students between classes and study periods.",
    specs: [
      { label: "Contents", value: "12 packs" },
      { label: "Use", value: "Snacks and meals" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["mini-store", "school", "grocery", "snacks"]
  },
  {
    id: "ms_bottled_water",
    slug: "drinking-water-pack-12",
    title: "Drinking Water Pack of 12",
    category: "Snacks and Drinks",
    brand: "Eva",
    price: 4.5,
    stock: 110,
      rating: 4.6,
      reviews: 45,
    image: "/images/products/drinking-water-pack-12.svg",
    shortDescription: "12 bottles of still drinking water.",
    description:
      "A pack of 12 bottles of purified still drinking water. Clean hydration for sporting activities, study breaks and daily boarding life.",
    specs: [
      { label: "Contents", value: "12 × 75cl" },
      { label: "Use", value: "Drinking water" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["mini-store", "school", "grocery", "snacks"]
  },
  {
    id: "ms_cereal_box",
    slug: "cereal-breakfast-box",
    title: "Breakfast Cereal Box",
    category: "Snacks and Drinks",
    brand: "Nutri",
    price: 5.2,
    stock: 85,
      rating: 4.5,
      reviews: 61,
    image: "/images/products/cereal-breakfast-box.svg",
    shortDescription: "Crunchy fortified breakfast cereal.",
    description:
      "A fortified corn-flake breakfast cereal box. A quick, filling and enriching start to the boarding-school student's morning.",
    specs: [
      { label: "Weight", value: "480 g" },
      { label: "Use", value: "Breakfast" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["mini-store", "school", "grocery", "snacks"]
  }
];

export const QUICK_FILTER_TABS = ["All", "Kitchen Utensils", "Babies Wears", "Electrical Materials and Fittings"] as const;

export const CAROUSEL_CATEGORIES = [
  { name: "KITCHEN UTENSILS", icon: "utensils", tagline: "Pots, blenders and more", slug: "kitchen" },
  { name: "BABIES WEARS", icon: "baby", tagline: "Comfort for little ones", slug: "babies" },
  { name: "ELECTRICAL MATERIALS AND FITTINGS", icon: "plug", tagline: "Sockets, solar and fittings", slug: "electrical" }
] as const;
