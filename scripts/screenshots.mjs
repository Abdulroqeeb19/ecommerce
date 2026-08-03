import puppeteer from "puppeteer-core";
import path from "path";

const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\user\\Desktop\\2in1 Ecommerce\\deliverables\\screenshots";
const BASE = "http://localhost:3100";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForText(page, text, timeout = 20000) {
  try {
    await page.waitForFunction(
      (t) => document.body && document.body.innerText.includes(t),
      { timeout, polling: 500 },
      text
    );
    return true;
  } catch {
    return false;
  }
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--disable-dev-shm-usage"]
});

async function shoot(name, url, { wait, text, extra } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log(`  [${name}] pageerror: ${e.message}`));
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
    if (text) await waitForText(page, text);
    if (wait) await sleep(wait);
    if (extra) await extra(page);
    const file = path.join(OUT, name + ".png");
    await page.screenshot({ path: file });
    console.log(`${name}: OK -> ${file}`);
  } catch (e) {
    console.log(`${name}: FAIL ${e.message}`);
  } finally {
    await page.close().catch(() => {});
  }
}

// Main storefront pages
await shoot("01-home", BASE + "/", { text: "Gadget Hub", wait: 4000 });
await shoot("02-shop", BASE + "/shop", { text: "shop", wait: 3500 });
await shoot("03-school-mini-store", BASE + "/school", { text: "Mini-Store", wait: 3500 });
await shoot("04-product-detail", BASE + "/product/ultrabook-x15", { text: "Add to Cart", wait: 2500 });
await shoot("05-checkout", BASE + "/checkout", { text: "Secure Checkout", wait: 2500 });
await shoot("06-account", BASE + "/account", { text: "My Account", wait: 2500 });
await shoot("07-wishlist", BASE + "/wishlist", { text: "My Wishlist", wait: 2500 });
await shoot("08-compare", BASE + "/compare", { text: "Compare Products", wait: 2500 });
await shoot("09-contact", BASE + "/contact", { text: "Contact", wait: 2500 });
await shoot("10-admin-login", BASE + "/admin", { text: "Admin Portal Login", wait: 2500 });

// Admin dashboard (after login)
await shoot("11-admin-dashboard", BASE + "/admin", {
  text: "Admin Portal",
  wait: 3000,
  extra: async (page) => {
    const ok = await page
      .waitForSelector('input[type="email"]', { timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (!ok) return;
    await page.type('input[type="email"]', "admin@gadgetstore.com", { delay: 15 });
    await page.type('input[type="password"]', "Admin@12345", { delay: 15 });
    await Promise.all([
      page.waitForFunction(() => document.body.innerText.includes("Dashboard"), { timeout: 20000, polling: 500 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);
    await sleep(2500);
  }
});

await browser.close();
console.log("done");
