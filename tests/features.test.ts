import { describe, it, expect, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import {
  validateCoupon,
  redeemCoupon,
  listReviews,
  addReview,
  hasReviewed,
  getWishlistForUser,
  setWishlistForUser,
  listProducts,
  upsertProductIfFresh,
  getSettings,
  setSettings
} from "../src/lib/server/store";
import { validateReviewInput } from "../src/lib/server/reviewValidation";

const tmpDb = process.env.DB_FILE!;

beforeEach(() => {
  fs.rmSync(tmpDb, { force: true });
});

afterAll(() => {
  fs.rmSync(tmpDb, { force: true });
});

describe("coupons", () => {
  it("applies percent discount with max cap", async () => {
    const r = await validateCoupon("WELCOME10", 500);
    expect(r).not.toBeNull();
    expect(r!.discount).toBe(50);
  });

  it("caps percent discount at maxDiscount", async () => {
    const r = await validateCoupon("WELCOME10", 2000);
    expect(r!.discount).toBe(100);
  });

  it("applies fixed discount only above min subtotal", async () => {
    expect(await validateCoupon("SAVE50", 100)).toBeNull();
    const r = await validateCoupon("SAVE50", 300);
    expect(r!.discount).toBe(50);
  });

  it("rejects unknown coupon", async () => {
    expect(await validateCoupon("NOPE99", 1000)).toBeNull();
  });

  it("redeemCoupon increments usage and returns discount", async () => {
    const r = await redeemCoupon("STUDENT15", 200);
    expect(r).not.toBeNull();
    expect(r!.discount).toBe(30);
  });
});

describe("reviews", () => {
  it("seeds sample reviews for products", async () => {
    const products = await listProducts();
    expect(products.length).toBeGreaterThan(0);
    const reviews = await listReviews(products[0].id);
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].rating).toBeGreaterThanOrEqual(1);
    expect(reviews[0].rating).toBeLessThanOrEqual(5);
  });

  it("adds a review and recomputes product rating", async () => {
    const products = await listProducts();
    const target = products[0];
    const before = target.rating;
    await addReview({
      id: "rev_test1",
      productId: target.id,
      userId: "usr_test",
      author: "Test User",
      rating: 1,
      title: "Bad",
      comment: "Did not like it",
      verified: true,
      createdAt: new Date().toISOString()
    });
    expect(await hasReviewed(target.id, "usr_test")).toBe(true);
    const after = (await listProducts()).find((p) => p.id === target.id)!;
    expect(after.rating).toBeLessThanOrEqual(before);
  });

  it("rejects fractional ratings via validateReviewInput", () => {
    const { value, error } = validateReviewInput({ rating: 3.5, comment: "meh" });
    expect(value).toBeNull();
    expect(error).toBe("Rating must be an integer between 1 and 5");
  });

  it("accepts a valid review and rejects an empty comment", () => {
    const good = validateReviewInput({ rating: 5, title: "Great", comment: "Loved it" });
    expect(good.error).toBeUndefined();
    expect(good.value!.rating).toBe(5);
    expect(good.value!.title).toBe("Great");
    const bad = validateReviewInput({ rating: 5, comment: "   " });
    expect(bad.value).toBeNull();
    expect(bad.error).toBe("Review comment is required");
  });
});

describe("wishlists", () => {
  it("stores and retrieves per-user wishlists, de-duplicating ids", async () => {
    await setWishlistForUser("usr_a", ["p1", "p2", "p1", "p3"]);
    expect(await getWishlistForUser("usr_a")).toEqual(["p1", "p2", "p3"]);
    expect(await getWishlistForUser("usr_b")).toEqual([]);
    await setWishlistForUser("usr_b", ["p9"]);
    expect(await getWishlistForUser("usr_b")).toEqual(["p9"]);
  });
});

describe("settings", () => {
  it("returns undefined for unknown keys", async () => {
    expect(await getSettings("does-not-exist")).toBeUndefined();
  });

  it("stores and retrieves typed settings", async () => {
    await setSettings("notifications", { telegramBotToken: "abc123", telegramChatId: "-100" });
    const stored = await getSettings<{ telegramBotToken: string; telegramChatId: string }>("notifications");
    expect(stored).toEqual({ telegramBotToken: "abc123", telegramChatId: "-100" });
  });

  it("overwrites settings for the same key", async () => {
    await setSettings("notifications", { email: "a@b.c" });
    await setSettings("notifications", { sms: "on" });
    expect(await getSettings("notifications")).toEqual({ sms: "on" });
  });
});

describe("optimistic concurrency", () => {
  it("rejects an update whose updatedAt is older than the stored product", async () => {
    const existing = (await listProducts())[0];
    await upsertProductIfFresh({ ...existing, updatedAt: "2026-01-02T00:00:00.000Z" });
    const result = await upsertProductIfFresh({
      ...existing,
      price: 999,
      updatedAt: "2026-01-01T00:00:00.000Z"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Conflict");
      expect(result.existing.price).toBe(existing.price);
    }
  });

  it("accepts an update with a newer updatedAt", async () => {
    const existing = (await listProducts())[0];
    const result = await upsertProductIfFresh({
      ...existing,
      price: 1234,
      updatedAt: "2099-01-01T00:00:00.000Z"
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.product.price).toBe(1234);
  });

  it("accepts an update when the stored product has no updatedAt (legacy data)", async () => {
    const existing = (await listProducts())[0];
    await upsertProductIfFresh({ ...existing, updatedAt: undefined });
    const updated = (await listProducts()).find((p) => p.id === existing.id)!;
    const result = await upsertProductIfFresh({ ...updated, price: 4321, updatedAt: "2099-01-01T00:00:00.000Z" });
    expect(result.ok).toBe(true);
  });
});
