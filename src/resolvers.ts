// Resolvers — each one shows:
//   CURRENT: returns mock data
//   TODO: replace with Java REST API call (URL shown in comment)
//
// When the Java API is ready, swap the mock call for an http.get/post call to that URL,
// parse the response, and return it. The GraphQL schema and all client queries stay identical.

import { GraphQLScalarType, Kind, type ValueNode } from 'graphql';
import { PRODUCTS } from './data/products';
import * as CartStore from './data/cart';

// ── JSON Scalar ───────────────────────────────────────────────────────────────
// Allows returning arbitrary key-value objects (e.g. variant attributes).

function parseLiteral(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:  return ast.value;
    case Kind.BOOLEAN: return ast.value;
    case Kind.INT:     return parseInt(ast.value, 10);
    case Kind.FLOAT:   return parseFloat(ast.value);
    case Kind.NULL:    return null;
    case Kind.OBJECT: {
      const obj: Record<string, unknown> = {};
      ast.fields.forEach(f => { obj[f.name.value] = parseLiteral(f.value); });
      return obj;
    }
    case Kind.LIST:
      return ast.values.map(parseLiteral);
    default:
      return null;
  }
}

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize:   (v) => v,
  parseValue:  (v) => v,
  parseLiteral,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

type ProductFilters = {
  category?: string;
  size?: string;
  color?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  pageSize?: number;
};

function applyFilters(filters: ProductFilters = {}) {
  const { category, size, color, priceMin, priceMax } = filters;

  return PRODUCTS.filter(p => {
    if (category && !p.categoryIds.includes(category)) return false;

    if (size && !p.variants.some(v => v.attributes['size'] === size)) return false;
    if (color && !p.variants.some(v => v.attributes['color'] === color)) return false;

    if (priceMin !== undefined) {
      const minPrice = Math.min(...p.variants.map(v => v.price.effective.amount));
      if (minPrice < priceMin) return false;
    }
    if (priceMax !== undefined) {
      const maxPrice = Math.max(...p.variants.map(v => v.price.effective.amount));
      if (maxPrice > priceMax) return false;
    }

    return true;
  });
}

// ── Resolvers ─────────────────────────────────────────────────────────────────

export const resolvers = {
  JSON: JSONScalar,

  Query: {
    /**
     * GET /api/products?category=&size=&color=&priceMin=&priceMax=&page=&pageSize=
     *
     * CURRENT: filtered in-memory from mock data
     * TODO: const res = await http.get(`${JAVA_API}/products?${qs}`);
     *       return res.data;
     */
    products(_: unknown, { filters = {} }: { filters?: ProductFilters }) {
      const page     = Math.max(1, filters.page     ?? 1);
      const pageSize = Math.max(1, filters.pageSize ?? 24);

      const all   = applyFilters(filters);
      const start = (page - 1) * pageSize;
      const items = all.slice(start, start + pageSize);

      return {
        items,
        page,
        pageSize,
        totalItems: all.length,
      };
    },

    /**
     * GET /api/products/:slug
     *
     * CURRENT: find in mock data array
     * TODO: const res = await http.get(`${JAVA_API}/products/${slug}`);
     *       return res.data ?? null;
     */
    product(_: unknown, { slug }: { slug: string }) {
      return PRODUCTS.find(p => p.slug === slug) ?? null;
    },

    /**
     * GET /api/products/search?q=&page=&pageSize=
     *
     * CURRENT: full-text filter over in-memory PRODUCTS
     * TODO: const res = await http.get(`${JAVA_API}/products/search?q=${query}&page=${page}&pageSize=${pageSize}`);
     *       return res.data;
     */
    searchProducts(_: unknown, { query, page = 1, pageSize = 24 }: { query: string; page?: number; pageSize?: number }) {
      const q = query.toLowerCase().trim();
      if (!q) return { items: [], page, pageSize, totalItems: 0 };
      const all = PRODUCTS.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q) ||
        p.tags.some((t: string) => t.toLowerCase().includes(q)) ||
        p.categoryIds.some((c: string) => c.toLowerCase().includes(q))
      );
      const start = (page - 1) * pageSize;
      return { items: all.slice(start, start + pageSize), page, pageSize, totalItems: all.length };
    },

    /**
     * GET /api/cart  (session-identified on the Java side)
     *
     * CURRENT: return single in-memory cart
     * TODO: const res = await http.get(`${JAVA_API}/cart`, { headers: { Authorization: ctx.token } });
     *       return res.data;
     */
    cart() {
      return CartStore.getCart();
    },
  },

  Mutation: {
    /**
     * POST /api/cart/items  { productId, variantId, quantity }
     *
     * CURRENT: mutate in-memory store
     * TODO: const res = await http.post(`${JAVA_API}/cart/items`, input, { headers: auth });
     *       return { cart: res.data.cart };
     */
    addCartItem(_: unknown, { input }: { input: { productId: string; variantId: string; quantity: number } }) {
      const cart = CartStore.addItem(input.productId, input.variantId, input.quantity);
      return { cart };
    },

    /**
     * DELETE /api/cart/items/:itemId
     *
     * CURRENT: mutate in-memory store
     * TODO: await http.delete(`${JAVA_API}/cart/items/${itemId}`, { headers: auth });
     *       return { cart: await fetchCart() };
     */
    removeCartItem(_: unknown, { itemId }: { itemId: string }) {
      const cart = CartStore.removeItem(itemId);
      return { cart };
    },

    /**
     * PATCH /api/cart/items/:itemId  { quantity }
     *
     * CURRENT: mutate in-memory store
     * TODO: const res = await http.patch(`${JAVA_API}/cart/items/${input.itemId}`, { quantity: input.quantity }, { headers: auth });
     *       return { cart: res.data.cart };
     */
    updateCartItemQuantity(_: unknown, { input }: { input: { itemId: string; quantity: number } }) {
      const cart = CartStore.updateQuantity(input.itemId, input.quantity);
      return { cart };
    },

    /**
     * POST /api/cart/promotions  { code }
     *
     * CURRENT: validate against hardcoded promo list, mutate in-memory cart
     * TODO: const res = await http.post(`${JAVA_API}/cart/promotions`, { code: input.code }, { headers: auth });
     *       return { cart: res.data.cart };
     */
    applyPromoCode(_: unknown, { input }: { input: { code: string } }) {
      const cart = CartStore.applyPromo(input.code);
      return { cart };
    },
  },
};
