import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from "docx";
import fs from "fs";

const outFile = "C:\\Users\\user\\Desktop\\2in1 Ecommerce\\deliverables\\Gadget-Hub-Status-Report.docx";

const bullet = (text, bold = false) =>
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, bold, size: 22 })],
  });

const H1 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 120 }, children: [new TextRun({ text, bold: true, size: 30, color: "1D4ED8" })] });

const H2 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 }, children: [new TextRun({ text, bold: true, size: 26, color: "0F172A" })] });

const para = (text, size = 22, spacing = 80, italic = false) =>
  new Paragraph({ spacing: { after: spacing }, children: [new TextRun({ text, size, italic })] });

const pages = [
  {
    name: "Homepage (/)",
    file: "01-home.png",
    desc: "Storefront landing with live in-stock motion ticker, animated hero, category sidebar, search, perks strip, category showcase and featured products grid.",
    features: [
      "Animated \u201cHot Right Now \u00b7 In Stock\u201d marquee of ready-to-ship products (pauses on hover)",
      "Hero banner, quick filters, category carousel and featured gadgets",
      "Currency selector (NGN/USD/GBP/EUR) and dark/light theme toggle in top bar",
      "Offline-first PWA shell with product data loaded from local IndexedDB",
    ],
  },
  {
    name: "Shop / Catalogue (/shop)",
    file: "02-shop.png",
    desc: "Full product grid with category sidebar, search and quick-filter tabs.",
    features: [
      "Filter by category, search across 31 products (electronics + mini-store)",
      "Product cards with quick view, wishlist, compare and add-to-cart",
      "Live stock badges and currency-aware pricing",
    ],
  },
  {
    name: "School Mini-Store (/school)",
    file: "03-school-mini-store.png",
    desc: "Dedicated boarding-school store with grade-based ordering windows (JSS1/JSS2/JSS3).",
    features: [
      "Ordering windows: Monday (JSS1), Tuesday (JSS2), Wednesday (JSS3)",
      "12 stationery, textbooks, uniform, bags, snacks and grocery items",
      "Manager-only controls with restricted login for three authorized managers",
    ],
  },
  {
    name: "Product Detail (/product/[slug])",
    file: "04-product-detail.png",
    desc: "Individual product page with full specs, description, reviews and related items.",
    features: [
      "Image, price (currency-aware), old-price discount, stock status",
      "Specifications table, description, review block, related products",
      "Wishlist / compare / add-to-cart with quick-add",
    ],
  },
  {
    name: "Checkout (/checkout)",
    file: "05-checkout.png",
    desc: "Multi-field secure checkout with order summary and offline-friendly order placement.",
    features: [
      "Delivery calculation (free over threshold, currency-aware)",
      "Order placement stored locally then synced to cloud",
      "Order success screen with confirmation number",
    ],
  },
  {
    name: "Account (/account)",
    file: "06-account.png",
    desc: "Login / registration and customer order history.",
    features: [
      "Auth with demo admin, manager and customer accounts",
      "Order history with status and line-item totals",
      "Role-aware links (Admin Portal, Mini-Store)",
    ],
  },
  {
    name: "Wishlist (/wishlist)",
    file: "07-wishlist.png",
    desc: "Saved products view with empty-state guidance.",
    features: ["Persistence via IndexedDB", "Full product cards with quick actions"],
  },
  {
    name: "Compare (/compare)",
    file: "08-compare.png",
    desc: "Side-by-side product comparison table.",
    features: ["Auto-generated spec matrix across products", "In-table add-to-cart"],
  },
  {
    name: "Contact (/contact)",
    file: "09-contact.png",
    desc: "Contact form with subject routing (orders, bulk, school mini-store, returns).",
    features: ["Form validation", "Open 24/7 contact details"],
  },
  {
    name: "Admin Login (/admin)",
    file: "10-admin-login.png",
    desc: "Restricted administrator authentication screen.",
    features: ["Role-protected access", "Demo credentials shown for evaluation"],
  },
  {
    name: "Admin Dashboard (/admin)",
    file: "11-admin-dashboard.png",
    desc: "Full administration back-office (post-login).",
    features: [
      "Dashboard: revenue, units sold, stock, restock alerts, recent orders",
      "Products management (add/edit/delete, image upload, offline sync)",
      "Mini-Store catalog tab with school-supplies / groceries scoping",
      "Orders: status updates, cloud pull, CSV export",
      "Reports: Excel / PDF / Word export, granularity and range filters",
      "Multi-channel notifications (Telegram, WhatsApp, Email, SMS)",
    ],
  },
];

const headerRow = (cells) =>
  new TableRow({
    children: cells.map(
      (c) =>
        new TableCell({
          shading: { fill: "1D4ED8" },
          children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, color: "FFFFFF", size: 20 })] })],
        })
    ),
  });

const cell = (text) =>
  new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 19 })] })],
  });

const statusRows = pages.map((p) =>
  new TableRow({
    children: [cell(p.name), cell("100%"), cell("Live on http://localhost:3100"), cell(p.file)],
  })
);

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "GADGET HUB", bold: true, size: 44, color: "1D4ED8" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "E-Commerce PWA \u2014 Project Status Report", bold: true, size: 28 })] },
        ),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Client sample screenshots \u00b7 All interfaces built so far", italics: true, size: 22, color: "64748B" })],
        }),
        para("This document summarises every interface built for the Gadget Hub e-commerce platform. A matching screenshot for each interface is included in the accompanying screenshots folder. All pages are functional, responsive and dark-mode ready, and run against the live demo at http://localhost:3100.", 22, 120),

        H1("1. Built Interfaces (Screenshots)"),
        para("The table below maps each built interface to its screenshot file for quick client review.", 20, 120),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow(["Interface", "Build", "Status", "Screenshot"]), ...statusRows],
        }),

        H1("2. Detailed Breakdown"),
        ...pages.map((p) => [
          H2(`${p.name} \u2014 ${p.file}`),
          para(p.desc, 22, 80, true),
          ...p.features.map((f) => bullet(f)),
        ]).flat(),

        H1("3. Core Capabilities Delivered"),
        bullet("Offline-first architecture \u2014 all product, cart, wishlist, order and admin data persists in local IndexedDB and syncs to the cloud when online"),
        bullet("Multi-currency pricing (NGN default; USD / GBP / EUR) with live conversion throughout"),
        bullet("Dark / light theme toggle with full styling in both modes"),
        bullet("Authentication and roles \u2014 admin, three mini-store managers, and customers"),
        bullet("Mini-store for schools with grade-based ordering windows and manager controls"),
        bullet("Admin back-office \u2014 dashboard, product and mini-store catalog management, orders, sales reports (Excel/PDF/Word), and multi-channel notifications"),
        bullet("PWA-ready responsive layout across mobile, tablet and desktop"),

        H1("4. Tech Stack"),
        para("Next.js 15 (App Router) \u00b7 React 19 \u00b7 TypeScript \u00b7 Tailwind CSS \u00b7 Dexie (IndexedDB) \u00b7 Node.js API \u00b7 lucide-react icons", 22, 80),

        new Paragraph({
          spacing: { before: 300 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Generated for client review \u00b7 Gadget Hub Demo", italics: true, size: 20, color: "94A3B8" })],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outFile, buf);
  console.log("DOCX written: " + outFile + " (" + buf.length + " bytes)");
});
