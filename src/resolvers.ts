import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from 'graphql';
import { createRepositories, type Repositories } from './repositories/index';
import { config } from './config/env';
import type { ApolloContext } from './server';

// ── JSON Scalar ───────────────────────────────────────────────────────────────

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
    case Kind.LIST:    return ast.values.map(parseLiteral);
    default:           return null;
  }
}

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize:   (v) => v,
  parseValue:  (v) => v,
  parseLiteral,
});

// ── Repository instances ──────────────────────────────────────────────────────
// createRepositories reads JAVA_API_URL from env:
//   • not set  →  Mock* repositories (JSON files in data/)
//   • set      →  JavaApi* repositories (HTTP calls to Java REST API)

const repos: Repositories = createRepositories({
  javaApiUrl: config.JAVA_API_URL,
  javaApiKey: config.JAVA_API_KEY,
});

// ── Input types (mirroring GraphQL input shapes) ──────────────────────────────

type ProductListFilters = {
  category?: string;
  size?: string;
  color?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  pageSize?: number;
};

// ── Resolvers ─────────────────────────────────────────────────────────────────

export const resolvers = {
  JSON: JSONScalar,

  Query: {
    /**
     * GET /api/products?category=&size=&color=&priceMin=&priceMax=&page=&pageSize=
     */
    async products(_: unknown, { filters = {} }: { filters?: ProductListFilters }) {
      return repos.products.list(filters);
    },

    /**
     * GET /api/products/:slug
     */
    async product(_: unknown, { slug }: { slug: string }) {
      return repos.products.findBySlug(slug);
    },

    /**
     * GET /api/products/search?q=&page=&pageSize=
     */
    async searchProducts(
      _: unknown,
      { query, page = 1, pageSize = 24 }: { query: string; page?: number; pageSize?: number }
    ) {
      return repos.products.search(query, page, pageSize);
    },

    /**
     * GET /api/cart
     */
    async cart() {
      return repos.cart.getCart();
    },

    /**
     * GET /api/users/:id  (requires session token in production)
     */
    async me(_: unknown, _args: unknown, ctx: ApolloContext) {
      if (!ctx.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return repos.users.findById(ctx.user.sub);
    },

    /**
     * GET /api/products/:productId/reviews?page=&pageSize=
     */
    async productReviews(_: unknown, { productId, page = 1, pageSize = 10 }: { productId: string; page?: number; pageSize?: number }) {
      return repos.engagement.getReviews(productId, page, pageSize);
    },

    /**
     * GET /api/products/:productId/customer-photos
     */
    async customerPhotos(_: unknown, { productId }: { productId: string }) {
      return repos.engagement.getCustomerPhotos(productId);
    },

    /**
     * GET /api/products/:productId/wear-it-with
     */
    async wearItWith(_: unknown, { productId }: { productId: string }) {
      const all = await repos.products.list({ page: 1, pageSize: 100 });
      return repos.engagement.getWearItWith(productId, all.items);
    },

    /**
     * GET /api/products/:productId/customers-also-liked
     */
    async customersAlsoLiked(_: unknown, { productId }: { productId: string }) {
      const all = await repos.products.list({ page: 1, pageSize: 100 });
      return repos.engagement.getCustomersAlsoLiked(productId, all.items);
    },

    /**
     * GET /api/products/:productId/customers-also-purchased
     */
    async customersAlsoPurchased(_: unknown, { productId }: { productId: string }) {
      const all = await repos.products.list({ page: 1, pageSize: 100 });
      return repos.engagement.getCustomersAlsoPurchased(productId, all.items);
    },

    /**
     * GET /api/products/:productId/nearby-stores?zipCode=
     */
    async nearbyStores(_: unknown, { productId, zipCode }: { productId: string; zipCode?: string }) {
      return repos.engagement.getNearbyStores(productId, zipCode);
    },
  },

  Mutation: {
    /**
     * POST /api/cart/items  { productId, variantId, quantity }
     */
    async addCartItem(_: unknown, { input }: { input: { productId: string; variantId: string; quantity: number } }) {
      const cart = await repos.cart.addItem(input.productId, input.variantId, input.quantity);
      return { cart };
    },

    /**
     * DELETE /api/cart/items/:itemId
     */
    async removeCartItem(_: unknown, { itemId }: { itemId: string }) {
      const cart = await repos.cart.removeItem(itemId);
      return { cart };
    },

    /**
     * PATCH /api/cart/items/:itemId  { quantity }
     */
    async updateCartItemQuantity(_: unknown, { input }: { input: { itemId: string; quantity: number } }) {
      const cart = await repos.cart.updateQuantity(input.itemId, input.quantity);
      return { cart };
    },

    /**
     * POST /api/cart/promotions  { code }
     */
    async applyPromoCode(_: unknown, { input }: { input: { code: string } }) {
      const cart = await repos.cart.applyPromo(input.code);
      return { cart };
    },

    /**
     * POST /api/auth/login  { email, password }
     * In production: delegates to Okta Authorization Server via Java backend
     */
    async login(_: unknown, { email, password }: { email: string; password: string }) {
      return repos.users.login(email, password);
    },

    /**
     * POST /api/auth/register  { firstName, lastName, email, password }
     */
    async register(_: unknown, { input }: { input: { firstName: string; lastName: string; email: string; password: string } }) {
      return repos.users.register(input);
    },
  },
};
