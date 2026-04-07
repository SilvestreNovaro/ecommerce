export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  cost_price: number;
  image_url: string | null;
  category_id: string | null;
  stock: number;
  sku: string | null;
  low_stock_threshold: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  total: number;
  shipping_address: string;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "customer" | "admin";
  created_at: string;
};

export type StockMovement = {
  id: string;
  product_id: string;
  type: "in" | "out" | "adjustment" | "sale" | "return";
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};
