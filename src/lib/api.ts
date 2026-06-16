const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface CreditPlan {
  months: number;
  rate: number;
  label?: string;
}

export interface CreditCompany {
  id: number;
  name: string;
  logo: string;
  plans: CreditPlan[] | string;
  is_active: number;
  position: number;
  type?: "credit" | "nisye";
}

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
  register: (email: string, password: string, full_name: string, phone: string) =>
    req<{ token: string; user: User }>("POST", "/api/auth/register", { email, password, full_name, phone }),
  me: () => req<{ user: User }>("GET", "/api/auth/me", undefined, true),

  // Categories
  getCategories: () => req<Category[]>("GET", "/api/categories"),
  getCategoriesAll: () => req<Category[]>("GET", "/api/categories/all", undefined, true),
  getCategoriesSearchIndex: () => req<Pick<Category, "id"|"slug"|"name">[]>("GET", "/api/categories/search-index"),
  createCategory: (data: Partial<Category>) => req<{ id: number }>("POST", "/api/categories", data, true),
  updateCategory: (id: number, data: Partial<Category>) => req<{ ok: boolean }>("PUT", `/api/categories/${id}`, data, true),
  deleteCategory: (id: number) => req<{ ok: boolean }>("DELETE", `/api/categories/${id}`, undefined, true),
  reorderCategory: (id: number, direction: "up" | "down") => req<{ ok: boolean }>("PUT", `/api/categories/${id}/reorder`, { direction }, true),

  // Products
  getProducts: (params?: { category?: string; active?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.active !== undefined) q.set("active", String(params.active));
    return req<Product[]>("GET", `/api/products?${q}`);
  },
  getProduct: (id: number) => req<Product>("GET", `/api/products/${id}`),
  getFeaturedProduct: () => req<(Product & { _until?: string | null; _discount?: number; _credit_months?: number; _note?: string })[]>("GET", "/api/products/featured"),
  getMostSoldProducts: (limit = 12) => req<Product[]>("GET", `/api/products/most-sold?limit=${limit}`),
  getPopularProducts: (limit = 12) => req<Product[]>("GET", `/api/products/popular?limit=${limit}`),
  setMostSold: (id: number, most_sold: boolean) => req<{ ok: boolean }>("PUT", `/api/products/${id}/most-sold`, { most_sold }, true),
  setPopular: (id: number, is_popular: boolean) => req<{ ok: boolean }>("PUT", `/api/products/${id}/popular`, { is_popular }, true),
  setFeatured: (id: number, is_featured: boolean) => req<{ ok: boolean }>("PUT", `/api/products/${id}/featured`, { is_featured }, true),
  getFeaturedSettings: () => req<FeaturedSettings>("GET", "/api/featured-settings", undefined, true),
  updateFeaturedSettings: (data: Partial<FeaturedSettings>) => req<{ ok: boolean }>("PUT", "/api/featured-settings", data, true),
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

  // Promo Codes
  getPromoCodes: () => req<PromoCode[]>("GET", "/api/promo-codes", undefined, true),
  validatePromo: (code: string, total: number) => req<{ ok: boolean; code: string; type: string; value: number; discount: number }>("POST", "/api/promo-codes/validate", { code, total }),
  createPromoCode: (data: Partial<PromoCode>) => req<{ id: number }>("POST", "/api/promo-codes", data, true),
  updatePromoCode: (id: number, data: Partial<PromoCode>) => req<{ ok: boolean }>("PUT", `/api/promo-codes/${id}`, data, true),
  deletePromoCode: (id: number) => req<{ ok: boolean }>("DELETE", `/api/promo-codes/${id}`, undefined, true),

  // Reviews
  getProductReviews: (productId: number) => req<ProductReview[]>("GET", `/api/products/${productId}/reviews`),
  createReview: (productId: number, data: { author_name: string; rating: number; body: string }) =>
    req<{ id: number }>("POST", `/api/products/${productId}/reviews`, data),
  deleteReview: (id: number) => req<{ ok: boolean }>("DELETE", `/api/reviews/${id}`, undefined, true),

  // Profile
  updateProfile: (data: { full_name?: string; password?: string; new_password?: string }) =>
    req<{ user: User }>("PUT", "/api/auth/profile", data, true),

  // My orders
  getMyOrders: () => req<Order[]>("GET", "/api/me/orders", undefined, true),

  // Wishlist
  getWishlist: () => req<Product[]>("GET", "/api/me/wishlist", undefined, true),
  addToWishlist: (product_id: number) => req<{ ok: boolean }>("POST", "/api/me/wishlist", { product_id }, true),
  removeFromWishlist: (product_id: number) => req<{ ok: boolean }>("DELETE", `/api/me/wishlist/${product_id}`, undefined, true),

  // Compare
  getCompare: () => req<Product[]>("GET", "/api/me/compare", undefined, true),
  addToCompare: (product_id: number) => req<{ ok: boolean }>("POST", "/api/me/compare", { product_id }, true),
  removeFromCompare: (product_id: number) => req<{ ok: boolean }>("DELETE", `/api/me/compare/${product_id}`, undefined, true),

  // Addresses
  getAddresses: () => req<Address[]>("GET", "/api/me/addresses", undefined, true),
  createAddress: (data: Partial<Address>) => req<{ id: number }>("POST", "/api/me/addresses", data, true),
  updateAddress: (id: number, data: Partial<Address>) => req<{ ok: boolean }>("PUT", `/api/me/addresses/${id}`, data, true),
  deleteAddress: (id: number) => req<{ ok: boolean }>("DELETE", `/api/me/addresses/${id}`, undefined, true),

  // Users
  getUsers: () => req<User[]>("GET", "/api/users", undefined, true),
  updateUserRole: (id: number, role: string) => req<{ ok: boolean }>("PUT", `/api/users/${id}/role`, { role }, true),
  deleteUser: (id: number) => req<{ ok: boolean }>("DELETE", `/api/users/${id}`, undefined, true),

  // Banners
  getBanners: () => req<Banner[]>("GET", "/api/banners"),
  getBannersAll: () => req<Banner[]>("GET", "/api/banners/all", undefined, true),
  createBanner: (data: Partial<Banner>) => req<Banner>("POST", "/api/banners", data, true),
  updateBanner: (id: number, data: Partial<Banner>) => req<Banner>("PUT", `/api/banners/${id}`, data, true),
  deleteBanner: (id: number) => req<{ ok: boolean }>("DELETE", `/api/banners/${id}`, undefined, true),

  // Brands
  getBrands: () => req<Brand[]>("GET", "/api/brands"),
  getBrandsAll: () => req<Brand[]>("GET", "/api/brands/all", undefined, true),
  createBrand: (data: Partial<Brand>) => req<{ id: number }>("POST", "/api/brands", data, true),
  updateBrand: (id: number, data: Partial<Brand>) => req<{ ok: boolean }>("PUT", `/api/brands/${id}`, data, true),
  deleteBrand: (id: number) => req<{ ok: boolean }>("DELETE", `/api/brands/${id}`, undefined, true),

  // Stores
  getStores: () => req<Store[]>("GET", "/api/stores"),
  createStore: (data: Partial<Store>) => req<{ id: number }>("POST", "/api/stores", data, true),
  updateStore: (id: number, data: Partial<Store>) => req<{ ok: boolean }>("PUT", `/api/stores/${id}`, data, true),
  deleteStore: (id: number) => req<{ ok: boolean }>("DELETE", `/api/stores/${id}`, undefined, true),

  // Credit Companies
  getCreditCompanies: () => req<CreditCompany[]>("GET", "/api/credit-companies/active"),
  getCreditCompaniesAll: () => req<CreditCompany[]>("GET", "/api/credit-companies", undefined, true),
  createCreditCompany: (data: Partial<CreditCompany>) => req<{ id: number }>("POST", "/api/credit-companies", data, true),
  updateCreditCompany: (id: number, data: Partial<CreditCompany>) => req<{ ok: boolean }>("PUT", `/api/credit-companies/${id}`, data, true),
  deleteCreditCompany: (id: number) => req<{ ok: boolean }>("DELETE", `/api/credit-companies/${id}`, undefined, true),

  // Stats
  getStats: () => req<Stats>("GET", "/api/stats", undefined, true),
  getPageViews: () => req<PageViewStats>("GET", "/api/page-views", undefined, true),
  trackView: (path: string) => fetch(`${BASE}/api/track`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }).catch(() => {}),

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
  phone?: string;
  created_at?: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
  description: string;
  parent_id?: number | null;
  is_hidden?: number;
  featured_product_id?: number | null;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  old_price?: number;
  sale_price?: number | null;
  extra_price?: number | null;
  components?: string;
  discount: number;
  image: string;
  images?: string;
  category_slug?: string;
  stock: number;
  is_active: number;
  is_featured: number;
  most_sold: number;
  is_popular: number;
  description: string;
  brand_slug?: string;
  credit_months?: number;
  interest_free?: number;
  interest_rate?: number;
  commission_free?: number;
  commission_free_months?: number;
  ideal_credit_months?: number;
  in_stock?: number | null;
  specifications?: string;
  colors?: string;
  view_count?: number;
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
  link?: string;
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
  payment_type?: string;
  credit_months?: number;
  promo_code?: string;
  promo_discount?: number;
  created_at?: string;
}

export interface PromoCode {
  id: number;
  code: string;
  type: "percent" | "amount";
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  is_active: number;
  expires_at?: string | null;
  created_at?: string;
}

export interface ProductReview {
  id: number;
  product_id: number;
  author_name: string;
  rating: number;
  body: string;
  is_approved: number;
  created_at?: string;
}

export interface Brand {
  id: number;
  slug: string;
  name: string;
  logo: string;
  position?: number;
  is_active?: number;
  created_at?: string;
}

export interface Store {
  id: number;
  city: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  lat?: number | null;
  lng?: number | null;
  created_at?: string;
}

export interface FeaturedProductItem {
  id: number;
  discount?: number;
  credit_months?: number;
  until?: string | null;
}

export interface FeaturedSettings {
  id: number;
  product_id: number | null;
  product_ids: number[];
  product_items: FeaturedProductItem[];
  until: string | null;
  note: string;
  discount: number;
  credit_months: number;
  featured_products?: Partial<Product>[];
}

export interface Address {
  id: number;
  user_id: number;
  title: string;
  address: string;
  city: string;
  is_default: number;
  created_at?: string;
}

export interface Stats {
  products: number;
  orders: number;
  users: number;
  revenue: number;
  pending: number;
}

export interface Banner {
  id: number;
  image: string;
  position: number;
  is_active: number;
  created_at: string;
}

export interface PageViewStats {
  todayViews: number;
  weekViews: number;
  totalViews: number;
  todayUnique: number;
  weekUnique: number;
  totalUnique: number;
  topPages: { path: string; total: number }[];
  daily: { date: string; total: number }[];
  topCountries: { country: string; country_code: string; visitors: number }[];
  azToday: number;
  azWeek: number;
  azTotal: number;
  hourly: number[];
  devices: { mobile: number; tablet: number; desktop: number };
  monthlyRevenue: { day: string; revenue: number }[];
  newUsersToday: number;
  newUsersWeek: number;
  conversionRate: number;
  ordersWeek: number;
}
