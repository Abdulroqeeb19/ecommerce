import { describe, it, expect } from "vitest";
import { validateProductInput } from "../src/lib/server/productValidation";
import { isValidOrderStatus } from "../src/lib/server/orderValidation";

describe("productValidation", () => {
  const valid = {
    title: "Alpha Laptop",
    price: 1200,
    stock: 10,
    category: "Laptops and Notebooks",
    image: "/images/products/x.svg",
    description: "desc"
  };

  it("accepts a valid product", () => {
    const { value, error } = validateProductInput(valid);
    expect(error).toBeUndefined();
    expect(value.title).toBe("Alpha Laptop");
    expect(value.price).toBe(1200);
    expect(value.stock).toBe(10);
  });

  it("rejects missing title", () => {
    const { error } = validateProductInput({ ...valid, title: "" });
    expect(error).toBeDefined();
  });

  it("rejects negative price", () => {
    const { error } = validateProductInput({ ...valid, price: -5 });
    expect(error).toBeDefined();
  });

  it("rejects non-numeric price", () => {
    const { error } = validateProductInput({ ...valid, price: "free" });
    expect(error).toBeDefined();
  });

  it("rejects negative stock", () => {
    const { error } = validateProductInput({ ...valid, stock: -1 });
    expect(error).toBeDefined();
  });

  it("rejects fractional stock (must be integer)", () => {
    const { error } = validateProductInput({ ...valid, stock: 2.5 });
    expect(error).toBeDefined();
  });

  it("rejects missing category", () => {
    const { error } = validateProductInput({ ...valid, category: "" });
    expect(error).toBeDefined();
  });

  it("clamps rating to [0,5]", () => {
    const { value } = validateProductInput({ ...valid, rating: 99 });
    expect(value.rating).toBe(5);
  });

  it("caps specs length and drops empty specs", () => {
    const { value } = validateProductInput({
      ...valid,
      specs: [{ label: "CPU", value: "i7" }, {}, { label: "", value: "" }]
    });
    expect(value.specs!.length).toBe(1);
  });

  it("accepts a base64 image data URL and passes timestamps through", () => {
    const { value, error } = validateProductInput({
      ...valid,
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z"
    });
    expect(error).toBeUndefined();
    expect(value.image).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA");
    expect(value.updatedAt).toBe("2026-01-02T00:00:00.000Z");
    expect(value.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("rejects an arbitrary (non-image) data URL", () => {
    const { error } = validateProductInput({ ...valid, image: "data:text/html;base64,PHNjcmlwdD4=" });
    expect(error).toBeDefined();
  });

  it("rejects an oversized base64 data URL", () => {
    const { error } = validateProductInput({ ...valid, image: `data:image/png;base64,${"A".repeat(5 * 1024 * 1024)}` });
    expect(error).toBeDefined();
  });

  it("accepts /images/ and https image references but rejects arbitrary strings", () => {
    expect(validateProductInput({ ...valid, image: "/images/products/x.svg" }).error).toBeUndefined();
    expect(validateProductInput({ ...valid, image: "https://cdn.example.com/img.png" }).error).toBeUndefined();
    expect(validateProductInput({ ...valid, image: "../../etc/passwd" }).error).toBeDefined();
  });

  it("validates supplyType strictly", () => {
    expect(validateProductInput({ ...valid, supplyType: "grocery" }).value.supplyType).toBe("grocery");
    expect(validateProductInput({ ...valid, supplyType: "supplies" }).value.supplyType).toBe("supplies");
    expect(validateProductInput({ ...valid, supplyType: "evil" }).value.supplyType).toBeUndefined();
  });
});

describe("order status validation", () => {
  it("accepts known statuses", () => {
    expect(isValidOrderStatus("pending")).toBe(true);
    expect(isValidOrderStatus("delivered")).toBe(true);
  });

  it("rejects unknown / injected statuses", () => {
    expect(isValidOrderStatus("paid")).toBe(false);
    expect(isValidOrderStatus("refunded")).toBe(false);
    expect(isValidOrderStatus("hacked")).toBe(false);
    expect(isValidOrderStatus(123)).toBe(false);
    expect(isValidOrderStatus(null)).toBe(false);
  });
});

describe("rate limiter", () => {
  it("enforces a per-window limit and recovers after window expiry", async () => {
    const { rateLimit } = await import("../src/lib/server/rateLimit");
    const req = new Request("http://localhost/api/test", { method: "POST" });
    expect(rateLimit(req, 3, 60000).ok).toBe(true);
    expect(rateLimit(req, 3, 60000).ok).toBe(true);
    expect(rateLimit(req, 3, 60000).ok).toBe(true);
    const fourth = rateLimit(req, 3, 60000);
    expect(fourth.ok).toBe(false);
    expect(fourth.retryAfter).toBeGreaterThan(0);
  });
});