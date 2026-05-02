# Luxe GraphQL API

Apollo Server 4 + Express middleware layer that sits between the Luxe frontend and the Java commerce backend. Runs in **mock mode** by default (no external dependencies) and proxies to the real Java REST API when `JAVA_API_URL` is set.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20 |
| Language | TypeScript 5.6 (strict) |
| GraphQL server | Apollo Server 4 + `@apollo/server/express4` |
| HTTP framework | Express 4 |
| Validation | Zod 3 |
| Auth (mock) | JWT (`jsonwebtoken`) |
| Dev runner | `tsx watch` (hot-reload, no build step) |
| API docs | SpectaQL |

---

## Architecture

### Repository Pattern

All resolver logic goes through **repository interfaces** defined in `src/repositories/types.ts`. The concrete implementation is selected at startup based on environment variables — no resolver code changes required to switch between mock and production data.

```
src/
  schema.ts              GraphQL type definitions (SDL)
  resolvers.ts           Resolver map — calls repositories only, no business logic
  server.ts              Apollo Server + Express wiring, CORS, env bootstrap

  repositories/
    types.ts             IProductRepository, ICartRepository, IUserRepository, IEngagementRepository
    index.ts             Factory: returns Mock* or Java* set based on JAVA_API_URL
    mock/                In-process mock implementations (reads src/data/*)
    java/                HTTP proxy implementations (calls Java REST API)

  data/
    products.ts          Mock product catalogue (28 SKU families, 3 genders)
    reviews.ts           Mock review data
    customerPhotos.ts    Mock customer photo data
    stores.ts            Mock nearby store data
    cart.ts              In-memory cart state

  config/
    env.ts               Zod-validated env schema, dotenv loading order
  lib/
    jwt.ts               Token sign / verify helpers
```

### Data flow

```
Frontend (Next.js)
  └─ POST /graphql
       └─ Apollo Server
            └─ Resolver
                 └─ Repository interface
                      ├─ MockProductRepository  (default — reads data/products.ts)
                      └─ JavaProductRepository  (when JAVA_API_URL is set — HTTP → Java REST)
```

---

## GraphQL Schema

### Queries

| Query | Description |
|---|---|
| `products(filters)` | Paginated, filterable product listing |
| `product(slug)` | Single product by URL slug |
| `searchProducts(query, page, pageSize)` | Full-text search across title, description, brand, tags |
| `cart` | Current session cart |
| `me` | Authenticated user profile (requires `Authorization: Bearer <token>`) |
| `productReviews(productId, page, pageSize)` | Paginated customer reviews |
| `customerPhotos(productId)` | Customer-uploaded product photos |
| `wearItWith(productId)` | "Wear It With" outfit recommendations |
| `customersAlsoLiked(productId)` | Similarity-based recommendations |
| `customersAlsoPurchased(productId)` | Co-purchase recommendations |
| `nearbyStores(productId, zipCode)` | Store availability by ZIP code |

### Mutations

| Mutation | Description |
|---|---|
| `addCartItem(input)` | Add a variant to the cart |
| `removeCartItem(itemId)` | Remove a line item |
| `updateCartItemQuantity(input)` | Change line item quantity |
| `applyPromoCode(input)` | Apply a promotional code |
| `login(email, password)` | Authenticate — returns `AuthPayload` with JWT |
| `register(input)` | Create a new account — returns `AuthPayload` with JWT |

### Key types

```graphql
type Product {
  id, slug, title, brand, description
  categoryIds, tags, images
  variants { id, sku, attributes, price, inventoryStatus }
  defaultVariantId
  isBestSeller, rating, reviewCount
  fitTypes, details, sizeFit, fabricCare, shippingReturns
}

type AuthPayload {
  user: User
  token: String          # JWT — short-lived session token
  error: String
}
```

---

## Getting Started

### Install

```bash
npm install        # or: pnpm install
```

### Environment

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `4000` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000,…` |
| `JAVA_API_URL` | Java REST API base URL. Unset = mock mode | — |
| `JAVA_API_KEY` | Bearer token for Java API auth | — |
| `MOCK_JWT_SECRET` | Signing secret used in mock mode only | `mock-jwt-secret-dev-only` |
| `JWT_EXPIRY_SECONDS` | Token lifetime in seconds | `3600` |
| `APP_ENV` | Non-standard env selector (`staging`, `qa`, etc.) | `development` |

### Run locally

```bash
npm run dev        # tsx watch — auto-restarts on file changes → http://localhost:4000/graphql
```

Open Apollo Sandbox: [https://studio.apollographql.com/sandbox](https://studio.apollographql.com/sandbox) and point it at `http://localhost:4000/graphql`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot-reload (`tsx watch`) |
| `npm run dev:staging` | Hot-reload with `APP_ENV=staging` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run start:staging` | Production build with `APP_ENV=staging` |
| `npm run docs` | Generate SpectaQL API docs |
| `npm run docs:serve` | Serve API docs locally |

---

## Repository Modes

### Mock mode (default)

No external services required. All data is served from in-process TypeScript files under `src/data/`.

- 28 product families across Women, Men, and Kids
- Deterministic inventory rotation (IN_STOCK / LOW_STOCK / BACKORDER / OUT_OF_STOCK)
- Color variants with hex codes for swatch rendering
- Product images via `placehold.co` (gender-coded colour palettes)
- In-memory cart (resets on server restart)
- Mock JWT auth (`MOCK_JWT_SECRET`)

### Production mode

Set `JAVA_API_URL` in your `.env` file to proxy all calls to the Java REST backend. The `JavaApiClient` adds `Authorization: Bearer $JAVA_API_KEY` to every request.

```bash
# .env.production
JAVA_API_URL=https://api.luxe.com
JAVA_API_KEY=your-service-account-token
```

The engagement repository (`IEngagementRepository` — reviews, photos, recommendations, stores) currently always uses the mock implementation. Wire a `JavaEngagementRepository` in `src/repositories/index.ts` when those endpoints are available.

---

## Multi-Environment Setup

Env files are loaded in this order (later entries override earlier ones):

| File | When loaded |
|---|---|
| `.env` | Always |
| `.env.{APP_ENV}` | When `APP_ENV` is set (e.g. `.env.staging`) |
| `.env.local` | Always, gitignored — local developer overrides |

---

## Authentication

Mock mode uses HS256 JWTs signed with `MOCK_JWT_SECRET`. Tokens expire after `JWT_EXPIRY_SECONDS` (default 1 hour).

Protected queries (`me`) require:

```
Authorization: Bearer <token>
```

In production, Okta issues RS256 tokens. Replace the `jwt.verify` call in `src/lib/jwt.ts` with your JWKS validation logic — no resolver changes needed.

---

## API Documentation

SpectaQL generates static HTML docs from the GraphQL schema:

```bash
npm run docs          # builds to docs/output/
npm run docs:serve    # serves with live-reload on http://localhost:4400
```
