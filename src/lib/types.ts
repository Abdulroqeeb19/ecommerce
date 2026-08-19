/**
 * Shop categories for the catalogue. These mirror SHOP_CATEGORIES in
 * catalogCategories.ts — the shop only carries Babies Wears, Electrical
 * Materials and Fittings and Home Essentials product lines.
 */
export const CATEGORIES = [
  "Babies Wears",
  "Electrical Materials and Fittings",
  "Home Essentials"
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface ProductSpec {
  label: string;
  value: string;
}

export interface CategoryCard {
  id: string;
  name: string;
  tagline: string;
  href: string;
  image: string;
  icon: string;
  sortOrder: number;
  active: boolean;
}

export interface CatalogItem {
  id: string;
  name: string;
  tag: string;
  category: string;
  image: string;
  price?: number;
  sortOrder: number;
  active: boolean;
}

export const CATEGORY_CARD_ICONS = [
  "laptop",
  "printer",
  "monitor",
  "battery",
  "utensils",
  "plug",
  "baby"
] as const;

export interface Product {
  id: string;
  slug: string;
  title: string;
  category: string;
  brand: string;
  price: number;
  oldPrice?: number;
  stock: number;
  rating: number;
  reviews: number;
  image: string;
  gallery?: string[];
  shortDescription: string;
  description: string;
  specs: ProductSpec[];
  badge?: string;
  featured?: boolean;
  group?: string;
  tags: string[];
  miniStore?: boolean;
  supplyType?: "supplies" | "grocery";
  /** School shop item "Type" column (e.g. "Fab", "Nice"). */
  type?: string;
  /** School shop item measurement/unit (e.g. "Roll", "Ctn", "Pack", "Sachet"). */
  measure?: string;
  /** Cost price – quantity bought. */
  costQty?: number;
  /** Cost price – unit price. */
  costUnitPrice?: number;
  /** Cost price – total amount (qty x unit). */
  costAmount?: number;
  /** Selling price – pieces per pack. */
  sellPcs?: number;
  /** Selling price – unit price charged to students. */
  sellUnitPrice?: number;
  /** Selling price – total amount (pcs x unit). */
  sellAmount?: number;
  /** Expected gain / profit = sellAmount - costAmount. */
  profit?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const SUPPLY_TYPES = ["supplies", "grocery"] as const;

export const MINI_STORE_CATEGORIES = [
  "Stationery",
  "Textbooks and Books",
  "Uniform and Footwear",
  "School Bags",
  "Snacks and Drinks",
  "Pantry Staples",
  "Personal Care"
] as const;

export const SUPPLY_TYPE_BY_CATEGORY: Record<string, (typeof SUPPLY_TYPES)[number]> = {
  Stationery: "supplies",
  "Textbooks and Books": "supplies",
  "Uniform and Footwear": "supplies",
  "School Bags": "supplies",
  "Snacks and Drinks": "grocery",
  "Pantry Staples": "grocery",
  "Personal Care": "grocery"
};

export interface CartItem {
  id: string;
  product: Product;
  qty: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  qty: number;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  school?: string;
  grade?: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  channel: "online" | "school";
  customer: CustomerInfo;
  source?: "web" | "mini-store";
  couponCode?: string;
  discount?: number;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  author: string;
  rating: number;
  title?: string;
  comment: string;
  verified: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  maxDiscount?: number;
  active: boolean;
  maxUses?: number;
  used: number;
  expiresAt?: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: "customer" | "admin" | "manager";
  grade?: string;
  school?: string;
  /** WhatsApp number (with country code) for order notifications to this manager. */
  whatsapp?: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id?: number;
  op: "create-product" | "update-product" | "create-order" | "update-stock" | "update-order" | "delete-product" | "update-customer";
  payload: Record<string, unknown>;
  synced: boolean;
  createdAt: string;
  error?: string;
  attempts?: number;
  conflicted?: boolean;
  lastAttemptAt?: string;
}

export interface SalesReportRow {
  period: string;
  label: string;
  orders: number;
  unitsSold: number;
  revenue: number;
}

export type ReportGranularity = "daily" | "monthly" | "quarterly" | "yearly";

export interface NotificationChannelStatus {
  telegram: boolean;
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
}

export interface NotificationSettings {
  telegramBotToken?: string;
  telegramChatId?: string;
  whatsappPhoneId?: string;
  whatsappToken?: string;
  whatsappTo?: string;
  sendgridApiKey?: string;
  notifyEmailTo?: string;
  notifyEmailFrom?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFrom?: string;
  twilioTo?: string;
}

export interface NotificationChannelConfig {
  key: keyof NotificationChannelStatus;
  name: string;
  fields: { key: keyof NotificationSettings; label: string; placeholder: string; secret?: boolean }[];
}

export const NOTIFICATION_CHANNELS: NotificationChannelConfig[] = [
  {
    key: "telegram",
    name: "Telegram Bot API",
    fields: [
      { key: "telegramBotToken", label: "Bot Token", placeholder: "123456:ABC-DEF...", secret: true },
      { key: "telegramChatId", label: "Chat ID", placeholder: "-1001234567890" }
    ]
  },
  {
    key: "whatsapp",
    name: "WhatsApp Business API",
    fields: [
      { key: "whatsappPhoneId", label: "Phone Number ID", placeholder: "1234567890" },
      { key: "whatsappToken", label: "Access Token", placeholder: "EAA...", secret: true },
      { key: "whatsappTo", label: "Recipient Number", placeholder: "+2348000000000" }
    ]
  },
  {
    key: "email",
    name: "Email (SendGrid)",
    fields: [
      { key: "sendgridApiKey", label: "SendGrid API Key", placeholder: "SG.xxx", secret: true },
      { key: "notifyEmailTo", label: "Recipient Email", placeholder: "orders@yourschool.com" },
      { key: "notifyEmailFrom", label: "From Email", placeholder: "orders@gadgetstore.com" }
    ]
  },
  {
    key: "sms",
    name: "SMS (Twilio)",
    fields: [
      { key: "twilioAccountSid", label: "Account SID", placeholder: "ACxxxxxxxx" },
      { key: "twilioAuthToken", label: "Auth Token", placeholder: "your_auth_token", secret: true },
      { key: "twilioFrom", label: "From Number", placeholder: "+1234567890" },
      { key: "twilioTo", label: "To Number", placeholder: "+2348000000000" }
    ]
  }
];

export type ImageImportItemStatus =
  | "uploaded"
  | "processing"
  | "matched"
  | "review"
  | "unmatched"
  | "failed"
  | "rejected"
  | "duplicate";

export type ImageImportJobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

/** Structured output of the AI Vision analysis (Phase 5). */
export interface AiImageAnalysis {
  product_type: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  visible_text: string[];
  category: string | null;
  variant: string | null;
  confidence: number;
}

export interface ImageImportJob {
  id: string;
  adminId: string;
  totalImages: number;
  processedImages: number;
  matchedImages: number;
  reviewImages: number;
  unmatchedImages: number;
  failedImages: number;
  status: ImageImportJobStatus;
  autoMatchThreshold: number;
  reviewThreshold: number;
  createdAt: string;
  completedAt?: string;
}

export interface ImageImportItem {
  id: string;
  jobId: string;
  originalFilename: string;
  storagePath: string;
  fileHash: string;
  mime: string;
  size: number;
  status: ImageImportItemStatus;
  aiAnalysis?: AiImageAnalysis;
  candidateProductId?: string;
  confidenceScore?: number;
  altText?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export const GRADE_SCHEDULE: Record<string, string> = {
  JSS1: "Monday",
  JSS2: "Tuesday",
  JSS3: "Wednesday"
};

export const GRADE_LABELS = ["JSS1", "JSS2", "JSS3"] as const;

export const ORDERING_DAYS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday"
};

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export type ManagerSchedule = Record<string, string>;
