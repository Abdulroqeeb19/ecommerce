import { describe, it, expect, beforeEach, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

process.env.DB_FILE = path.join(os.tmpdir(), `gadget-hub-tg-test-${Date.now()}.json`);

const { addOrder } = await import("../src/lib/server/store");
const { lowStockSummary, orderActionKeyboard, completeOrderCallback, ordersPendingText, escapeMarkdown } =
  await import("../src/lib/server/telegramBot");
import type { Order, Product } from "../src/lib/types";

const tmpDb = process.env.DB_FILE!;

beforeEach(() => {
  fs.rmSync(tmpDb, { force: true });
});

afterAll(() => {
  fs.rmSync(tmpDb, { force: true });
});

function sampleProduct(): Product {
  return {
    id: "p1",
    slug: "blue-pen",
    title: "Blue Pen",
    category: "Stationery",
    brand: "Bic",
    price: 1.5,
    stock: 4,
    rating: 4,
    reviews: 0,
    image: "/img.png",
    shortDescription: "x",
    description: "y",
    specs: [],
    tags: [],
    miniStore: true
  };
}

function sampleOrder(id: string): Order {
  return {
    id,
    orderNumber: `GH-TEST-${id}`,
    items: [{ productId: "p1", title: "Blue Pen", price: 1.5, qty: 3 }],
    total: 4.5,
    status: "pending",
    channel: "school",
    customer: { name: "Ada Obi", grade: "JSS1" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: true
  };
}

describe("telegram bot helpers", () => {
  it("builds order action buttons with the correct callback data", () => {
    const kb = orderActionKeyboard("ord_1");
    const buttons = kb.inline_keyboard.flat();
    expect(buttons.map((b) => b.callback_data)).toEqual([
      "order:approve:ord_1",
      "order:deliver:ord_1",
      "order:cancel:ord_1"
    ]);
  });

  it("lights up only products at or under 5 units", async () => {
    const out = lowStockSummary([sampleProduct(), { ...sampleProduct(), id: "p2", stock: 9 }]);
    expect(out).toContain("Blue Pen");
    expect(out).toContain("4");
    expect(out).not.toContain("9");
  });

  it("moves a pending order to processing on approve", async () => {
    await addOrder(sampleOrder("o_approve"));
    const r = await completeOrderCallback("approve", "o_approve");
    expect(r.ok).toBe(true);
    expect(r.message).toContain("processing");
  });

  it("delivers and cancels from chat", async () => {
    await addOrder(sampleOrder("o_deliver"));
    await addOrder(sampleOrder("o_cancel"));
    expect((await completeOrderCallback("deliver", "o_deliver")).message).toContain("delivered");
    expect((await completeOrderCallback("cancel", "o_cancel")).message).toContain("cancelled");
    expect((await completeOrderCallback("nope", "o_cancel")).message).toContain("Unknown action");
  });

  it("pending text lists only pending orders", async () => {
    await addOrder(sampleOrder("o_p1"));
    const delivered = sampleOrder("o_done");
    delivered.status = "delivered";
    await addOrder(delivered);
    const text = await ordersPendingText();
    expect(text).toContain("o_p1");
    expect(text).not.toContain("o_done");
  });

  it("escapeMarkdown escapes special characters", () => {
    expect(escapeMarkdown("A *star* _under_")).toBe("A \\*star\\* \\_under\\_");
  });
});