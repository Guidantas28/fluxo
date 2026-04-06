export type UserRole = "admin" | "operator";

export type PaymentMethod =
  | "cash"
  | "pix"
  | "debit_card"
  | "credit_card"
  | "other";

export type SaleStatus = "draft" | "completed" | "cancelled";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  sale_price: number;
  cost_price: number;
  stock_quantity: number;
  minimum_stock: number;
  control_stock: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Sale = {
  id: string;
  client_id: string | null;
  user_id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
};

export type SaleWithClient = Sale & {
  clients: Pick<Client, "id" | "name"> | null;
};

export type SaleItemRow = SaleItem & {
  products: Pick<Product, "sku"> | null;
};
