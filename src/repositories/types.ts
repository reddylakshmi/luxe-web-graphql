/**
 * Repository interfaces — the *only* contracts that resolvers depend on.
 *
 * Swap implementations by changing the factory in src/repositories/index.ts:
 *   • JAVA_API_URL unset  →  Mock* (reads local JSON files)
 *   • JAVA_API_URL set    →  JavaApi* (proxies to REST endpoints)
 *
 * The GraphQL schema, queries, and all client code stay identical in both cases.
 */

// ── Shared value types ────────────────────────────────────────────────────────

export type Money = { currency: string; amount: number };
export type Price = { list: Money; sale: Money | null; effective: Money };

// ── Product ───────────────────────────────────────────────────────────────────

export type ProductImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
};

export type ProductVariant = {
  id: string;
  sku: string;
  title: string;
  attributes: Record<string, string>;
  price: Price;
  inventoryStatus: string;
  availableQuantity?: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  brand?: string;
  description?: string;
  categoryIds: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  defaultVariantId: string;
  tags: string[];
  updatedAt: string;
  isBestSeller: boolean;
  rating?: number;
  reviewCount?: number;
  fitTypes: string[];
  details: string[];
  sizeFit?: string;
  fabricCare?: string;
  shippingReturns?: string;
};

export type ProductFilters = {
  category?: string;
  size?: string;
  color?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  pageSize?: number;
};

export type PaginatedProducts = {
  items: Product[];
  page: number;
  pageSize: number;
  totalItems: number;
};

export type ColorVariant = {
  color: string;
  colorHex: string;
};

export type Review = {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  helpfulCount: number;
  verifiedPurchase: boolean;
  photos: string[];
};

export type ReviewListResponse = {
  items: Review[];
  page: number;
  pageSize: number;
  totalItems: number;
};

export type CustomerPhoto = {
  id: string;
  productId: string;
  userName: string;
  imageUrl: string;
  caption?: string;
  date: string;
  likes: number;
};

export type Store = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  distance?: number;
  hasInventory: boolean;
  hours: string;
};

export type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  cardholderName: string;
  isDefault: boolean;
};

export interface IProductRepository {
  list(filters: ProductFilters): Promise<PaginatedProducts>;
  findBySlug(slug: string): Promise<Product | null>;
  search(query: string, page: number, pageSize: number): Promise<PaginatedProducts>;
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export type CartLineItem = {
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  imageUrl?: string;
};

export type CartPromotion = {
  code: string;
  description?: string;
  discountTotal: Money;
};

export type CartTotals = {
  subtotal: Money;
  discounts: Money;
  shipping: Money;
  tax: Money;
  total: Money;
};

export type Cart = {
  id: string;
  currency: string;
  items: CartLineItem[];
  promotions: CartPromotion[];
  totals: CartTotals;
  updatedAt: string;
};

export interface ICartRepository {
  getCart(): Promise<Cart>;
  addItem(productId: string, variantId: string, quantity: number): Promise<Cart>;
  removeItem(itemId: string): Promise<Cart>;
  updateQuantity(itemId: string, quantity: number): Promise<Cart>;
  applyPromo(code: string): Promise<Cart>;
}

// ── User / Auth ───────────────────────────────────────────────────────────────

export type UserAddress = {
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type UserOrder = {
  id: string;
  date: string;
  status: string;
  totalCents: number;
  itemCount: number;
  items: string[];
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: string;
  points: number;
  phone?: string;
  address?: UserAddress;
  orders?: UserOrder[];
  createdAt: string;
  paymentMethods?: PaymentMethod[];
};

export type AuthPayload = {
  user: User | null;
  token: string | null;
  error: string | null;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export interface IUserRepository {
  login(email: string, password: string): Promise<AuthPayload>;
  register(input: RegisterInput): Promise<AuthPayload>;
  findById(id: string): Promise<User | null>;
}

export interface IEngagementRepository {
  getReviews(productId: string, page: number, pageSize: number): Promise<ReviewListResponse>;
  getCustomerPhotos(productId: string): Promise<CustomerPhoto[]>;
  getWearItWith(productId: string, allProducts: Product[]): Promise<Product[]>;
  getCustomersAlsoLiked(productId: string, allProducts: Product[]): Promise<Product[]>;
  getCustomersAlsoPurchased(productId: string, allProducts: Product[]): Promise<Product[]>;
  getNearbyStores(productId: string, zipCode?: string): Promise<Store[]>;
}
