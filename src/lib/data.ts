import type { Product } from "./types";

const img = (slug: string) => `/images/products/${slug}.svg`;

const now = "2026-08-01T00:00:00.000Z";

export const SEED_PRODUCTS: Product[] = [
  {
    id: "p001",
    slug: "ultrabook-x15",
    title: "UltraBook X15 - 15.6\" Business Laptop",
    category: "Laptops and Notebooks",
    brand: "Aurora Tech",
    price: 1199.0,
    oldPrice: 1399.0,
    stock: 24,
    rating: 4.8,
    reviews: 214,
    image: img("ultrabook-x15"),
    shortDescription:
      "Slim aluminium business laptop powered by a 13th-gen Core i7 with a vivid 15.6\" FHD display.",
    description:
      "The UltraBook X15 is engineered for productivity on the move. A precision-milled aluminium chassis, 16GB of fast DDR5 RAM and a 512GB NVMe SSD deliver effortless multitasking, while the 15.6\" FHD anti-glare panel keeps you comfortable through long workdays. With Thunderbolt 4, Wi-Fi 6E and a 16-hour battery, this is the definitive office companion.",
    specs: [
      { label: "Processor", value: "Intel Core i7-1365U" },
      { label: "Memory", value: "16GB DDR5" },
      { label: "Storage", value: "512GB NVMe SSD" },
      { label: "Display", value: "15.6\" FHD IPS (1920x1080)" },
      { label: "Battery", value: "Up to 16 hours" },
      { label: "Weight", value: "1.39 kg" }
    ],
    badge: "16GB RAM / 512GB SSD",
    featured: true,
    group: "Laptops",
    tags: ["laptop", "business", "ssd", "i7", "best-seller"]
  },
  {
    id: "p002",
    slug: "zenbook-pro-14",
    title: "ZenBook Pro 14 OLED Creator Laptop",
    category: "Laptops and Notebooks",
    brand: "Nimbus",
    price: 1649.0,
    stock: 12,
    rating: 4.9,
    reviews: 156,
    image: img("zenbook-pro-14"),
    shortDescription: "4K OLED creator laptop with discrete graphics and a precision touchpad.",
    description:
      "Created for designers and editors, the ZenBook Pro 14 pairs a stunning 2.8K OLED touch display with a high-performance RTX graphics card and 32GB of RAM. Colour-accurate, feather-light and relentless — the canvas for your best work.",
    specs: [
      { label: "Processor", value: "Intel Core i9-13905H" },
      { label: "Memory", value: "32GB LPDDR5" },
      { label: "Storage", value: "1TB PCIe 4.0 SSD" },
      { label: "Display", value: "14.5\" 2.8K OLED Touch" },
      { label: "Graphics", value: "NVIDIA RTX 4060" }
    ],
    badge: "32GB RAM / 1TB SSD",
    featured: true,
    group: "Laptops",
    tags: ["laptop", "creator", "oled", "gpu"]
  },
  {
    id: "p003",
    slug: "thinkbook-e14",
    title: "ThinkBook E14 Business Ultrabook",
    category: "Laptops and Notebooks",
    brand: "Vector Systems",
    price: 899.0,
    stock: 30,
    rating: 4.6,
    reviews: 98,
    image: img("thinkbook-e14"),
    shortDescription: "Reliable everyday business ultrabook with all-day battery and TPM security.",
    description:
      "A no-compromise everyday workhorse. The ThinkBook E14 combines a fast Ryzen 5 processor, a bright 14\" FHD display and enterprise-grade security features in a portable 1.4kg chassis.",
    specs: [
      { label: "Processor", value: "AMD Ryzen 5 7530U" },
      { label: "Memory", value: "16GB DDR4" },
      { label: "Storage", value: "512GB SSD" },
      { label: "Display", value: "14\" FHD IPS" }
    ],
    featured: true,
    group: "Laptops",
    tags: ["laptop", "ryzen", "business", "value"]
  },
  {
    id: "p004",
    slug: "chromebook-flex",
    title: "Chromebook Flex 12 - Student Edition",
    category: "Laptops and Notebooks",
    brand: "Aurora Tech",
    price: 349.0,
    stock: 45,
    rating: 4.4,
    reviews: 187,
    image: img("chromebook-flex"),
    shortDescription: "Affordable 2-in-1 Chromebook with touchscreen - perfect for school.",
    description:
      "Built for the classroom. A durable, spill-resistant 2-in-1 with a responsive touchscreen, 10-hour battery and automatic updates — everything students need for notes, research and projects.",
    specs: [
      { label: "Processor", value: "Intel Celeron N5100" },
      { label: "Memory", value: "8GB LPDDR4" },
      { label: "Storage", value: "128GB eMMC" },
      { label: "Display", value: "12\" HD Touch" }
    ],
    featured: true,
    group: "Laptops",
    tags: ["laptop", "student", "chromebook", "school"]
  },
  {
    id: "p005",
    slug: "pulse-5g-smartphone",
    title: "Pulse 5G Smartphone - 256GB",
    category: "Smartphones and Accessories",
    brand: "Nova Mobile",
    price: 699.0,
    oldPrice: 799.0,
    stock: 18,
    rating: 4.7,
    reviews: 342,
    image: img("pulse-5g-smartphone"),
    shortDescription: "Flagship 5G phone with a 108MP camera, 120Hz AMOLED and 256GB storage.",
    description:
      "The Pulse 5G redefines value. A 6.7\" 120Hz AMOLED display, 108MP triple camera and all-day 5000mAh battery deliver flagship experiences at a smart price. Wireless charging and IP68 water resistance included.",
    specs: [
      { label: "Display", value: "6.7\" AMOLED 120Hz" },
      { label: "Camera", value: "108MP Triple" },
      { label: "Battery", value: "5000mAh / 67W" },
      { label: "Storage", value: "256GB" }
    ],
    badge: "5G READY",
    featured: true,
    group: "Smart Accessories",
    tags: ["smartphone", "5g", "android"]
  },
  {
    id: "p006",
    slug: "airbuds-pro-wireless",
    title: "AirBuds Pro Wireless Earbuds",
    category: "Audio and Headphones",
    brand: "SoundWave",
    price: 129.0,
    stock: 60,
    rating: 4.5,
    reviews: 512,
    image: img("airbuds-pro-wireless"),
    shortDescription: "Active noise-cancelling wireless earbuds with 30-hour battery case.",
    description:
      "Immerse yourself. Adaptive active noise cancellation, crystal-clear call mics and a 30-hour total battery in a pocketable USB-C case. Bluetooth 5.3 with multipoint pairing.",
    specs: [
      { label: "Bluetooth", value: "5.3 / Multipoint" },
      { label: "ANC", value: "Adaptive" },
      { label: "Battery", value: "30h (with case)" },
      { label: "Rating", value: "IPX5" }
    ],
    badge: "Wireless / Bluetooth",
    featured: true,
    group: "Smart Accessories",
    tags: ["audio", "earbuds", "wireless", "anc"]
  },
  {
    id: "p007",
    slug: "officejet-pro-print",
    title: "OfficeJet Pro 4-in-1 Printer",
    category: "Printers and Scanners",
    brand: "PrintCore",
    price: 289.0,
    oldPrice: 339.0,
    stock: 8,
    rating: 4.6,
    reviews: 231,
    image: img("officejet-pro-print"),
    shortDescription: "Print, copy, scan and fax in wireless colour - built for busy offices.",
    description:
      "A compact 4-in-1 workhorse delivering fast colour printing, automatic two-sided printing, a 35-page ADF and reliable wireless connectivity. Low cost-per-page ink system keeps the office running.",
    specs: [
      { label: "Functions", value: "Print / Copy / Scan / Fax" },
      { label: "Speed", value: "22 ppm (colour)" },
      { label: "Connectivity", value: "Wi-Fi, Ethernet, USB" },
      { label: "Duplex", value: "Automatic" }
    ],
    badge: "LOW STOCK",
    featured: true,
    group: "Printers",
    tags: ["printer", "office", "wifi", "4in1"]
  },
  {
    id: "p008",
    slug: "laser-jet-mono",
    title: "LaserJet Mono Laser Printer",
    category: "Printers and Scanners",
    brand: "PrintCore",
    price: 159.0,
    stock: 22,
    rating: 4.5,
    reviews: 174,
    image: img("laser-jet-mono"),
    shortDescription: "Fast, dependable monochrome laser printing with low running costs.",
    description:
      "Crisp black-and-white documents at 30 pages per minute. Compact, network-ready and with a 250-sheet tray, it is the economical choice for busy school and office environments.",
    specs: [
      { label: "Speed", value: "30 ppm" },
      { label: "Resolution", value: "1200 x 1200 dpi" },
      { label: "Connectivity", value: "Wi-Fi / USB" },
      { label: "Duty Cycle", value: "15,000 pages/mo" }
    ],
    featured: true,
    group: "Printers",
    tags: ["printer", "laser", "mono"]
  },
  {
    id: "p009",
    slug: "ink-tank-scanner",
    title: "EcoTank All-in-One Printer and Scanner",
    category: "Printers and Scanners",
    brand: "EcoPrint",
    price: 329.0,
    stock: 14,
    rating: 4.7,
    reviews: 203,
    image: img("ink-tank-scanner"),
    shortDescription: "Refillable ink-tank printer with ultra-low cost per page and scanner.",
    description:
      "Say goodbye to cartridge costs. The EcoTank ships with up to 2 years of ink in the box and prints thousands of pages before needing a refill. Includes scanner, copier and Wi-Fi Direct.",
    specs: [
      { label: "Ink System", value: "Refillable tank" },
      { label: "Pages Included", value: "~6,000 black / 6,000 colour" },
      { label: "Functions", value: "Print / Scan / Copy" },
      { label: "Connectivity", value: "Wi-Fi, Wi-Fi Direct, USB" }
    ],
    featured: true,
    group: "Printers",
    tags: ["printer", "inktank", "scanner", "eco"]
  },
  {
    id: "p010",
    slug: "ergonomic-office-chair",
    title: "Ergonomic Mesh Office Chair",
    category: "Office Ergonomics",
    brand: "ComfortCore",
    price: 249.0,
    stock: 16,
    rating: 4.8,
    reviews: 121,
    image: img("ergonomic-office-chair"),
    shortDescription: "Breathable mesh chair with adjustable lumbar support and armrests.",
    description:
      "Engineered for 8-hour comfort. Breathable mesh back, adjustable lumbar support, tilt tension and a weight-rated gas lift keep you supported and productive all day.",
    specs: [
      { label: "Lumbar", value: "Adjustable" },
      { label: "Armrests", value: "3D Adjustable" },
      { label: "Weight Capacity", value: "136 kg" },
      { label: "Recline", value: "135° Tilt" }
    ],
    featured: true,
    group: "Office and Audio",
    tags: ["office", "chair", "ergonomic", "comfort"]
  },
  {
    id: "p011",
    slug: "standing-desk-dual",
    title: "Dual-Motor Standing Desk 120cm",
    category: "Office Ergonomics",
    brand: "ComfortCore",
    price: 399.0,
    oldPrice: 469.0,
    stock: 9,
    rating: 4.6,
    reviews: 88,
    image: img("standing-desk-dual"),
    shortDescription: "Height-adjustable electric desk with memory presets and cable tray.",
    description:
      "Move between sit and stand in seconds with whisper-quiet dual motors and four memory presets. A spacious 120x60cm desktop and integrated cable management keep your setup tidy.",
    specs: [
      { label: "Height Range", value: "60 - 125 cm" },
      { label: "Motors", value: "Dual, 4 memory presets" },
      { label: "Load Capacity", value: "100 kg" },
      { label: "Tabletop", value: "120 x 60 cm" }
    ],
    badge: "RESTOCK SOON",
    featured: true,
    group: "Office and Audio",
    tags: ["desk", "standing", "office", "ergonomic"]
  },
  {
    id: "p012",
    slug: "ergonomic-keyboard",
    title: "Ergonomic Split Mechanical Keyboard",
    category: "Office Ergonomics",
    brand: "KeyMate",
    price: 119.0,
    stock: 34,
    rating: 4.5,
    reviews: 96,
    image: img("ergonomic-keyboard"),
    shortDescription: "Split ergonomic keyboard with tactile mechanical switches.",
    description:
      "Relieve wrist strain with a split, tented layout and quiet tactile switches. Fully programmable keys, hot-swappable switches and a detachable palm rest included.",
    specs: [
      { label: "Layout", value: "Split Ergonomic" },
      { label: "Switches", value: "Tactile, hot-swap" },
      { label: "Connection", value: "USB-C wired" },
      { label: "Palm Rest", value: "Detachable" }
    ],
    featured: true,
    group: "Office and Audio",
    tags: ["keyboard", "ergonomic", "mechanical"]
  },
  {
    id: "p013",
    slug: "ultrawide-monitor-34",
    title: "UltraWide 34\" Curved Monitor",
    category: "Monitors and Displays",
    brand: "Vista Displays",
    price: 549.0,
    oldPrice: 649.0,
    stock: 11,
    rating: 4.7,
    reviews: 143,
    image: img("ultrawide-monitor-34"),
    shortDescription: "Immersive 34\" WQHD curved monitor with USB-C power delivery.",
    description:
      "A single ultrawide screen that replaces a dual-monitor setup. The 34\" WQHD curved panel delivers stunning detail, while 90W USB-C charges your laptop and connects peripherals with one cable.",
    specs: [
      { label: "Panel", value: "34\" VA Curved WQHD" },
      { label: "Refresh", value: "100Hz" },
      { label: "USB-C", value: "90W Power Delivery" },
      { label: "Colour", value: "100% sRGB" }
    ],
    badge: "USB-C 90W",
    featured: true,
    group: "Office and Audio",
    tags: ["monitor", "ultrawide", "usb-c", "curved"]
  },
  {
    id: "p014",
    slug: "4k-monitor-27",
    title: "27\" 4K UHD Studio Monitor",
    category: "Monitors and Displays",
    brand: "Vista Displays",
    price: 429.0,
    stock: 17,
    rating: 4.6,
    reviews: 78,
    image: img("4k-monitor-27"),
    shortDescription: "4K IPS monitor with factory-calibrated colour for creative work.",
    description:
      "Colour-critical accuracy straight out of the box. A 27\" 4K IPS panel with 98% DCI-P3, USB-C docking and height-adjustable stand makes it the perfect studio companion.",
    specs: [
      { label: "Panel", value: "27\" 4K UHD IPS" },
      { label: "Colour", value: "98% DCI-P3" },
      { label: "USB-C", value: "65W PD / DP alt" },
      { label: "Stand", value: "Height adjustable" }
    ],
    featured: true,
    group: "Office and Audio",
    tags: ["monitor", "4k", "ips", "creative"]
  },
  {
    id: "p015",
    slug: "mesh-wifi-6-router",
    title: "Mesh Wi-Fi 6 Router (2-Pack)",
    category: "Networking and Storage",
    brand: "LinkPort",
    price: 189.0,
    stock: 26,
    rating: 4.6,
    reviews: 134,
    image: img("mesh-wifi-6-router"),
    shortDescription: "Whole-home Wi-Fi 6 mesh system covering up to 4,000 sq ft.",
    description:
      "Dead zones, eliminated. A two-piece Wi-Fi 6 mesh system blankets up to 4,000 sq ft with fast, reliable coverage, AI-powered optimisation and simple app setup.",
    specs: [
      { label: "Standard", value: "Wi-Fi 6 (AX3000)" },
      { label: "Coverage", value: "Up to 4,000 sq ft" },
      { label: "Ports", value: "2x Gigabit LAN/WAN" },
      { label: "Clients", value: "100+ devices" }
    ],
    featured: true,
    group: "Smart Accessories",
    tags: ["networking", "wifi6", "mesh", "router"]
  },
  {
    id: "p016",
    slug: "ssd-2tb-nvme",
    title: "2TB NVMe SSD Gen4",
    category: "Networking and Storage",
    brand: "DataCore",
    price: 149.0,
    stock: 38,
    rating: 4.8,
    reviews: 267,
    image: img("ssd-2tb-nvme"),
    shortDescription: "Blazing-fast 7,000 MB/s NVMe Gen4 SSD with heatsink.",
    description:
      "Upgrade to instant. Sequential reads up to 7,000 MB/s, DRAM cache and a slim heatsink keep your system flying. Backed by a 5-year warranty.",
    specs: [
      { label: "Interface", value: "PCIe Gen4 x4 NVMe" },
      { label: "Read Speed", value: "7,000 MB/s" },
      { label: "Write Speed", value: "6,500 MB/s" },
      { label: "Warranty", value: "5 years" }
    ],
    featured: true,
    group: "Smart Accessories",
    tags: ["storage", "ssd", "nvme", "upgrade"]
  },
  {
    id: "p017",
    slug: "ups-1200va",
    title: "1200VA Line-Interactive UPS",
    category: "Power and UPS",
    brand: "PowerSentry",
    price: 129.0,
    stock: 20,
    rating: 4.5,
    reviews: 190,
    image: img("ups-1200va"),
    shortDescription: "Uninterruptible power with surge protection for home offices.",
    description:
      "Keep working through outages. A 1200VA line-interactive UPS delivers clean, protected power and minutes of battery runtime for your PC, router and monitor.",
    specs: [
      { label: "Capacity", value: "1200VA / 720W" },
      { label: "Output", value: "Pure sine wave" },
      { label: "Outlets", value: "6 x surge + battery" },
      { label: "Runtime", value: "~8 min (PC load)" }
    ],
    featured: true,
    group: "Power Solutions",
    tags: ["power", "ups", "backup", "surge"]
  },
  {
    id: "p018",
    slug: "20000mah-powerbank",
    title: "20,000mAh 65W Power Bank",
    category: "Power and UPS",
    brand: "PowerSentry",
    price: 79.0,
    stock: 52,
    rating: 4.7,
    reviews: 421,
    image: img("20000mah-powerbank"),
    shortDescription: "Fast 65W dual-port power bank that charges laptops and phones.",
    description:
      "Charge everything, anywhere. A 20,000mAh battery with 65W USB-C Power Delivery fast-charges laptops, tablets and phones, with an LED display showing exact remaining capacity.",
    specs: [
      { label: "Capacity", value: "20,000mAh" },
      { label: "Output", value: "65W USB-C PD" },
      { label: "Ports", value: "1x USB-C, 2x USB-A" },
      { label: "Display", value: "LED % battery" }
    ],
    badge: "BEST SELLER",
    featured: true,
    group: "Power Solutions",
    tags: ["power", "powerbank", "fast-charge", "laptop"]
  },
  {
    id: "p019",
    slug: "smart-tower-surge-protector",
    title: "Smart Tower Surge Protector",
    category: "Power and UPS",
    brand: "PowerSentry",
    price: 49.0,
    stock: 41,
    rating: 4.4,
    reviews: 112,
    image: img("smart-tower-surge-protector"),
    shortDescription: "12-outlet tower surge protector with USB and type-C charging.",
    description:
      "A 12-outlet power tower with 4,500 joule surge protection and 2 USB + 1 USB-C ports for fast device charging. Rotating head fits anywhere.",
    specs: [
      { label: "Outlets", value: "12 (rotating)" },
      { label: "Surge", value: "4,500 joules" },
      { label: "USB", value: "2x USB-A + 1x USB-C" },
      { label: "Cable", value: "1.8 m" }
    ],
    featured: true,
    group: "Power Solutions",
    tags: ["power", "surge", "usb", "tower"]
  },
  {
    id: "s001",
    slug: "exercise-books-pack-10",
    title: "A4 Exercise Books (Pack of 10)",
    category: "Stationery",
    brand: "Campus Essentials",
    price: 6.5,
    stock: 120,
    rating: 4.6,
    reviews: 88,
    image: img("exercise-books-pack-10"),
    shortDescription: "80-page A4 exercise books in assorted cover colours - a term's worth of notes.",
    description:
      "Ten 80-page A4 exercise books with strong covers and premium paper that handles pen, pencil and highlighter without bleed-through. A staple for every student's bag.",
    specs: [
      { label: "Pages", value: "80 per book" },
      { label: "Size", value: "A4 (210 x 297 mm)" },
      { label: "Pack", value: "10 books" },
      { label: "Paper", value: "70 gsm, bleed-resistant" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["school", "stationery", "books", "mini-store"]
  },
  {
    id: "s002",
    slug: "geometry-set-compass",
    title: "Geometry Set with Compass",
    category: "Stationery",
    brand: "Campus Essentials",
    price: 4.2,
    stock: 95,
    rating: 4.4,
    reviews: 61,
    image: img("geometry-set-compass"),
    shortDescription: "Full geometry set including compass, protractor and set squares.",
    description:
      "A complete geometry set with a spring compass, 15cm ruler, protractor, two set squares and a safety-clip pencil. All neatly housed in a protective case.",
    specs: [
      { label: "Pieces", value: "9 pieces" },
      { label: "Compass", value: "Spring-loaded, pencil grip" },
      { label: "Case", value: "Clear protective case" },
      { label: "Includes", value: "Ruler, protractor, set squares" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["school", "stationery", "maths", "mini-store"]
  },
  {
    id: "s003",
    slug: "school-backpack-45l",
    title: "School Backpack 45L",
    category: "School Bags",
    brand: "Campus Essentials",
    price: 32.0,
    stock: 42,
    rating: 4.7,
    reviews: 73,
    image: img("school-backpack-45l"),
    shortDescription: "Durable 45L school backpack with padded laptop sleeve and bottle pocket.",
    description:
      "Built for the school run. A water-resistant 45L backpack with a padded 15-inch laptop sleeve, multi-pocket organisation, and ergonomic shoulder straps for comfort all day.",
    specs: [
      { label: "Capacity", value: "45 litres" },
      { label: "Laptop Sleeve", value: "Fits up to 15\"" },
      { label: "Material", value: "Water-resistant polyester" },
      { label: "Extras", value: "Side bottle pockets" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["school", "backpack", "bag", "mini-store"]
  },
  {
    id: "s004",
    slug: "ballpoint-pens-pack-12",
    title: "Ballpoint Pens (Pack of 12)",
    category: "Stationery",
    brand: "Campus Essentials",
    price: 5.8,
    stock: 200,
    rating: 4.5,
    reviews: 102,
    image: img("ballpoint-pens-pack-12"),
    shortDescription: "Smooth 0.7mm blue ink pens that never skip - ideal for exams and homework.",
    description:
      "Twelve reliable 0.7mm blue-ink ballpoints with cushioned grips. Fast-drying ink means clean pages with no smudging, even for left-handed writers.",
    specs: [
      { label: "Ink", value: "Blue, quick-dry" },
      { label: "Tip", value: "0.7mm" },
      { label: "Pack", value: "12 pens" },
      { label: "Grip", value: "Cushioned" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["school", "stationery", "pens", "mini-store"]
  },
  {
    id: "s005",
    slug: "ruled-notebooks-pack-5",
    title: "Ruled Notebooks (Pack of 5)",
    category: "Stationery",
    brand: "Campus Essentials",
    price: 8.4,
    stock: 110,
    rating: 4.6,
    reviews: 57,
    image: img("ruled-notebooks-pack-5"),
    shortDescription: "Five 96-page ruled A5 notebooks - perfect for every subject.",
    description:
      "A set of five A5 ruled notebooks, each with 96 pages and a sturdy laminated cover. Colour-code your subjects with the five distinct cover colours.",
    specs: [
      { label: "Pages", value: "96 per notebook" },
      { label: "Size", value: "A5 (148 x 210 mm)" },
      { label: "Pack", value: "5 notebooks" },
      { label: "Rule", value: "Narrow ruled" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["school", "stationery", "notebooks", "mini-store"]
  },
  {
    id: "s006",
    slug: "pencil-eraser-set",
    title: "Pencil and Eraser Set",
    category: "Stationery",
    brand: "Campus Essentials",
    price: 3.6,
    stock: 150,
    rating: 4.3,
    reviews: 44,
    image: img("pencil-eraser-set"),
    shortDescription: "HB pencils with a clean-erase eraser and sharpener in one kit.",
    description:
      "A starter kit of six HB graphite pencils, two soft erasers and a dual-hole sharpener. Everything a student needs for drawing and rough work.",
    specs: [
      { label: "Pencils", value: "6 x HB" },
      { label: "Erasers", value: "2 x soft" },
      { label: "Sharpener", value: "Dual-hole, with case" },
      { label: "Suitable", value: "Ages 5+" }
    ],
    miniStore: true,
    supplyType: "supplies",
    tags: ["school", "stationery", "pencils", "mini-store"]
  },
  {
    id: "g001",
    slug: "rice-5kg-bag",
    title: "Rice 5kg Bag",
    category: "Pantry Staples",
    brand: "BoardHouse Pantry",
    price: 9.8,
    stock: 60,
    rating: 4.7,
    reviews: 134,
    image: img("rice-5kg-bag"),
    shortDescription: "Long-grain parboiled rice in a resealable 5kg bag.",
    description:
      "Premium long-grain parboiled rice that cooks fluffy every time. Packaged in a 5kg resealable bag to keep freshness locked in for the term.",
    specs: [
      { label: "Weight", value: "5 kg" },
      { label: "Type", value: "Long-grain parboiled" },
      { label: "Packaging", value: "Resealable" },
      { label: "Servings", value: "Approx. 40" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["food", "rice", "grocery", "mini-store"]
  },
  {
    id: "g002",
    slug: "instant-noodles-carton-12",
    title: "Instant Noodles (Carton of 12)",
    category: "Snacks and Drinks",
    brand: "BoardHouse Pantry",
    price: 14.5,
    stock: 55,
    rating: 4.4,
    reviews: 167,
    image: img("instant-noodles-carton-12"),
    shortDescription: "A carton of 12 cup noodles - a quick meal for busy study evenings.",
    description:
      "Twelve single-serve instant noodle cups with flavour sachets. Just add hot water for a quick, filling meal between classes.",
    specs: [
      { label: "Carton", value: "12 cups" },
      { label: "Serving", value: "Single serve" },
      { label: "Prep", value: "Hot water only" },
      { label: "Flavour", value: "Chicken / assorted" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["food", "noodles", "grocery", "mini-store"]
  },
  {
    id: "g003",
    slug: "vegetable-oil-1l",
    title: "Vegetable Oil 1L",
    category: "Pantry Staples",
    brand: "BoardHouse Pantry",
    price: 4.1,
    stock: 80,
    rating: 4.5,
    reviews: 96,
    image: img("vegetable-oil-1l"),
    shortDescription: "Pure vegetable oil in a 1-litre bottle for everyday cooking.",
    description:
      "Light, pure vegetable oil suitable for frying, baking and salads. A 1-litre bottle sized right for a term of home-style cooking.",
    specs: [
      { label: "Volume", value: "1 litre" },
      { label: "Type", value: "100% vegetable oil" },
      { label: "Use", value: "Cooking, frying, salads" },
      { label: "Packaging", value: "PET bottle" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["food", "oil", "grocery", "mini-store"]
  },
  {
    id: "g004",
    slug: "cereal-breakfast-box",
    title: "Cereal Breakfast Box",
    category: "Snacks and Drinks",
    brand: "BoardHouse Pantry",
    price: 6.9,
    stock: 45,
    rating: 4.6,
    reviews: 71,
    image: img("cereal-breakfast-box"),
    shortDescription: "Fortified whole-grain breakfast cereal in a family-size box.",
    description:
      "A family-size box of fortified whole-grain flakes with essential vitamins and minerals - a great start to school days.",
    specs: [
      { label: "Weight", value: "750 g" },
      { label: "Grains", value: "Whole-grain wheat" },
      { label: "Vitamins", value: "A, C, D, B12, iron" },
      { label: "Suitable", value: "Vegetarian" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["food", "cereal", "breakfast", "grocery"]
  },
  {
    id: "g005",
    slug: "milk-powder-400g",
    title: "Milk Powder 400g",
    category: "Pantry Staples",
    brand: "BoardHouse Pantry",
    price: 5.5,
    stock: 70,
    rating: 4.5,
    reviews: 89,
    image: img("milk-powder-400g"),
    shortDescription: "Full-cream milk powder in a 400g canister with easy re-seal lid.",
    description:
      "Full-cream milk powder that mixes instantly. The 400g canister with re-seal lid keeps milk fresh for cereal, tea and cooking.",
    specs: [
      { label: "Weight", value: "400 g" },
      { label: "Type", value: "Full-cream milk powder" },
      { label: "Makes", value: "About 4 L of milk" },
      { label: "Storage", value: "Re-sealable canister" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["food", "milk", "grocery", "mini-store"]
  },
  {
    id: "g006",
    slug: "drinking-water-pack-12",
    title: "Drinking Water (Pack of 12 x 75cl)",
    category: "Snacks and Drinks",
    brand: "BoardHouse Pantry",
    price: 4.4,
    stock: 90,
    rating: 4.6,
    reviews: 58,
    image: img("drinking-water-pack-12"),
    shortDescription: "Twelve 75cl bottles of purified drinking water for the dorm.",
    description:
      "A pack of twelve 75cl bottles of purified, mineralised drinking water - essential for hydration during the school week.",
    specs: [
      { label: "Pack", value: "12 bottles" },
      { label: "Volume", value: "75 cl each" },
      { label: "Type", value: "Purified mineral water" },
      { label: "Total", value: "9 litres" }
    ],
    miniStore: true,
    supplyType: "grocery",
    tags: ["food", "water", "grocery", "mini-store"]
  }
];

export const QUICK_FILTER_TABS = ["All", "Laptops", "Printers", "Smart Accessories", "Power Solutions"] as const;

export const CAROUSEL_CATEGORIES = [
  { name: "LAPTOPS", icon: "laptop", tagline: "Power for every workload", slug: "laptops" },
  { name: "PRINTERS AND TONERS", icon: "printer", tagline: "Crisp documents on demand", slug: "printers" },
  { name: "SMART DESK TECH", icon: "desk", tagline: "Elevate your workspace", slug: "desk" },
  { name: "POWER AND BACKUP", icon: "power", tagline: "Stay online through outages", slug: "power" }
] as const;
