import type { CatalogItem, CategoryCard } from "../types";

const MAX_NAME = 120;
const MAX_TEXT = 500;

function cleanImage(raw: unknown): string {
  const image = typeof raw === "string" ? raw : "";
  if (!image) return "";
  const isDataUrl = image.startsWith("data:image/");
  const isLocalPath = image.startsWith("/images/");
  const isAbsolute = image.startsWith("http://") || image.startsWith("https://");
  if (!isDataUrl && !isLocalPath && !isAbsolute) return "";
  if (isDataUrl && image.length > 4 * 1024 * 1024) return "";
  if (!isDataUrl && image.length > 1000) return "";
  return image;
}

export function validateCategoryCardInput(raw: unknown): { value: CategoryCard; error?: string } {
  if (!raw || typeof raw !== "object") return { value: {} as CategoryCard, error: "Invalid data" };
  const b = raw as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length > MAX_NAME) return { value: {} as CategoryCard, error: "Card name is required (max 120 chars)" };

  const image = cleanImage(b.image);
  if (!image) return { value: {} as CategoryCard, error: "Image must be a valid /images/ path, absolute URL, or base64 data URL" };

  const value: CategoryCard = {
    id: typeof b.id === "string" && b.id ? b.id : undefined as unknown as string,
    name,
    tagline: typeof b.tagline === "string" ? b.tagline.trim().slice(0, MAX_TEXT) : "",
    href: typeof b.href === "string" ? b.href.slice(0, 500) : "",
    image,
    icon: typeof b.icon === "string" ? b.icon.slice(0, 40) : "",
    sortOrder: Number.isFinite(Number(b.sortOrder)) ? Math.floor(Number(b.sortOrder)) : 0,
    active: b.active !== false
  };
  return { value };
}

export function validateCatalogItemInput(raw: unknown): { value: CatalogItem; error?: string } {
  if (!raw || typeof raw !== "object") return { value: {} as CatalogItem, error: "Invalid data" };
  const b = raw as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length > MAX_NAME) return { value: {} as CatalogItem, error: "Item name is required (max 120 chars)" };
  const category = typeof b.category === "string" ? b.category.trim().slice(0, 80) : "";
  if (!category) return { value: {} as CatalogItem, error: "Category is required" };

  const image = cleanImage(b.image);
  if (!image) return { value: {} as CatalogItem, error: "Image must be a valid /images/ path, absolute URL, or base64 data URL" };

  let price: number | undefined;
  if (b.price !== undefined && b.price !== null && b.price !== "") {
    const n = Number(b.price);
    if (!Number.isFinite(n) || n < 0) return { value: {} as CatalogItem, error: "Price must be a non-negative number" };
    price = Math.round(n * 100) / 100;
  }

  const value: CatalogItem = {
    id: typeof b.id === "string" && b.id ? b.id : undefined as unknown as string,
    name,
    tag: typeof b.tag === "string" ? b.tag.trim().slice(0, 120) : "",
    category,
    image,
    price,
    sortOrder: Number.isFinite(Number(b.sortOrder)) ? Math.floor(Number(b.sortOrder)) : 0,
    active: b.active !== false
  };
  return { value };
}