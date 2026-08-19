import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { SEED_PRODUCTS } from "../data";
import { CATALOG_ITEMS, DEFAULT_CATEGORY_CARDS } from "../brand";
import type { CatalogItem, CategoryCard, Coupon, NotificationSettings, Order, PasswordReset, Product, Review, User } from "../types";
import type { ImageImportItem, ImageImportJob } from "../types";
import * as sb from "./supabase";

export const SESSION_TTL_MS = sb.SESSION_TTL_MS;
export const PASSWORD_RESET_TTL_MS = sb.PASSWORD_RESET_TTL_MS;

// Backend selection: Supabase when creds are configured and not explicitly disabled.
const USE_SUPABASE =
  !!process.env.SUPABASE_URL &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.STORE_BACKEND !== "json";

const DEFAULT_ADMIN_PASSWORD = "Admin@12345";
const DEFAULT_MANAGER_PASSWORD = "manager123";
const DEFAULT_CUSTOMER_PASSWORD = "customer123";

export interface DbShape {
  products: Product[];
  users: User[];
  orders: Order[];
  sessions: Record<string, { userId: string; expires: number; status?: "active" | "pending_mfa" }>;
  deleted: string[];
  reviews: Review[];
  coupons: Coupon[];
  wishlists: Record<string, string[]>;
  settings: Record<string, NotificationSettings>;
  categoryCards: CategoryCard[];
  catalogItems: CatalogItem[];
  imageImportJobs: ImageImportJob[];
  imageImportItems: ImageImportItem[];
  passwordResets: PasswordReset[];
}

const DB_PATH = process.env.DB_FILE
  ? path.isAbsolute(process.env.DB_FILE)
    ? process.env.DB_FILE
    : path.join(process.cwd(), process.env.DB_FILE)
  : path.join(process.cwd(), "data/db.json");

const EMPTY_DB: DbShape = {
  products: [],
  users: [],
  orders: [],
  sessions: {},
  deleted: [],
  reviews: [],
  coupons: [],
  wishlists: {},
  settings: {},
  categoryCards: [],
  catalogItems: [],
  imageImportJobs: [],
  imageImportItems: [],
  passwordResets: []
};

function readDb(): DbShape {
  try {
    if (!fs.existsSync(DB_PATH)) return { ...EMPTY_DB };
    const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    return { ...EMPTY_DB, ...raw };
  } catch {
    return { ...EMPTY_DB };
  }
}

function writeDb(db: DbShape) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function getDb(): DbShape {
  const db = readDb();
  ensureBootstrapped(db);
  return db;
}

export function saveDb(db: DbShape) {
  writeDb(db);
}

let bootstrapped = false;

function ensureBootstrapped(db: DbShape) {
  if (bootstrapped && db.products.length) return;
  let changed = false;

  if (db.products.length === 0) {
    db.products = SEED_PRODUCTS.filter((p) => !db.deleted.includes(p.id)).map((p) => ({ ...p }));
    changed = true;
  } else {
    const existing = new Set(db.products.map((p) => p.id));
    const missing = SEED_PRODUCTS.filter((p) => !existing.has(p.id) && !db.deleted.includes(p.id));
    if (missing.length) {
      db.products.push(...missing.map((p) => ({ ...p })));
      changed = true;
    }
  }

  const emailIndex = new Set(db.users.map((u) => u.email.toLowerCase()));
  const isProd = process.env.NODE_ENV === "production";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@gadgetstore.com";
  const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  if (isProd && !process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD must be set in production");
  }
  if (!isProd && adminPassword === DEFAULT_ADMIN_PASSWORD) {
    console.warn("[security] Default admin password is in use. Set ADMIN_PASSWORD for any shared deployment.");
  }

  if (!emailIndex.has(adminEmail.toLowerCase())) {
    db.users.push({
      id: `usr_admin`,
      name: "Store Owner",
      email: adminEmail,
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      role: "admin",
      createdAt: new Date().toISOString()
    });
    emailIndex.add(adminEmail.toLowerCase());
    changed = true;
  }

  const managerEmails = (process.env.MANAGER_EMAILS || "manager1@gadgetstore.com,manager2@gadgetstore.com,manager3@gadgetstore.com")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .slice(0, 3);

  managerEmails.forEach((email, i) => {
    if (!emailIndex.has(email.toLowerCase())) {
      db.users.push({
        id: `usr_manager_${i + 1}`,
        name: `Mini-Store Manager ${i + 1}`,
        email,
        passwordHash: bcrypt.hashSync(process.env.MANAGER_PASSWORD || DEFAULT_MANAGER_PASSWORD, 10),
        role: "manager",
        createdAt: new Date().toISOString()
      });
      emailIndex.add(email.toLowerCase());
      changed = true;
    }
  });

  const customerEmail = "customer@gadgetstore.com";
  if (!emailIndex.has(customerEmail)) {
    db.users.push({
      id: "usr_customer",
      name: "Demo Customer",
      email: customerEmail,
      passwordHash: bcrypt.hashSync(process.env.CUSTOMER_PASSWORD || DEFAULT_CUSTOMER_PASSWORD, 10),
      role: "customer",
      createdAt: new Date().toISOString()
    });
    changed = true;
  }

  if (db.reviews.length === 0 && db.products.length > 0) {
    const sampleAuthors = ["Adaeze O.", "Michael T.", "Kemi A.", "Chidi E.", "Sarah B."];
    const sampleComments = [
      "Exactly as described. Fast delivery and the quality exceeded my expectations.",
      "Great value for money. Packaging was professional and the device works flawlessly.",
      "Ordered through the mini-store for schools on Monday and it arrived the same week. Impressive service!",
      "Solid build quality. Would definitely recommend to colleagues.",
      "Works as advertised. Setup was straightforward and support was helpful."
    ];
    for (const p of db.products) {
      for (let i = 0; i < 3; i++) {
        const rating = [5, 4, 5][i % 3];
        db.reviews.push({
          id: `rev_${p.id}_${i}`,
          productId: p.id,
          author: sampleAuthors[(i + db.products.indexOf(p)) % sampleAuthors.length],
          rating,
          title: ["Great purchase", "Worth the money", "Very satisfied"][i % 3],
          comment: sampleComments[i % sampleComments.length],
          verified: true,
          createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString()
        });
      }
    }
    changed = true;
  }

  if (db.coupons.length === 0) {
    db.coupons.push(
      { id: "coup_welcome10", code: "WELCOME10", type: "percent", value: 10, minSubtotal: 0, maxDiscount: 100, active: true, used: 0, description: "10% off your first order (up to $100)" },
      { id: "coup_save50", code: "SAVE50", type: "fixed", value: 50, minSubtotal: 200, active: true, used: 0, description: "$50 off orders over $200" },
      { id: "coup_student15", code: "STUDENT15", type: "percent", value: 15, minSubtotal: 100, maxDiscount: 150, active: true, used: 0, description: "15% off for students (up to $150)" }
    );
    changed = true;
  }

  if (db.categoryCards.length === 0) {
    db.categoryCards = DEFAULT_CATEGORY_CARDS.map((c) => ({ ...c }));
    changed = true;
  }
  if (db.catalogItems.length === 0) {
    db.catalogItems = CATALOG_ITEMS.map((i) => ({ ...i }));
    changed = true;
  }

  if (changed) writeDb(db);
  bootstrapped = true;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  if (USE_SUPABASE) return sb.sbFindUserByEmail(email);
  return getDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string): Promise<User | undefined> {
  if (USE_SUPABASE) return sb.sbFindUserById(id);
  return getDb().users.find((u) => u.id === id);
}

export async function createUser(user: User): Promise<User> {
  if (USE_SUPABASE) return sb.sbCreateUser(user);
  const db = getDb();
  db.users.push(user);
  saveDb(db);
  return user;
}

export async function listManagers(): Promise<User[]> {
  if (USE_SUPABASE) return sb.sbListManagers();
  return getDb().users.filter((u) => u.role === "manager");
}

export async function listProducts(): Promise<Product[]> {
  if (USE_SUPABASE) return sb.sbListProducts();
  return getDb().products;
}

export async function getProduct(idOrSlug: string): Promise<Product | undefined> {
  if (USE_SUPABASE) return sb.sbGetProduct(idOrSlug);
  return getDb().products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

export async function upsertProduct(product: Product): Promise<Product> {
  if (USE_SUPABASE) return sb.sbUpsertProduct(product);
  const db = getDb();
  const idx = db.products.findIndex((p) => p.id === product.id);
  if (idx >= 0) db.products[idx] = product;
  else db.products.push(product);
  saveDb(db);
  return product;
}

export async function upsertProductIfFresh(
  product: Product
): Promise<{ ok: true; product: Product } | { ok: false; error: string; existing: Product }> {
  if (USE_SUPABASE) return sb.sbUpsertProductIfFresh(product);
  const db = getDb();
  const idx = db.products.findIndex((p) => p.id === product.id);
  if (idx >= 0 && product.updatedAt) {
    const existing = db.products[idx];
    if (existing.updatedAt && existing.updatedAt > product.updatedAt) {
      return { ok: false, error: "Conflict: this product was updated elsewhere after your last edit.", existing };
    }
  }
  if (idx >= 0) db.products[idx] = product;
  else db.products.push(product);
  saveDb(db);
  return { ok: true, product };
}

export async function updateStock(id: string, stock: number): Promise<Product | undefined> {
  if (USE_SUPABASE) return sb.sbUpdateStock(id, stock);
  const db = getDb();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  db.products[idx].stock = stock;
  db.products[idx].updatedAt = new Date().toISOString();
  saveDb(db);
  return db.products[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (USE_SUPABASE) return sb.sbDeleteProduct(id);
  const db = getDb();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  db.products.splice(idx, 1);
  if (!db.deleted.includes(id)) db.deleted.push(id);
  saveDb(db);
  return true;
}

export async function listOrders(): Promise<Order[]> {
  if (USE_SUPABASE) return sb.sbListOrders();
  return getDb().orders;
}

export async function addOrder(order: Order): Promise<Order> {
  if (USE_SUPABASE) return sb.sbAddOrder(order);
  const db = getDb();
  const existing = db.orders.find((o) => o.id === order.id);
  if (existing) {
    Object.assign(existing, order, { updatedAt: new Date().toISOString() });
  } else {
    db.orders.push({ ...order, synced: true });
    for (const it of order.items) {
      const p = db.products.find((x) => x.id === it.productId);
      if (p) p.stock = Math.max(0, p.stock - it.qty);
    }
  }
  saveDb(db);
  return order;
}

export async function updateOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined> {
  if (USE_SUPABASE) return sb.sbUpdateOrderStatus(id, status);
  const db = getDb();
  const o = db.orders.find((x) => x.id === id);
  if (!o) return undefined;
  o.status = status;
  o.updatedAt = new Date().toISOString();
  saveDb(db);
  return o;
}

export async function createSession(userId: string, status: "active" | "pending_mfa" = "active"): Promise<string> {
  if (USE_SUPABASE) return sb.sbCreateSession(userId, status);
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions[token] = { userId, expires: Date.now() + SESSION_TTL_MS, status };
  saveDb(db);
  return token;
}

export async function getSessionUser(token?: string, opts: { pendingMfa?: boolean } = {}): Promise<User | null> {
  if (!token) return null;
  if (USE_SUPABASE) return sb.sbGetSessionUser(token, opts);
  const db = getDb();
  const s = db.sessions[token];
  if (!s) return null;
  if (s.expires < Date.now()) {
    delete db.sessions[token];
    saveDb(db);
    return null;
  }
  if (!opts.pendingMfa && s.status === "pending_mfa") return null;
  return (await findUserById(s.userId)) || null;
}

export async function activatePendingSession(token: string, budgetMs: number): Promise<User | null> {
  if (USE_SUPABASE) return sb.sbActivatePendingSession(token, budgetMs);
  const db = getDb();
  const s = db.sessions[token];
  if (!s) return null;
  if (s.expires < Date.now() || s.status !== "pending_mfa") return null;
  if (s.expires > Date.now() + budgetMs) return null;
  s.status = "active";
  s.expires = Date.now() + SESSION_TTL_MS;
  saveDb(db);
  return (await findUserById(s.userId)) || null;
}

export async function destroySession(token?: string) {
  if (!token) return;
  if (USE_SUPABASE) return sb.sbDestroySession(token);
  const db = getDb();
  delete db.sessions[token];
  saveDb(db);
}

export async function updateUser(
  userId: string,
  patch: Partial<Pick<User, "passwordHash" | "mfaSecret" | "mfaEnabled" | "name">>
): Promise<User | undefined> {
  if (USE_SUPABASE) return sb.sbUpdateUser(userId, patch);
  const db = getDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx < 0) return undefined;
  db.users[idx] = { ...db.users[idx], ...patch };
  saveDb(db);
  return db.users[idx];
}

export async function revokeAllSessions(userId: string) {
  if (USE_SUPABASE) return sb.sbRevokeAllSessions(userId);
  const db = getDb();
  for (const key of Object.keys(db.sessions)) {
    if (db.sessions[key].userId === userId) delete db.sessions[key];
  }
  saveDb(db);
}

export async function createPasswordReset(userId: string): Promise<string> {
  if (USE_SUPABASE) return sb.sbCreatePasswordReset(userId);
  const db = getDb();
  const token = crypto.randomBytes(32).toString("base64url");
  db.passwordResets.push({
    id: `prt_${crypto.randomUUID()}`,
    userId,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    expiresAt: Date.now() + PASSWORD_RESET_TTL_MS,
    createdAt: new Date().toISOString()
  });
  saveDb(db);
  return token;
}

export async function consumePasswordReset(token: string): Promise<User | undefined> {
  if (USE_SUPABASE) return sb.sbConsumePasswordReset(token);
  const db = getDb();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const idx = db.passwordResets.findIndex((r) => r.tokenHash === tokenHash);
  if (idx < 0) return undefined;
  const reset = db.passwordResets[idx];
  if (reset.consumedAt || reset.expiresAt < Date.now()) return undefined;
  reset.consumedAt = new Date().toISOString();
  saveDb(db);
  return db.users.find((u) => u.id === reset.userId);
}

export async function listReviews(productId: string): Promise<Review[]> {
  if (USE_SUPABASE) return sb.sbListReviews(productId);
  return getDb().reviews
    .filter((r) => r.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addReview(review: Review): Promise<Review> {
  if (USE_SUPABASE) return sb.sbAddReview(review);
  const db = getDb();
  db.reviews.push(review);
  const ratings = db.reviews.filter((r) => r.productId === review.productId);
  const product = db.products.find((p) => p.id === review.productId);
  if (product && ratings.length) {
    product.rating = Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10;
    product.reviews = ratings.length;
    product.updatedAt = new Date().toISOString();
  }
  saveDb(db);
  return review;
}

export async function hasReviewed(productId: string, userId: string): Promise<boolean> {
  if (USE_SUPABASE) return sb.sbHasReviewed(productId, userId);
  return getDb().reviews.some((r) => r.productId === productId && r.userId === userId);
}

export async function validateCoupon(code: string, subtotal: number): Promise<{ discount: number; coupon: Coupon } | null> {
  if (USE_SUPABASE) return sb.sbValidateCoupon(code, subtotal);
  const db = getDb();
  const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
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

export async function redeemCoupon(code: string, subtotal: number): Promise<{ discount: number; coupon: Coupon } | null> {
  if (USE_SUPABASE) return sb.sbRedeemCoupon(code, subtotal);
  const result = await validateCoupon(code, subtotal);
  if (!result) return null;
  const db = getDb();
  const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (coupon) {
    coupon.used += 1;
    saveDb(db);
  }
  return result;
}

export async function listCoupons(): Promise<Coupon[]> {
  if (USE_SUPABASE) return sb.sbListCoupons();
  return getDb().coupons;
}

export async function getWishlistForUser(userId: string): Promise<string[]> {
  if (USE_SUPABASE) return sb.sbGetWishlistForUser(userId);
  return getDb().wishlists[userId] || [];
}

export async function setWishlistForUser(userId: string, ids: string[]) {
  if (USE_SUPABASE) return sb.sbSetWishlistForUser(userId, ids);
  const db = getDb();
  db.wishlists[userId] = ids.slice(0, 500).filter((id, i, arr) => arr.indexOf(id) === i);
  saveDb(db);
}

export async function getSettings<T>(key: string): Promise<T | undefined> {
  if (USE_SUPABASE) return sb.sbGetSettings<T>(key);
  return getDb().settings[key] as T | undefined;
}

export async function setSettings<T>(key: string, value: T): Promise<T> {
  if (USE_SUPABASE) return sb.sbSetSettings<T>(key, value);
  const db = getDb();
  db.settings[key] = value as NotificationSettings;
  saveDb(db);
  return value;
}

export const MANAGER_SCHEDULE_KEY = "managerSchedule";

export async function getManagerSchedule(): Promise<Record<string, string>> {
  const stored = await getSettings<Record<string, string>>(MANAGER_SCHEDULE_KEY);
  return stored && typeof stored === "object" ? stored : {};
}

export async function setManagerSchedule(schedule: Record<string, string>) {
  await setSettings(MANAGER_SCHEDULE_KEY, schedule);
}

export function managerForWeekday(schedule: Record<string, string>, dayIndex: number): string | null {
  const id = schedule[String(dayIndex)];
  return id && String(id).trim() ? String(id).trim() : null;
}

export const MANAGER_WHATSAPP_KEY = "managerWhatsapp";

export async function getManagerWhatsapps(): Promise<Record<string, string>> {
  const stored = await getSettings<Record<string, string>>(MANAGER_WHATSAPP_KEY);
  return stored && typeof stored === "object" ? stored : {};
}

export async function setManagerWhatsapps(whatsapp: Record<string, string>) {
  await setSettings(MANAGER_WHATSAPP_KEY, whatsapp);
}

export const ORDERING_SCHEDULE_KEY = "orderingSchedule";

export async function getOrderingSchedule(): Promise<Record<string, number>> {
  const stored = await getSettings<Record<string, number>>(ORDERING_SCHEDULE_KEY);
  return stored && typeof stored === "object" ? stored : {};
}

export async function setOrderingSchedule(schedule: Record<string, number>) {
  await setSettings(ORDERING_SCHEDULE_KEY, schedule);
}

export async function listCategoryCards(): Promise<CategoryCard[]> {
  if (USE_SUPABASE) return sb.sbListCategoryCards();
  return getDb().categoryCards;
}

export async function upsertCategoryCard(card: CategoryCard): Promise<CategoryCard> {
  if (USE_SUPABASE) return sb.sbUpsertCategoryCard(card);
  const db = getDb();
  const idx = db.categoryCards.findIndex((c) => c.id === card.id);
  if (idx >= 0) db.categoryCards[idx] = card;
  else db.categoryCards.push(card);
  saveDb(db);
  return card;
}

export async function deleteCategoryCard(id: string): Promise<boolean> {
  if (USE_SUPABASE) return sb.sbDeleteCategoryCard(id);
  const db = getDb();
  const idx = db.categoryCards.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  db.categoryCards.splice(idx, 1);
  saveDb(db);
  return true;
}

export async function listCatalogItems(): Promise<CatalogItem[]> {
  if (USE_SUPABASE) return sb.sbListCatalogItems();
  return getDb().catalogItems;
}

export async function upsertCatalogItem(item: CatalogItem): Promise<CatalogItem> {
  if (USE_SUPABASE) return sb.sbUpsertCatalogItem(item);
  const db = getDb();
  const idx = db.catalogItems.findIndex((i) => i.id === item.id);
  if (idx >= 0) db.catalogItems[idx] = item;
  else db.catalogItems.push(item);
  saveDb(db);
  return item;
}

export async function deleteCatalogItem(id: string): Promise<boolean> {
  if (USE_SUPABASE) return sb.sbDeleteCatalogItem(id);
  const db = getDb();
  const idx = db.catalogItems.findIndex((i) => i.id === id);
  if (idx < 0) return false;
  db.catalogItems.splice(idx, 1);
  saveDb(db);
  return true;
}

// --- AI Image Importer: jobs & items ---

export async function listImageImportJobs(): Promise<ImageImportJob[]> {
  if (USE_SUPABASE) return sb.sbListImageImportJobs();
  return [...getDb().imageImportJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getImageImportJob(id: string): Promise<ImageImportJob | undefined> {
  if (USE_SUPABASE) return sb.sbGetImageImportJob(id);
  return getDb().imageImportJobs.find((j) => j.id === id);
}

export async function createImageImportJob(job: ImageImportJob): Promise<ImageImportJob> {
  if (USE_SUPABASE) return sb.sbCreateImageImportJob(job);
  const db = getDb();
  db.imageImportJobs.push(job);
  saveDb(db);
  return job;
}

export async function updateImageImportJob(job: ImageImportJob): Promise<ImageImportJob> {
  if (USE_SUPABASE) return sb.sbUpdateImageImportJob(job);
  const db = getDb();
  const idx = db.imageImportJobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) db.imageImportJobs[idx] = job;
  else db.imageImportJobs.push(job);
  saveDb(db);
  return job;
}

export async function deleteImageImportJob(id: string): Promise<boolean> {
  if (USE_SUPABASE) return sb.sbDeleteImageImportJob(id);
  const db = getDb();
  const idx = db.imageImportJobs.findIndex((j) => j.id === id);
  if (idx < 0) return false;
  db.imageImportJobs.splice(idx, 1);
  db.imageImportItems = db.imageImportItems.filter((i) => i.jobId !== id);
  saveDb(db);
  return true;
}

export async function listImageImportItems(jobId: string): Promise<ImageImportItem[]> {
  if (USE_SUPABASE) return sb.sbListImageImportItems(jobId);
  return getDb()
    .imageImportItems.filter((i) => i.jobId === jobId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getImageImportItem(id: string): Promise<ImageImportItem | undefined> {
  if (USE_SUPABASE) return sb.sbGetImageImportItem(id);
  return getDb().imageImportItems.find((i) => i.id === id);
}

export async function createImageImportItem(item: ImageImportItem): Promise<ImageImportItem> {
  if (USE_SUPABASE) return sb.sbCreateImageImportItem(item);
  const db = getDb();
  db.imageImportItems.push(item);
  saveDb(db);
  return item;
}

export async function updateImageImportItem(item: ImageImportItem): Promise<ImageImportItem> {
  if (USE_SUPABASE) return sb.sbUpdateImageImportItem(item);
  const db = getDb();
  const idx = db.imageImportItems.findIndex((i) => i.id === item.id);
  if (idx >= 0) db.imageImportItems[idx] = item;
  else db.imageImportItems.push(item);
  saveDb(db);
  return item;
}

export async function getImageImportItemByHash(hash: string): Promise<ImageImportItem | undefined> {
  if (USE_SUPABASE) return sb.sbGetImageImportItemByHash(hash);
  return getDb().imageImportItems.find((i) => i.fileHash === hash);
}
