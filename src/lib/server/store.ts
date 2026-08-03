import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { SEED_PRODUCTS } from "../data";
import type { Order, Product, User } from "../types";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const DEFAULT_ADMIN_PASSWORD = "Admin@12345";
const DEFAULT_MANAGER_PASSWORD = "manager123";
const DEFAULT_CUSTOMER_PASSWORD = "customer123";

export interface DbShape {
  products: Product[];
  users: User[];
  orders: Order[];
  sessions: Record<string, { userId: string; expires: number }>;
  deleted: string[];
}

const DB_PATH = path.join(process.cwd(), process.env.DB_FILE || "data/db.json");

function readDb(): DbShape {
  try {
    if (!fs.existsSync(DB_PATH)) return { products: [], users: [], orders: [], sessions: {}, deleted: [] };
    const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    return { products: [], users: [], orders: [], sessions: {}, deleted: [], ...raw };
  } catch {
    return { products: [], users: [], orders: [], sessions: {}, deleted: [] };
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

  if (changed) writeDb(db);
  bootstrapped = true;
}

export function findUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  const db = getDb();
  return db.users.find((u) => u.id === id);
}

export function listProducts(): Product[] {
  return getDb().products;
}

export function getProduct(idOrSlug: string): Product | undefined {
  const db = getDb();
  return db.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

export function upsertProduct(product: Product): Product {
  const db = getDb();
  const idx = db.products.findIndex((p) => p.id === product.id);
  if (idx >= 0) db.products[idx] = product;
  else db.products.push(product);
  saveDb(db);
  return product;
}

export function updateStock(id: string, stock: number): Product | undefined {
  const db = getDb();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  db.products[idx].stock = stock;
  db.products[idx].updatedAt = new Date().toISOString();
  saveDb(db);
  return db.products[idx];
}

export function deleteProduct(id: string): boolean {
  const db = getDb();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  db.products.splice(idx, 1);
  if (!db.deleted.includes(id)) db.deleted.push(id);
  saveDb(db);
  return true;
}

export function listOrders(): Order[] {
  return getDb().orders;
}

export function addOrder(order: Order): Order {
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

export function updateOrderStatus(id: string, status: Order["status"]): Order | undefined {
  const db = getDb();
  const o = db.orders.find((x) => x.id === id);
  if (!o) return undefined;
  o.status = status;
  o.updatedAt = new Date().toISOString();
  saveDb(db);
  return o;
}

export function createSession(userId: string): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions[token] = { userId, expires: Date.now() + SESSION_TTL_MS };
  saveDb(db);
  return token;
}

export function getSessionUser(token?: string): User | null {
  if (!token) return null;
  const db = getDb();
  const s = db.sessions[token];
  if (!s) return null;
  if (s.expires < Date.now()) {
    delete db.sessions[token];
    saveDb(db);
    return null;
  }
  return findUserById(s.userId) || null;
}

export function destroySession(token?: string) {
  if (!token) return;
  const db = getDb();
  delete db.sessions[token];
  saveDb(db);
}
