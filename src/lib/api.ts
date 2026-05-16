const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function getImageUrl(image: string | undefined | null): string | null {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  if (image.startsWith("/uploads/")) return `${BASE}${image}`;
  return null; // emoji or empty
}

function getToken() {
  return localStorage.getItem("token");
}

async function req<T>(method: string, path: string, body?: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Xəta" }));
    throw new Error((err as any).error || "Xəta");
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    req<{ token: string; user: User }>("POST", "/api/auth/login", { email, password }),
  register: (email: string, password: string, full_name: string) =>
    req<{ token: string; user: User }>("POST", "/api/auth/register", { email, password, full_name }),
  me: () => req<{ user: User }>("GET", "/api/auth/me", undefined, true),

  // Categories
  getCategories: () => req<Category[]>("GET", "/api/categories"),
  createCategory: (data: Partial<Category>) => req<{ id: number }>("POST", "/api/categories", data, true),
  updateCategory: (id: number, data: Partial<Category>) => req<{ ok: boolean }>("PUT", `/api/categories/${id}`, data, true),
  deleteCategory: (id: number) => req<{ ok: boolean }>("DELETE", `/api/categories/${id}`, undefined, true),

  // Products
  getProducts: (params?: { category?: string; active?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.active !== undefined) q.set("active", String(params.active));
    return req<Product[]>("GET", `/api/products?${q}`);
  },
  getProduct: (id: number) => req<Product>("GET", `/api/products/${id}`),
  getFeaturedProduct: () => req<Product | null>("GET", "/api/products/featured"),
  getMostSoldProducts: (limit = 12) => req<Product[]>("GET", `/api/products/most-sold?limit=${limit}`),
  setFeatured: (id: number, is_featured: boolean) => req<{ ok: boolean }>("PUT", `/api/products/${id}/featured`, { is_featured }, true),
  createProduct: (data: Partial<Product>) => req<{ id: number }>("POST", "/api/products", data, true),
  updateProduct: (id: number, data: Partial<Product>) => req<{ ok: boolean }>("PUT", `/api/products/${id}`, data, true),
  deleteProduct: (id: number) => req<{ ok: boolean }>("DELETE", `/api/products/${id}`, undefined, true),

  // Campaigns
  getCampaigns: () => req<Campaign[]>("GET", "/api/campaigns"),
  createCampaign: (data: Partial<Campaign>) => req<{ id: number }>("POST", "/api/campaigns", data, true),
  updateCampaign: (id: number, data: Partial<Campaign>) => req<{ ok: boolean }>("PUT", `/api/campaigns/${id}`, data, true),
  deleteCampaign: (id: number) => req<{ ok: boolean }>("DELETE", `/api/campaigns/${id}`, undefined, true),

  // Orders
  getOrders: () => req<Order[]>("GET", "/api/orders", undefined, true),
  createOrder: (data: Partial<Order>) => req<{ id: number }>("POST", "/api/orders", data),
  updateOrderStatus: (id: number, status: string) => req<{ ok: boolean }>("PUT", `/api/orders/${id}/status`, { status }, true),
  deleteOrder: (id: number) => req<{ ok: boolean }>("DELETE", `/api/orders/${id}`, undefined, true),

  // Users
  getUsers: () => req<User[]>("GET", "/api/users", undefined, true),
  updateUserRole: (id: number, role: string) => req<{ ok: boolean }>("PUT", `/api/users/${id}/role`, { role }, true),

  // Stats
  getStats: () => req<Stats>("GET", "/api/stats", undefined, true),

  // Upload
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = getToken();
    const res = await fetch(`${BASE}/api/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Yükləmə xətası");
    // Store relative path — resolved at render time via getImageUrl()
    return data.url;
  },
};

// Types
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "user";
  created_at?: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
  description: string;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  old_price?: number;
  discount: number;
  image: string;
  category_slug?: string;
  stock: number;
  is_active: number;
  is_featured: number;
  most_sold: number;
  description: string;
  created_at?: string;
}

export interface Campaign {
  id: number;
  title: string;
  description: string;
  discount_percent: number;
  image: string;
  start_date?: string;
  end_date?: string;
  is_active: number;
  created_at?: string;
}

export interface Order {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  items: string;
  notes: string;
  created_at?: string;
}

export interface Stats {
  products: number;
  orders: number;
  users: number;
  revenue: number;
  pending: number;
}
