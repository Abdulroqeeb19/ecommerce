import type { Product, ProductSpec } from "../types";

const MAX_NAME = 200;
const MAX_DESC = 5000;
const MAX_SPECS = 50;
const MAX_TAGS = 30;

export function validateProductInput(raw: unknown): { value: Partial<Product>; error?: string } {
  if (!raw || typeof raw !== "object") {
    return { value: {}, error: "Invalid product data" };
  }
  const b = raw as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title || title.length > MAX_NAME) {
    return { value: {}, error: "Product title is required (max 200 chars)" };
  }

  const price = Number(b.price);
  if (!Number.isFinite(price) || price < 0) {
    return { value: {}, error: "Price must be a non-negative number" };
  }

  const stockN = Number(b.stock);
  if (!Number.isFinite(stockN) || stockN < 0 || !Number.isInteger(stockN)) {
    return { value: {}, error: "Stock must be a non-negative integer" };
  }
  const stock = stockN;

  const category = typeof b.category === "string" ? b.category.trim().slice(0, 80) : "";
  if (!category) {
    return { value: {}, error: "Category is required" };
  }

  const image = typeof b.image === "string" ? b.image : "";
  if (image) {
    const isDataUrl = image.startsWith("data:image/");
    const isLocalPath = image.startsWith("/images/");
    const isAbsolute = image.startsWith("http://") || image.startsWith("https://");
    if (!isDataUrl && !isLocalPath && !isAbsolute) {
      return { value: {}, error: "Image must be a valid /images/ path, absolute URL, or base64 data URL" };
    }
    if (isDataUrl && image.length > 4 * 1024 * 1024) {
      return { value: {}, error: "Image data URL is too large (max 4MB)" };
    }
    if (!isDataUrl && image.length > 1000) {
      return { value: {}, error: "Image reference is too long" };
    }
  }

  const specs: ProductSpec[] = Array.isArray(b.specs)
    ? b.specs
        .slice(0, MAX_SPECS)
        .filter((s): s is ProductSpec => Boolean(s && typeof s === "object"))
        .map((s) => {
          const o = s as unknown as Record<string, unknown>;
          return {
            label: typeof o.label === "string" ? o.label.slice(0, 80) : "",
            value: typeof o.value === "string" ? o.value.slice(0, 200) : ""
          };
        })
        .filter((s) => s.label && s.value)
    : [];

  const tags: string[] = Array.isArray(b.tags)
    ? b.tags.filter((t): t is string => typeof t === "string").slice(0, MAX_TAGS).map((t) => t.slice(0, 40))
    : [];

  const shortDescription = typeof b.shortDescription === "string" ? b.shortDescription.trim().slice(0, 300) : "";
  const description = typeof b.description === "string" ? b.description.trim().slice(0, MAX_DESC) : "";

  return {
    value: {
      id: typeof b.id === "string" ? b.id : undefined,
      slug: typeof b.slug === "string" ? b.slug.slice(0, 200) : undefined,
      title,
      category,
      brand: typeof b.brand === "string" ? b.brand.slice(0, 80) : "",
      price,
      oldPrice: typeof b.oldPrice === "number" && Number.isFinite(b.oldPrice) && b.oldPrice >= 0 ? b.oldPrice : undefined,
      stock,
      rating: typeof b.rating === "number" ? Math.min(5, Math.max(0, b.rating)) : 0,
      reviews: Math.floor(Number(b.reviews) || 0),
      image,
      gallery: Array.isArray(b.gallery) ? b.gallery.filter((g): g is string => typeof g === "string").slice(0, 10) : undefined,
      shortDescription,
      description,
      specs,
      badge: typeof b.badge === "string" ? b.badge.slice(0, 40) : undefined,
      featured: Boolean(b.featured),
      tags,
      miniStore: Boolean(b.miniStore),
      supplyType: b.supplyType === "grocery" || b.supplyType === "supplies" ? b.supplyType : undefined,
      createdAt: typeof b.createdAt === "string" ? b.createdAt.slice(0, 40) : undefined,
      updatedAt: typeof b.updatedAt === "string" ? b.updatedAt.slice(0, 40) : undefined
    }
  };
}
