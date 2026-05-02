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
    isBestSeller: Boolean!
    rating: Float
    reviewCount: Int
    fitTypes: [String!]!
    details: [String!]!
    sizeFit: String
    fabricCare: String
    shippingReturns: String
  }

  type ProductListResponse {
    items: [Product!]!
    page: Int!
    pageSize: Int!
    totalItems: Int!
  }

  type ColorVariant {
    color: String!
    colorHex: String!
  }

  type Review {
    id: ID!
    productId: String!
    userName: String!
    rating: Int!
    title: String!
    body: String!
    date: String!
    helpfulCount: Int!
    verifiedPurchase: Boolean!
    photos: [String!]!
  }

  type ReviewListResponse {
    items: [Review!]!
    page: Int!
    pageSize: Int!
    totalItems: Int!
  }

  type CustomerPhoto {
    id: ID!
    productId: String!
    userName: String!
    imageUrl: String!
    caption: String
    date: String!
    likes: Int!
  }

  type Store {
    id: ID!
    name: String!
    address: String!
    city: String!
    state: String!
    zip: String!
    phone: String!
    distance: Float
    hasInventory: Boolean!
    hours: String!
  }

  type PaymentMethod {
    id: ID!
    brand: String!
    last4: String!
    expMonth: Int!
    expYear: Int!
    cardholderName: String!
    isDefault: Boolean!
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

  # ── User & Authentication ─────────────────────────────────────────────────────
  # In production: login/register proxy to the Okta Authorization Server.
  # The Java backend validates the Okta JWT and returns a session-scoped user.

  type UserAddress {
    line1:   String!
    city:    String!
    state:   String!
    zip:     String!
    country: String!
  }

  type UserOrder {
    id:         String!
    date:       String!
    status:     String!
    totalCents: Int!
    itemCount:  Int!
    items:      [String!]!
  }

  enum LoyaltyTier {
    Bronze
    Silver
    Gold
    Platinum
  }

  type User {
    id:             ID!
    email:          String!
    firstName:      String!
    lastName:       String!
    tier:           LoyaltyTier!
    points:         Int!
    phone:          String
    address:        UserAddress
    orders:         [UserOrder!]!
    createdAt:      String!
    paymentMethods: [PaymentMethod!]!
  }

  "Returned by login and register mutations"
  type AuthPayload {
    user:  User
    "Short-lived session token (JWT in production, opaque in mock mode)"
    token: String
    error: String
  }

  input RegisterInput {
    firstName: String!
    lastName:  String!
    email:     String!
    password:  String!
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
    "Fetch the authenticated user's profile — requires a valid Bearer token"
    me: User
    productReviews(productId: ID!, page: Int, pageSize: Int): ReviewListResponse!
    customerPhotos(productId: ID!): [CustomerPhoto!]!
    wearItWith(productId: ID!): [Product!]!
    customersAlsoLiked(productId: ID!): [Product!]!
    customersAlsoPurchased(productId: ID!): [Product!]!
    nearbyStores(productId: ID!, zipCode: String): [Store!]!
  }

  type Mutation {
    addCartItem(input: AddCartItemInput!): CartMutationResponse!
    removeCartItem(itemId: String!): CartMutationResponse!
    updateCartItemQuantity(input: UpdateCartItemInput!): CartMutationResponse!
    applyPromoCode(input: ApplyPromoInput!): CartMutationResponse!

    "Authenticate with email + password (mock Okta flow in dev/staging)"
    login(email: String!, password: String!): AuthPayload!
    "Create a new account"
    register(input: RegisterInput!): AuthPayload!
  }
`;
