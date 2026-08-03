export type Category =
  | "Laptops and Notebooks"
  | "Smartphones and Accessories"
  | "Printers and Scanners"
  | "Office Ergonomics"
  | "Audio and Headphones"
  | "Monitors and Displays"
  | "Networking and Storage"
  | "Power and UPS";

export const CATEGORIES: Category[] = [
  "Laptops and Notebooks",
  "Smartphones and Accessories",
  "Printers and Scanners",
  "Office Ergonomics",
  "Audio and Headphones",
  "Monitors and Displays",
  "Networking and Storage",
  "Power and UPS"
];

export interface ProductSpec {
  label: string;
  value: string;
}

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
  group?: "Laptops" | "Printers" | "Smart Accessories" | "Power Solutions" | "Office and Audio";
  tags: string[];
  miniStore?: boolean;
  supplyType?: "supplies" | "grocery";
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
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: "customer" | "admin" | "manager";
  grade?: string;
  school?: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id?: number;
  op: "create-product" | "update-product" | "create-order" | "update-stock" | "update-order" | "delete-product" | "update-customer";
  payload: Record<string, unknown>;
  synced: boolean;
  createdAt: string;
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
