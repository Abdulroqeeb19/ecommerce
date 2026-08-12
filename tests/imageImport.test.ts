import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectImageMime,
  validateImage,
  sha256,
  tokenize,
  scoreCandidate,
  findBestMatch,
  confidenceLevel,
  generateFilename,
  generateAltText,
  slugifyName,
  DEFAULT_AUTO_MATCH_THRESHOLD,
  DEFAULT_REVIEW_THRESHOLD
} from "@/lib/server/imageImport";
import { matchByFilename, matchByVision } from "@/lib/server/bulkImageImport";
import type { AiImageAnalysis, Product } from "@/lib/types";

vi.mock("@/lib/server/aiVision", () => ({
  analyzeImage: vi.fn()
}));
import { analyzeImage } from "@/lib/server/aiVision";

function makeAnalysis(over: Partial<AiImageAnalysis> = {}): AiImageAnalysis {
  return {
    product_type: null,
    brand: null,
    model: null,
    color: null,
    visible_text: [],
    category: null,
    variant: null,
    confidence: 90,
    ...over
  };
}

function makeProduct(over: Partial<Product> = {}): Product {
  return {
    id: "prd_1",
    slug: "logitech-m185-wireless-mouse-black",
    title: "Logitech M185 Wireless Mouse Black",
    category: "Computer Accessories",
    brand: "Logitech",
    price: 15,
    stock: 10,
    rating: 4.5,
    reviews: 10,
    image: "/images/catalog/mouse.png",
    shortDescription: "",
    description: "2.4GHz wireless optical mouse",
    specs: [{ label: "Connectivity", value: "2.4GHz Wireless" }],
    tags: ["mouse", "wireless", "logitech"],
    ...over
  };
}

const JPEG: number[] = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
const PNG: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const WEBP: number[] = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];

describe("image validation", () => {
  it("detects JPG, PNG and WEBP magic bytes", () => {
    expect(detectImageMime(new Uint8Array(JPEG))).toBe("image/jpeg");
    expect(detectImageMime(new Uint8Array(PNG))).toBe("image/png");
    expect(detectImageMime(new Uint8Array(WEBP))).toBe("image/webp");
    expect(detectImageMime(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]))).toBeNull();
  });

  it("accepts a valid JPG and rejects an oversized file", () => {
    const ok = validateImage(new Uint8Array(JPEG), "image/jpeg");
    expect(ok.ok).toBe(true);
    expect(ok.ext).toBe("jpg");
    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    expect(validateImage(big).ok).toBe(false);
  });

  it("rejects mismatched declared MIME and empty files", () => {
    expect(validateImage(new Uint8Array(PNG), "image/jpeg").ok).toBe(false);
    expect(validateImage(new Uint8Array(0)).ok).toBe(false);
  });
});

describe("hashing", () => {
  it("produces a stable sha256 hex digest", () => {
    const a = sha256(new Uint8Array([1, 2, 3]));
    const b = sha256(new Uint8Array([1, 2, 3]));
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("tokenize", () => {
  it("lowercases, strips punctuation and stopwords", () => {
    expect(tokenize("Logitech Wireless Mouse M185!")).toEqual(["logitech", "wireless", "mouse", "m185"]);
    expect(tokenize("the new a an mouse")).toEqual(["mouse"]);
  });
});

describe("matching engine", () => {
  it("finds the exact product for a matching analysis", () => {
    const analysis = makeAnalysis({ brand: "Logitech", model: "M185", product_type: "wireless mouse", color: "black" });
    const product = makeProduct();
    const scored = scoreCandidate(analysis, product);
    expect(scored.product.id).toBe("prd_1");
    expect(scored.score).toBeGreaterThanOrEqual(70);
  });

  it("scores an unrelated product low", () => {
    const analysis = makeAnalysis({ brand: "Samsung", model: "Galaxy A15", product_type: "smartphone", color: "blue" });
    const product = makeProduct();
    const scored = scoreCandidate(analysis, product);
    expect(scored.score).toBeLessThan(50);
  });

  it("picks the best of several candidates", () => {
    const analysis = makeAnalysis({ brand: "Logitech", model: "M185", product_type: "wireless mouse" });
    const other = makeProduct({ id: "prd_2", title: "Samsung Monitor 27\"", brand: "Samsung", slug: "samsung-monitor", category: "Monitors" });
    const best = findBestMatch(analysis, [other, makeProduct()]);
    expect(best?.product.id).toBe("prd_1");
  });

  it("returns null when nothing matches", () => {
    const analysis = makeAnalysis({ brand: "FizboCorp", product_type: "warp drive", visible_text: ["xyzzy"] });
    const best = findBestMatch(analysis, [makeProduct()]);
    expect(best).toBeNull();
  });
});

describe("confidence levels", () => {
  it("maps scores to matched / review / unmatched", () => {
    expect(confidenceLevel(95, DEFAULT_AUTO_MATCH_THRESHOLD, DEFAULT_REVIEW_THRESHOLD)).toBe("matched");
    expect(confidenceLevel(90, DEFAULT_AUTO_MATCH_THRESHOLD, DEFAULT_REVIEW_THRESHOLD)).toBe("matched");
    expect(confidenceLevel(70, DEFAULT_AUTO_MATCH_THRESHOLD, DEFAULT_REVIEW_THRESHOLD)).toBe("review");
    expect(confidenceLevel(40, DEFAULT_AUTO_MATCH_THRESHOLD, DEFAULT_REVIEW_THRESHOLD)).toBe("unmatched");
  });
});

describe("naming & alt text", () => {
  it("builds a clean slugified filename", () => {
    const analysis = makeAnalysis({ brand: "Logitech", model: "M185", color: "black" });
    const name = generateFilename(analysis, "webp");
    expect(name).toBe("logitech-m185-black.webp");
    expect(generateFilename(analysis, "jpg", 1)).toContain("-1.jpg");
  });

  it("generates descriptive alt text", () => {
    const analysis = makeAnalysis({ brand: "Logitech", model: "M185", product_type: "wireless mouse", color: "black" });
    expect(generateAltText(analysis)).toContain("logitech");
    expect(generateAltText(undefined, "Deluxe Pot Set")).toBe("deluxe pot set");
  });

  it("sanitizes unsafe slug input", () => {
    expect(slugifyName("  Foo/..\\BAR!!  ")).toBe("foo-bar");
  });
});

describe("ai vision fallback for junk filenames", () => {
  const catalog: Product[] = [
    makeProduct(),
    makeProduct({ id: "prd_kettle", slug: "electric-kettle", title: "Electric Kettle 1.8L", brand: "Philips", category: "Kitchen Utensils" }),
    makeProduct({ id: "prd_bag", slug: "ladies-handbag", title: "Ladies Handbag", brand: "AYINDEDUNNY ENTERPRISE", category: "Bags and Sundries" })
  ];
  const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";

  beforeEach(() => {
    vi.mocked(analyzeImage).mockReset();
  });

  it("reports 'attached' for a confident vision match", async () => {
    vi.mocked(analyzeImage).mockResolvedValue({
      product_type: "electric kettle",
      brand: "philips",
      model: "1.8l",
      color: "silver",
      visible_text: [],
      category: "kitchen utensil",
      variant: null,
      confidence: 92
    });
    const result = await matchByVision(dataUrl, catalog);
    expect(result.status).toBe("attached");
    expect(result.best?.product.id).toBe("prd_kettle");
    expect(result.best!.score).toBeGreaterThanOrEqual(45);
    expect(result.best!.score - (result.runnerUp?.score || 0)).toBeGreaterThanOrEqual(20);
  });

  it("reports 'review' for a marginal vision match", async () => {
    vi.mocked(analyzeImage).mockResolvedValue({
      product_type: "generic pot",
      brand: null,
      model: null,
      color: "silver",
      visible_text: [],
      category: "household",
      variant: null,
      confidence: 40
    });
    const result = await matchByVision(dataUrl, catalog);
    expect(["review", "unmatched"]).toContain(result.status);
  });
});

describe("filename bulk matching (temporary importer)", () => {
  const catalog: Product[] = [
    makeProduct(),
    makeProduct({ id: "prd_kettle", slug: "electric-kettle", title: "Electric Kettle 1.8L", brand: "Philips", category: "Kitchen Utensils" }),
    makeProduct({ id: "prd_bag", slug: "ladies-handbag", title: "Ladies Handbag", brand: "AYINDEDUNNY ENTERPRISE", category: "Bags and Sundries" })
  ];

  it("ignores junk filenames like IMG-2024... and finds nothing", () => {
    expect(matchByFilename("IMG-20240701-WA0048.jpg", catalog)).toBeNull();
  });

  it("matches descriptive filenames regardless of order and separators", () => {
    const m = matchByFilename("Philips-Electric-Kettle-1.8L.png", catalog);
    expect(m?.product.id).toBe("prd_kettle");
    expect(m!.score).toBeGreaterThanOrEqual(80);
  });

  it("returns null for an unrelated filename", () => {
    expect(matchByFilename("random-blob.jpeg", catalog)).toBeNull();
  });
});
