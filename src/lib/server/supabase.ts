import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { SEED_PRODUCTS } from "../data";
import { CATALOG_ITEMS, DEFAULT_CATEGORY_CARDS } from "../brand";
import { SCHOOL_ITEM_IDS, toSchoolRow } from "../schoolItems";
import { applyPricingSpecs } from "../schoolItems";
import type { CatalogItem, CategoryCard, Coupon, Order, Product, Review, User } from "../types";
import type { ImageImportItem, ImageImportJob } from "../types";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

// --- Storage (AI Image Importer) ---

export const PRODUCT_IMAGE_BUCKET = "product-images";

/** Ensures the public storage bucket exists (idempotent). */
export async function sbEnsureBucket(): Promise<void> {
  const sb = getClient();
  const { data } = await sb.storage.getBucket(PRODUCT_IMAGE_BUCKET);
  if (data) return;
  const { error } = await sb.storage.createBucket(PRODUCT_IMAGE_BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
  if (error && !/already exists/i.test(error.message)) throw new Error(`Could not create storage bucket: ${error.message}`);
}

/** Uploads bytes to storage at the given path inside the product-images bucket. */
export async function sbUploadFile(path: string, buffer: ArrayBuffer | Uint8Array, mime: string): Promise<void> {
  await sbEnsureBucket();
  const { error } = await getClient().storage.from(PRODUCT_IMAGE_BUCKET).upload(path, buffer, { contentType: mime, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

/** Downloads a file from storage and returns its bytes. */
export async function sbDownloadFile(path: string): Promise<Uint8Array> {
  const { data, error } = await getClient().storage.from(PRODUCT_IMAGE_BUCKET).download(path);
  if (error) throw new Error(`Storage download failed: ${error.message}`);
  return new Uint8Array(await data.arrayBuffer());
}

/** Removes a file from storage (missing file is not an error). */
export async function sbDeleteFile(path: string): Promise<void> {
  const { error } = await getClient().storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  if (error && !/not found/i.test(error.message)) throw new Error(`Storage delete failed: ${error.message}`);
}

/** Public URL for a stored object. */
export function sbStoragePublicUrl(path: string): string {
  if (!url) throw new Error("SUPABASE_URL must be set");
  return `${url}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;
}

function rowToProduct(r: Record<string, unknown>): Product {
  return applyPricingSpecs(r as unknown as Product);
}

function rowToUser(r: Record<string, unknown>): User {
  return r as unknown as User;
}

function rowToOrder(r: Record<string, unknown>): Order {
  const items = Array.isArray((r as { order_items?: unknown }).order_items)
    ? (r as { order_items: Order["items"] }).order_items
    : [];
  const { order_items: _omitted, ...rest } = r as Record<string, unknown> & { order_items?: unknown };
  void _omitted;
  return { ...(rest as unknown as Order), items };
}

function rowToCoupon(r: Record<string, unknown>): Coupon {
  return r as unknown as Coupon;
}

function rowToReview(r: Record<string, unknown>): Review {
  return r as unknown as Review;
}

/**
 * Supabase-safe row for a seed product: school-shop cost/selling fields are not
 * columns on the products table, so `toSchoolRow` merges them into the `specs`
 * JSONB column and drops the extra scalar fields before upserting.
 */
function seedRowFor(p: Product): Record<string, unknown> {
  const row = toSchoolRow(p);
  return {
    ...row,
    brand: row.brand ?? "",
    price: row.price ?? 0,
    stock: row.stock ?? 0,
    rating: row.rating ?? 0,
    reviews: row.reviews ?? 0,
    image: row.image ?? "",
    gallery: row.gallery ?? [],
    shortDescription: row.shortDescription ?? "",
    description: row.description ?? "",
    specs: row.specs ?? [],
    featured: row.featured ?? false,
    tags: row.tags ?? [],
    miniStore: row.miniStore ?? false
  };
}

export async function ensureBootstrap() {
  const sb = getClient();
  const { count: productCount } = await sb.from("products").select("id", { count: "exact", head: true });
  const { count: couponCount } = await sb.from("coupons").select("id", { count: "exact", head: true });
  const { count: reviewCount } = await sb.from("reviews").select("id", { count: "exact", head: true });
  const { data: existingUsers } = await sb.from("users").select("email");

  const emailSet = new Set((existingUsers || []).map((u) => String(u.email).toLowerCase()));

  const { data: deletedRows } = await sb.from("deleted_products").select("id");
  const deleted = new Set((deletedRows || []).map((d) => String(d.id)));

  if ((productCount || 0) === 0) {
    const rows = SEED_PRODUCTS.filter((p) => !deleted.has(p.id)).map(seedRowFor);
    if (rows.length) {
      const { error } = await sb.from("products").upsert(rows, { onConflict: "id" });
      if (error) console.error("Failed to seed products:", error.message);
    }
  } else {
    // Always provision the school shop items (mini-store catalog) if missing.
    const { data: existingRows } = await sb.from("products").select("id");
    const existingIds = new Set((existingRows || []).map((r) => String(r.id)));
    const missingSchool = SEED_PRODUCTS.filter(
      (p) => SCHOOL_ITEM_IDS.has(p.id) && !existingIds.has(p.id) && !deleted.has(p.id)
    );
    if (missingSchool.length) {
      const { error } = await sb.from("products").upsert(missingSchool.map(seedRowFor), { onConflict: "id" });
      if (error) console.error("Failed to seed school shop items:", error.message);
    }
  }

  const isProd = process.env.NODE_ENV === "production";
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@gadgetstore.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  if (isProd && !process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD must be set in production");
  }
  if (!isProd && adminPassword === "Admin@12345") {
    console.warn("[security] Default admin password is in use. Set ADMIN_PASSWORD for any shared deployment.");
  }

  const managerEmails = (process.env.MANAGER_EMAILS || "manager1@gadgetstore.com,manager2@gadgetstore.com,manager3@gadgetstore.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 3);

  const accounts: User[] = [];
  if (!emailSet.has(adminEmail)) {
    accounts.push({
      id: "usr_admin",
      name: "Store Owner",
      email: adminEmail,
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      role: "admin",
      createdAt: new Date().toISOString()
    });
    emailSet.add(adminEmail);
  }
  managerEmails.forEach((email, i) => {
    if (!emailSet.has(email)) {
      accounts.push({
        id: `usr_manager_${i + 1}`,
        name: `Mini-Store Manager ${i + 1}`,
        email,
        passwordHash: bcrypt.hashSync(process.env.MANAGER_PASSWORD || "manager123", 10),
        role: "manager",
        createdAt: new Date().toISOString()
      });
      emailSet.add(email);
    }
  });
  const customerEmail = "customer@gadgetstore.com";
  if (!emailSet.has(customerEmail)) {
    accounts.push({
      id: "usr_customer",
      name: "Demo Customer",
      email: customerEmail,
      passwordHash: bcrypt.hashSync(process.env.CUSTOMER_PASSWORD || "customer123", 10),
      role: "customer",
      createdAt: new Date().toISOString()
    });
  }
  if (accounts.length) {
    const { error } = await sb.from("users").upsert(accounts, { onConflict: "id" });
    if (error) console.error("Failed to seed users:", error.message);
  }

  if ((reviewCount || 0) === 0) {
    const { data: products } = await sb.from("products").select("id");
    const sampleAuthors = ["Adaeze O.", "Michael T.", "Kemi A.", "Chidi E.", "Sarah B."];
    const sampleComments = [
      "Exactly as described. Fast delivery and the quality exceeded my expectations.",
      "Great value for money. Packaging was professional and the device works flawlessly.",
      "Ordered through the mini-store for schools on Monday and it arrived the same week. Impressive service!",
      "Solid build quality. Would definitely recommend to colleagues.",
      "Works as advertised. Setup was straightforward and support was helpful."
    ];
    const reviews: Review[] = [];
    for (const p of products || []) {
      for (let i = 0; i < 3; i++) {
        reviews.push({
          id: `rev_${p.id}_${i}`,
          productId: p.id,
          author: sampleAuthors[(i + (products || []).indexOf(p)) % sampleAuthors.length],
          rating: [5, 4, 5][i % 3],
          title: ["Great purchase", "Worth the money", "Very satisfied"][i % 3],
          comment: sampleComments[i % sampleComments.length],
          verified: true,
          createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString()
        });
      }
    }
    if (reviews.length) {
      const { error } = await sb.from("reviews").upsert(reviews, { onConflict: "id" });
      if (error) console.error("Failed to seed reviews:", error.message);
    }
  }

  if ((couponCount || 0) === 0) {
    const coupons: Coupon[] = [
      { id: "coup_welcome10", code: "WELCOME10", type: "percent", value: 10, minSubtotal: 0, maxDiscount: 100, active: true, used: 0, description: "10% off your first order (up to $100)" },
      { id: "coup_save50", code: "SAVE50", type: "fixed", value: 50, minSubtotal: 200, active: true, used: 0, description: "$50 off orders over $200" },
      { id: "coup_student15", code: "STUDENT15", type: "percent", value: 15, minSubtotal: 100, maxDiscount: 150, active: true, used: 0, description: "15% off for students (up to $150)" }
    ];
    const { error } = await sb.from("coupons").upsert(coupons, { onConflict: "id" });
    if (error) console.error("Failed to seed coupons:", error.message);
  }

  const { count: cardCount } = await sb.from("category_cards").select("id", { count: "exact", head: true });
  const { count: catalogCount } = await sb.from("catalog_items").select("id", { count: "exact", head: true });
  if ((cardCount || 0) === 0) {
    const { error } = await sb.from("category_cards").upsert(DEFAULT_CATEGORY_CARDS as unknown as Record<string, unknown>[], { onConflict: "id" });
    if (error) console.error("Failed to seed category cards:", error.message);
  }
  if ((catalogCount || 0) === 0) {
    const { error } = await sb.from("catalog_items").upsert(CATALOG_ITEMS as unknown as Record<string, unknown>[], { onConflict: "id" });
    if (error) console.error("Failed to seed catalog items:", error.message);
  }
}

let bootstrapPromise: Promise<void> | null = null;

export function bootstrap(): Promise<void> {
  if (!bootstrapPromise) bootstrapPromise = ensureBootstrap().catch((e) => console.error("Supabase bootstrap failed:", e));
  return bootstrapPromise;
}

// --- Products ---

export async function sbListProducts(): Promise<Product[]> {
  await bootstrap();
  const { data } = await getClient().from("products").select("*");
  return (data || []).map(rowToProduct);
}

export async function sbGetProduct(idOrSlug: string): Promise<Product | undefined> {
  await bootstrap();
  const { data } = await getClient().from("products").select("*").or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`).limit(1).maybeSingle();
  return data ? rowToProduct(data) : undefined;
}

export async function sbUpsertProduct(product: Product): Promise<Product> {
  await bootstrap();
  const { data, error } = await getClient().from("products").upsert(seedRowFor(product), { onConflict: "id" }).select().single();
  if (error) throw new Error(error.message);
  return rowToProduct(data);
}

export async function sbUpsertProductIfFresh(
  product: Product
): Promise<{ ok: true; product: Product } | { ok: false; error: string; existing: Product }> {
  await bootstrap();
  const existing = await sbGetProduct(product.id);
  if (existing && product.updatedAt && existing.updatedAt && existing.updatedAt > product.updatedAt) {
    return { ok: false, error: "Conflict: this product was updated elsewhere after your last edit.", existing };
  }
  const saved = await sbUpsertProduct(product);
  return { ok: true, product: saved };
}

export async function sbUpdateStock(id: string, stock: number): Promise<Product | undefined> {
  await bootstrap();
  const { data } = await getClient()
    .from("products")
    .update({ stock, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return data ? rowToProduct(data) : undefined;
}

export async function sbDeleteProduct(id: string): Promise<boolean> {
  await bootstrap();
  const { error } = await getClient().from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await getClient().from("deleted_products").upsert({ id, deletedAt: new Date().toISOString() }, { onConflict: "id" });
  return true;
}

// --- Users ---

export async function sbFindUserByEmail(email: string): Promise<User | undefined> {
  await bootstrap();
  const { data } = await getClient().from("users").select("*").eq("email", email.toLowerCase()).maybeSingle();
  return data ? rowToUser(data) : undefined;
}

export async function sbFindUserById(id: string): Promise<User | undefined> {
  await bootstrap();
  const { data } = await getClient().from("users").select("*").eq("id", id).maybeSingle();
  return data ? rowToUser(data) : undefined;
}

export async function sbCreateUser(user: User): Promise<User> {
  await bootstrap();
  const { data, error } = await getClient().from("users").insert(user as unknown as Record<string, unknown>).select().single();
  if (error) throw new Error(error.message);
  return rowToUser(data);
}

export async function sbListManagers(): Promise<User[]> {
  await bootstrap();
  const { data } = await getClient().from("users").select("*").eq("role", "manager");
  return (data || []).map(rowToUser);
}

// --- Sessions ---

export async function sbCreateSession(userId: string): Promise<string> {
  await bootstrap();
  const token = crypto.randomBytes(32).toString("hex");
  const { error } = await getClient().from("sessions").insert({ token, userId, expires: Date.now() + SESSION_TTL_MS });
  if (error) throw new Error(error.message);
  return token;
}

export async function sbGetSessionUser(token?: string): Promise<User | null> {
  if (!token) return null;
  await bootstrap();
  const { data: session } = await getClient().from("sessions").select("*").eq("token", token).maybeSingle();
  if (!session) return null;
  if (session.expires < Date.now()) {
    await getClient().from("sessions").delete().eq("token", token);
    return null;
  }
  return (await sbFindUserById(session.userId)) || null;
}

export async function sbDestroySession(token?: string) {
  if (!token) return;
  await getClient().from("sessions").delete().eq("token", token);
}

// --- Orders ---

export async function sbListOrders(): Promise<Order[]> {
  await bootstrap();
  const { data } = await getClient().from("orders").select("*, order_items(*)");
  return (data || []).map(rowToOrder);
}

export async function sbAddOrder(order: Order): Promise<Order> {
  await bootstrap();
  const sb = getClient();
  // Idempotency: a retried offline order push must not insert a duplicate
  // order or decrement stock twice if the first attempt already committed but
  // the response was lost.
  const { data: existing } = await sb.from("orders").select("id").eq("id", order.id).maybeSingle();
  if (existing) return order;
  const { order_items: _omit, items, ...orderRow } = order as unknown as Record<string, unknown> & { items: Order["items"] };
  void _omit;
  const { error: orderErr } = await sb.from("orders").insert(orderRow);
  if (orderErr) throw new Error(orderErr.message);
  const itemRows = items.map((it) => ({ orderId: order.id, productId: it.productId, title: it.title, price: it.price, qty: it.qty }));
  if (itemRows.length) {
    const { error: itemErr } = await sb.from("order_items").insert(itemRows);
    if (itemErr) throw new Error(itemErr.message);
  }
  for (const it of items) {
    const p = await sb.from("products").select("stock").eq("id", it.productId).single();
    const current = (p.data?.stock as number | undefined) ?? 0;
    await sb.from("products").update({ stock: Math.max(0, current - it.qty) }).eq("id", it.productId);
  }
  return order;
}

export async function sbUpdateOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined> {
  await bootstrap();
  const { data } = await getClient()
    .from("orders")
    .update({ status, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select("*, order_items(*)")
    .single();
  return data ? rowToOrder(data) : undefined;
}

// --- Reviews ---

export async function sbListReviews(productId: string): Promise<Review[]> {
  await bootstrap();
  const { data } = await getClient().from("reviews").select("*").eq("productId", productId).order("createdAt", { ascending: false });
  return (data || []).map(rowToReview);
}

export async function sbAddReview(review: Review): Promise<Review> {
  await bootstrap();
  const sb = getClient();
  const { error } = await sb.from("reviews").insert(review);
  if (error) throw new Error(error.message);
  const { data: all } = await sb.from("reviews").select("rating").eq("productId", review.productId);
  const ratings = (all || []).map((r) => r.rating as number);
  if (ratings.length) {
    const avg = Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10;
    await sb.from("products").update({ rating: avg, reviews: ratings.length, updatedAt: new Date().toISOString() }).eq("id", review.productId);
  }
  return review;
}

export async function sbHasReviewed(productId: string, userId: string): Promise<boolean> {
  await bootstrap();
  const { data } = await getClient().from("reviews").select("id").eq("productId", productId).eq("userId", userId).limit(1).maybeSingle();
  return !!data;
}

// --- Coupons ---

export async function sbListCoupons(): Promise<Coupon[]> {
  await bootstrap();
  const { data } = await getClient().from("coupons").select("*");
  return (data || []).map(rowToCoupon);
}

export async function sbValidateCoupon(code: string, subtotal: number): Promise<{ discount: number; coupon: Coupon } | null> {
  await bootstrap();
  const { data } = await getClient().from("coupons").select("*").eq("code", code.toUpperCase()).maybeSingle();
  const coupon = data ? rowToCoupon(data) : undefined;
  if (!coupon || !coupon.active) return null;
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return null;
  if (typeof coupon.maxUses === "number" && coupon.used >= coupon.maxUses) return null;
  if (subtotal < coupon.minSubtotal) return null;

  let discount: number;
  if (coupon.type === "percent") {
    discount = (subtotal * coupon.value) / 100;
    if (typeof coupon.maxDiscount === "number") discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.value;
  }
  discount = Math.max(0, Math.min(discount, subtotal));
  return { discount: Math.round(discount * 100) / 100, coupon };
}

export async function sbRedeemCoupon(code: string, subtotal: number): Promise<{ discount: number; coupon: Coupon } | null> {
  const result = await sbValidateCoupon(code, subtotal);
  if (!result) return null;
  await getClient().from("coupons").update({ used: result.coupon.used + 1 }).eq("id", result.coupon.id);
  return result;
}

// --- Wishlist ---

export async function sbGetWishlistForUser(userId: string): Promise<string[]> {
  await bootstrap();
  const { data } = await getClient().from("wishlists").select("productId").eq("userId", userId);
  return (data || []).map((r) => String(r.productId));
}

export async function sbSetWishlistForUser(userId: string, ids: string[]) {
  await bootstrap();
  const sb = getClient();
  await sb.from("wishlists").delete().eq("userId", userId);
  const rows = ids.slice(0, 500).filter((id, i, arr) => arr.indexOf(id) === i).map((productId) => ({ userId, productId }));
  if (rows.length) {
    const { error } = await sb.from("wishlists").insert(rows);
    if (error) throw new Error(error.message);
  }
}

// --- Settings (keyed rows storing jsonb) ---

export async function sbGetSettings<T>(key: string): Promise<T | undefined> {
  await bootstrap();
  const { data } = await getClient().from("settings").select("value").eq("key", key).maybeSingle();
  return data ? (data.value as T) : undefined;
}

export async function sbSetSettings<T>(key: string, value: T): Promise<T> {
  await bootstrap();
  const { error } = await getClient()
    .from("settings")
    .upsert({ key, value: value as unknown as Record<string, unknown>, updatedAt: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return value;
}

// --- Category cards (shop-by-category) ---

export async function sbListCategoryCards(): Promise<CategoryCard[]> {
  await bootstrap();
  const { data } = await getClient()
    .from("category_cards")
    .select("*")
    .order("sortOrder", { ascending: true });
  return (data || []) as unknown as CategoryCard[];
}

export async function sbUpsertCategoryCard(card: CategoryCard): Promise<CategoryCard> {
  await bootstrap();
  const row = { ...card, updatedAt: new Date().toISOString() };
  const { error } = await getClient().from("category_cards").upsert(row as unknown as Record<string, unknown>, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return card;
}

export async function sbDeleteCategoryCard(id: string): Promise<boolean> {
  await bootstrap();
  const { error, data } = await getClient().from("category_cards").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  return Array.isArray(data) && data.length > 0;
}

// --- Catalog items ---

export async function sbListCatalogItems(): Promise<CatalogItem[]> {
  await bootstrap();
  const { data } = await getClient()
    .from("catalog_items")
    .select("*")
    .order("sortOrder", { ascending: true });
  return (data || []) as unknown as CatalogItem[];
}

export async function sbUpsertCatalogItem(item: CatalogItem): Promise<CatalogItem> {
  await bootstrap();
  const row = { ...item, updatedAt: new Date().toISOString() };
  const { error } = await getClient().from("catalog_items").upsert(row as unknown as Record<string, unknown>, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return item;
}

export async function sbDeleteCatalogItem(id: string): Promise<boolean> {
  await bootstrap();
  const { error, data } = await getClient().from("catalog_items").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  return Array.isArray(data) && data.length > 0;
}

// --- AI Image Importer: jobs & items ---

function rowToImageImportJob(r: Record<string, unknown>): ImageImportJob {
  return r as unknown as ImageImportJob;
}

function rowToImageImportItem(r: Record<string, unknown>): ImageImportItem {
  return r as unknown as ImageImportItem;
}

export async function sbListImageImportJobs(): Promise<ImageImportJob[]> {
  await bootstrap();
  const { data } = await getClient().from("image_import_jobs").select("*").order("createdAt", { ascending: false });
  return (data || []).map(rowToImageImportJob);
}

export async function sbGetImageImportJob(id: string): Promise<ImageImportJob | undefined> {
  await bootstrap();
  const { data } = await getClient().from("image_import_jobs").select("*").eq("id", id).maybeSingle();
  return data ? rowToImageImportJob(data) : undefined;
}

export async function sbCreateImageImportJob(job: ImageImportJob): Promise<ImageImportJob> {
  await bootstrap();
  const { data, error } = await getClient().from("image_import_jobs").insert(job as unknown as Record<string, unknown>).select().single();
  if (error) throw new Error(error.message);
  return rowToImageImportJob(data);
}

export async function sbUpdateImageImportJob(job: ImageImportJob): Promise<ImageImportJob> {
  await bootstrap();
  const { data, error } = await getClient().from("image_import_jobs").update(job as unknown as Record<string, unknown>).eq("id", job.id).select().single();
  if (error) throw new Error(error.message);
  return rowToImageImportJob(data);
}

export async function sbDeleteImageImportJob(id: string): Promise<boolean> {
  await bootstrap();
  const { error, data } = await getClient().from("image_import_jobs").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  return Array.isArray(data) && data.length > 0;
}

export async function sbListImageImportItems(jobId: string): Promise<ImageImportItem[]> {
  await bootstrap();
  const { data } = await getClient().from("image_import_items").select("*").eq("jobId", jobId).order("createdAt", { ascending: true });
  return (data || []).map(rowToImageImportItem);
}

export async function sbGetImageImportItem(id: string): Promise<ImageImportItem | undefined> {
  await bootstrap();
  const { data } = await getClient().from("image_import_items").select("*").eq("id", id).maybeSingle();
  return data ? rowToImageImportItem(data) : undefined;
}

export async function sbCreateImageImportItem(item: ImageImportItem): Promise<ImageImportItem> {
  await bootstrap();
  const { data, error } = await getClient().from("image_import_items").insert(item as unknown as Record<string, unknown>).select().single();
  if (error) throw new Error(error.message);
  return rowToImageImportItem(data);
}

export async function sbUpdateImageImportItem(item: ImageImportItem): Promise<ImageImportItem> {
  await bootstrap();
  const { data, error } = await getClient().from("image_import_items").update(item as unknown as Record<string, unknown>).eq("id", item.id).select().single();
  if (error) throw new Error(error.message);
  return rowToImageImportItem(data);
}

export async function sbGetImageImportItemByHash(hash: string): Promise<ImageImportItem | undefined> {
  await bootstrap();
  const { data } = await getClient().from("image_import_items").select("*").eq("fileHash", hash).limit(1).maybeSingle();
  return data ? rowToImageImportItem(data) : undefined;
}
