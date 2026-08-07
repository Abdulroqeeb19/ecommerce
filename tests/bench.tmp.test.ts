import { it, expect, beforeAll } from "vitest";
import { validateCoupon } from "../src/lib/server/store";

beforeAll(() => {
  const t = Date.now();
  // warm up without asserting
  return validateCoupon("WELCOME10", 500).then(() => {
    console.log("first bootstrap ms:", Date.now() - t);
  });
});

it("bench", async () => {
  const t = Date.now();
  const r = await validateCoupon("WELCOME10", 500);
  console.log("validateCoupon ms:", Date.now() - t);
  expect(r!.discount).toBe(50);
});
