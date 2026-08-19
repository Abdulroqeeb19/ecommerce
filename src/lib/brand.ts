export const BRAND_NAME = "AYINDEDUNNY ENTERPRISE";

export const BRAND_EMAIL = "naimatoriyomi@yahoo.com";

export const BRAND_PHONES = ["08033004595", "09050983636"];

export const WHATSAPP_NUMBER = "2348033004595";

export const SLOGAN = "We Deal with all types of Home Essentials, Babies Wears and Electrical Fittings";

export const MOTTO = "supply of strong, reliable and quality products at affordable cost";

export const BRAND_ADDRESS = "Shop 5 Opposite Nigerian Air Force Base Adewole, Ilorin, Kwara State";

export const INSTAGRAM_HANDLE = "oriyomiokanlawon";

export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}`;

export const FACEBOOK_NAME = "Okanlawon Naimat Oriyomi";

export const FACEBOOK_URL =
  "https://www.facebook.com/search/top?q=Okanlawon%20Naimat%20Oriyomi";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const CATALOG_IMAGE = (slug: string) => `/images/catalog/${slug}.png`;

export interface CatalogItemShape {
  id: string;
  name: string;
  tag: string;
  category: string;
  image: string;
  sortOrder: number;
  active: boolean;
}

export const CATALOG_ITEMS: CatalogItemShape[] = [
  { id: "cat_pot", name: "POT", tag: "Pot", category: "Home Essentials", image: CATALOG_IMAGE("pot"), sortOrder: 1, active: true },
  { id: "cat_plate", name: "PLATE", tag: "Plate", category: "Home Essentials", image: CATALOG_IMAGE("plate"), sortOrder: 2, active: true },
  { id: "cat_blender", name: "BLENDER", tag: "Blender", category: "Home Essentials", image: CATALOG_IMAGE("blender"), sortOrder: 3, active: true },
  { id: "cat_spoon", name: "SPOON", tag: "Spoon", category: "Home Essentials", image: CATALOG_IMAGE("spoon"), sortOrder: 4, active: true },
  { id: "cat_cooler", name: "COOLER", tag: "Cooler", category: "Home Essentials", image: CATALOG_IMAGE("cooler"), sortOrder: 5, active: true },
  { id: "cat_shoe", name: "SHOE", tag: "Shoe", category: "Babies Wears and Footwear", image: CATALOG_IMAGE("shoe"), sortOrder: 6, active: true },
  { id: "cat_bag", name: "BAG", tag: "Bag", category: "Bags and Sundries", image: CATALOG_IMAGE("bag"), sortOrder: 7, active: true },
  { id: "cat_singlet", name: "SINGLET", tag: "Singlet", category: "Babies Wears", image: CATALOG_IMAGE("singlet"), sortOrder: 8, active: true },
  { id: "cat_babies_wear", name: "BABIES WEAR", tag: "Babies Wear", category: "Babies Wears", image: CATALOG_IMAGE("babies-wear"), sortOrder: 9, active: true },
  { id: "cat_solar", name: "SOLAR", tag: "Solar", category: "Electrical Fittings", image: CATALOG_IMAGE("solar"), sortOrder: 10, active: true },
  { id: "cat_sockets", name: "SOCKETS", tag: "Sockets", category: "Electrical Fittings", image: CATALOG_IMAGE("sockets"), sortOrder: 11, active: true }
];

export const DEFAULT_CATEGORY_CARDS = [
  { id: "card_babies", name: "BABIES WEARS", tagline: "Comfort for your little ones", href: "/shop?category=Babies%20Wears", image: "/images/catalog/babies-wear.png", icon: "baby", sortOrder: 1, active: true },
  { id: "card_electrical", name: "ELECTRICAL MATERIALS AND FITTINGS", tagline: "Sockets, solar and fittings", href: "/shop?category=Electrical%20Materials%20and%20Fittings", image: "/images/catalog/sockets.png", icon: "plug", sortOrder: 2, active: true },
  { id: "card_kitchen", name: "HOME ESSENTIALS", tagline: "Home and cooking essentials", href: "/shop?category=Home%20Essentials", image: "/images/catalog/pot.png", icon: "utensils", sortOrder: 3, active: true }
];