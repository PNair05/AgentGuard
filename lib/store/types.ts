export type ProductVisual = "headphones" | "speaker" | "tracker" | "course" | "desk" | "luggage";

export interface Product {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  refundable: boolean;
  refundLabel: string;
  category: string;
  tags: string[];
  visual: ProductVisual;
  accent: string;
  review: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: number;
  status: "confirmed" | "cancelled";
}

export interface AppSnapshot {
  cart: CartItem[];
  orders: Order[];
  subscriptionActive: boolean;
  sessionSpent: number;
  accountDeleted: boolean;
}
