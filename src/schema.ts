export const typeDefs = `#graphql

  # Arbitrary JSON object (used for variant attributes like { size: "M", color: "Black" })
  scalar JSON

  # ── Money & Pricing ──────────────────────────────────────────────────────────

  type Money {
    currency: String!
    "Amount in lowest denomination (cents). e.g. 89500 = $895.00"
    amount: Int!
  }

  type Price {
    list: Money!
    "Null when no sale is active"
    sale: Money
    "Always the price to charge: sale if active, otherwise list"
    effective: Money!
  }

  # ── Products ─────────────────────────────────────────────────────────────────

  enum InventoryStatus {
    IN_STOCK
    LOW_STOCK
    BACKORDER
    OUT_OF_STOCK
  }

  type ProductImage {
    url: String!
    alt: String!
    width: Int!
    height: Int!
  }

  type ProductVariant {
    id: ID!
    sku: String!
    title: String!
    "Key-value pairs e.g. { size: 'M', color: 'Black' }"
    attributes: JSON!
    price: Price!
    inventoryStatus: InventoryStatus!
    availableQuantity: Int
  }

  type Product {
    id: ID!
    slug: String!
    title: String!
    brand: String
    description: String
    categoryIds: [String!]!
    images: [ProductImage!]!
    variants: [ProductVariant!]!
    defaultVariantId: String!
    tags: [String!]!
    updatedAt: String!
  }

  type ProductListResponse {
    items: [Product!]!
    page: Int!
    pageSize: Int!
    totalItems: Int!
  }

  input ProductListFilters {
    category:  String
    size:      String
    color:     String
    priceMin:  Int
    priceMax:  Int
    page:      Int
    pageSize:  Int
  }

  # ── Cart ─────────────────────────────────────────────────────────────────────

  type CartPromotion {
    code: String!
    description: String
    discountTotal: Money!
  }

  type CartLineItem {
    id: ID!
    productId: String!
    variantId: String!
    sku: String!
    title: String!
    quantity: Int!
    unitPrice: Money!
    lineTotal: Money!
    imageUrl: String
  }

  type CartTotals {
    subtotal:  Money!
    discounts: Money!
    shipping:  Money!
    tax:       Money!
    total:     Money!
  }

  type Cart {
    id: ID!
    currency: String!
    items: [CartLineItem!]!
    promotions: [CartPromotion!]!
    totals: CartTotals!
    updatedAt: String!
  }

  type CartMutationResponse {
    cart: Cart!
  }

  input AddCartItemInput {
    productId: String!
    variantId: String!
    quantity:  Int!
  }

  input UpdateCartItemInput {
    itemId:   String!
    quantity: Int!
  }

  input ApplyPromoInput {
    code: String!
  }

  # ── Root Operations ───────────────────────────────────────────────────────────

  type Query {
    "Paginated, filterable product listing"
    products(filters: ProductListFilters): ProductListResponse!
    "Single product by slug — null when not found"
    product(slug: String!): Product
    "Full-text search across title, description, brand, and tags"
    searchProducts(query: String!, page: Int, pageSize: Int): ProductListResponse!
    "Current user's cart (single shared cart in mock mode)"
    cart: Cart!
  }

  type Mutation {
    addCartItem(input: AddCartItemInput!): CartMutationResponse!
    removeCartItem(itemId: String!): CartMutationResponse!
    updateCartItemQuantity(input: UpdateCartItemInput!): CartMutationResponse!
    applyPromoCode(input: ApplyPromoInput!): CartMutationResponse!
  }
`;
