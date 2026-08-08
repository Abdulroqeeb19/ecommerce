import { NextResponse } from "next/server";
import { addOrder, listOrders, listProducts, redeemCoupon, getManagerSchedule, managerForWeekday, findUserById } from "@/lib/server/store";
import { currentUser, requireRole } from "@/lib/server/auth";
import { notifyOrderPlaced } from "@/lib/server/notify";
import { rateLimit } from "@/lib/server/rateLimit";
import { uid, orderNumber } from "@/lib/utils";
import type { CustomerInfo, Order, OrderItem } from "@/lib/types";

const MAX_ITEMS = 50;
const MAX_QTY_PER_ITEM = 99;

function sanitizeCustomer(c: unknown): CustomerInfo {
  if (!c || typeof c !== "object") return { name: "" };
  const o = c as Record<string, unknown>;
  return {
    name: typeof o.name === "string" ? o.name.slice(0, 120) : "",
    email: typeof o.email === "string" ? o.email.slice(0, 254) : undefined,
    phone: typeof o.phone === "string" ? o.phone.slice(0, 40) : undefined,
    address: typeof o.address === "string" ? o.address.slice(0, 300) : undefined,
    school: typeof o.school === "string" ? o.school.slice(0, 120) : undefined,
    grade: typeof o.grade === "string" ? o.grade.slice(0, 40) : undefined,
    note: typeof o.note === "string" ? o.note.slice(0, 500) : undefined
  };
}

export async function GET() {
  const user = await currentUser();
  const denied = requireRole(user, ["admin", "manager"]);
  if (denied) return denied;
  return NextResponse.json(await listOrders());
}

export async function POST(req: Request) {
  const rl = rateLimit(req, 30);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const b = (body ?? {}) as Partial<Order>;
  if (!Array.isArray(b.items) || b.items.length === 0) {
    return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
  }
  if (b.items.length > MAX_ITEMS) {
    return NextResponse.json({ error: "Order contains too many items" }, { status: 400 });
  }

  const db = await listProducts();

  const items: OrderItem[] = [];
  const catalog = new Map(db.map((p) => [p.id, p]));

  for (const raw of b.items) {
    const it = raw as Partial<OrderItem>;
    if (!it.productId || typeof it.productId !== "string") {
      return NextResponse.json({ error: "Invalid item: missing productId" }, { status: 400 });
    }
    const qty = Math.floor(Number(it.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      return NextResponse.json({ error: `Invalid quantity for ${it.productId}` }, { status: 400 });
    }

    const product = catalog.get(it.productId);
    if (!product) {
      return NextResponse.json({ error: `Unknown product: ${it.productId}` }, { status: 400 });
    }
    if (product.stock < qty) {
      return NextResponse.json({ error: `Insufficient stock for ${product.title}` }, { status: 409 });
    }

    items.push({
      productId: product.id,
      title: product.title,
      price: product.price,
      qty
    });
  }

  const channel = b.channel === "school" ? "school" : "online";
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const couponCode = typeof b.couponCode === "string" ? b.couponCode.trim().toUpperCase().slice(0, 40) : undefined;
  let discount = 0;
  if (couponCode) {
    const result = await redeemCoupon(couponCode, subtotal);
    if (!result) {
      return NextResponse.json({ error: "Coupon is invalid, expired, or does not apply to this order" }, { status: 400 });
    }
    discount = result.discount;
  }
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  const order: Order = {
    id: typeof b.id === "string" ? b.id : uid("ord"),
    orderNumber: typeof b.orderNumber === "string" ? b.orderNumber.slice(0, 40) : orderNumber(),
    items,
    total,
    status: "pending",
    channel,
    customer: sanitizeCustomer(b.customer),
    source: channel === "school" ? "mini-store" : "web",
    couponCode,
    discount: discount || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: true
  };

  try {
    const saved = await addOrder(order);
    const schedule = await getManagerSchedule();
    const dutyManagerId = managerForWeekday(schedule, new Date().getDay());
    let dutyManagerName: string | undefined;
    let dutyManagerEmail: string | undefined;
    if (dutyManagerId) {
      const manager = await findUserById(dutyManagerId);
      if (manager && manager.role === "manager") {
        dutyManagerName = manager.name;
        dutyManagerEmail = manager.email;
      }
    }
    const result = await notifyOrderPlaced(saved, { dutyManagerName, dutyManagerEmail });
    return NextResponse.json({ ...saved, notifications: result }, { status: 201 });
  } catch (e) {
    console.error("Failed to save order:", e);
    return NextResponse.json({ error: "Order could not be processed" }, { status: 500 });
  }
}
