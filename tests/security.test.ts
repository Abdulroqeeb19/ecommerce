import { describe, it, expect } from "vitest";
import { validateProductInput } from "../src/lib/server/productValidation";
import { isValidOrderStatus } from "../src/lib/server/orderValidation";
import { validatePassword } from "../src/lib/server/passwordPolicy";
import { generateToptSecret, totpCode, verifyTotp, otpauthUri } from "../src/lib/server/totp";

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
  it("enforces a per-window limit and recovers after a fresh window", async () => {
    const { rateLimit } = await import("../src/lib/server/rateLimit");
    const req = new Request("http://localhost/api/test", { method: "POST" });
    expect((await rateLimit(req, 3, 6000)).ok).toBe(true);
    expect((await rateLimit(req, 3, 6000)).ok).toBe(true);
    expect((await rateLimit(req, 3, 6000)).ok).toBe(true);
    const fourth = await rateLimit(req, 3, 6000);
    expect(fourth.ok).toBe(false);
    expect(fourth.retryAfter).toBeGreaterThan(0);
  });
});

describe("TOTP (MFA)", () => {
  it("matches the RFC 6238 SHA1 test vector", () => {
    // RFC 6238 Appendix B: ASCII secret "12345678901234567890", T = 59s => "94287082" (8-digit).
    // Base32-encoded (the app's secret format), the last 6 digits are "287082".
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(totpCode(secret, 59000)).toBe("287082");
  });

  it("verifies a freshly generated code with ±1 step tolerance", () => {
    const secret = generateToptSecret();
    const code = totpCode(secret);
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, "000000")).toBe(false);
  });

  it("rejects malformed codes and wrong-length secrets are non-empty base32", () => {
    const secret = generateToptSecret();
    expect(secret.length).toBeGreaterThan(20);
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
    expect(verifyTotp(secret, "123")).toBe(false);
    expect(verifyTotp(secret, "abcdef")).toBe(false);
  });

  it("produces a valid otpauth URI", () => {
    const uri = otpauthUri("SECRET", "admin@gadgetstore.com", "AYINDEDUNNY ENTERPRISE");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("secret=SECRET");
    expect(uri).toContain("issuer=AYINDEDUNNY+ENTERPRISE");
    expect(uri).toContain("period=30");
    expect(uri).toContain("digits=6");
  });
});

describe("password policy", () => {
  it("accepts a compliant password", () => {
    expect(validatePassword("CorrectHorseBattery9").ok).toBe(true);
  });

  it("rejects short, all-lowercase and letter-only passwords", () => {
    expect(validatePassword("short1A!").ok).toBe(false);
    expect(validatePassword("alllowercase1").ok).toBe(false);
    expect(validatePassword("ALLUPPERCASE1").ok).toBe(false);
    expect(validatePassword("noNumbersHere").ok).toBe(false);
    expect(validatePassword(1234567890).ok).toBe(false);
  });
});