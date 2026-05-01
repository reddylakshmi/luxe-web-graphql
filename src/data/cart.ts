// In-memory cart store — single shared cart for mock/dev mode.
// In production: replace with session-aware calls to the Java cart service.

import { PRODUCTS } from './products';

export type CartLineItem = {
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  quantity: number;
  unitPrice: { currency: string; amount: number };
  lineTotal: { currency: string; amount: number };
  imageUrl?: string;
};

export type CartPromotion = {
  code: string;
  description?: string;
  discountTotal: { currency: string; amount: number };
};

type CartStore = {
  id: string;
  currency: string;
  items: CartLineItem[];
  promotions: CartPromotion[];
  updatedAt: string;
};

// Promo codes recognised by the mock server
const PROMO_CODES: Record<string, { description: string; discountCents: number }> = {
  SAVE10:   { description: '10% off your order', discountCents: 0 }, // computed dynamically
  LUXE20:   { description: '20% off your order', discountCents: 0 },
  WELCOME:  { description: '$15 off first order', discountCents: 1500 },
  FREESHIP: { description: 'Free shipping',       discountCents: 0 }, // shipping offset
};

let cart: CartStore = {
  id: 'cart_mock_001',
  currency: 'USD',
  items: [],
  promotions: [],
  updatedAt: new Date().toISOString(),
};

function touch() {
  cart.updatedAt = new Date().toISOString();
}

function computeTotals(items: CartLineItem[], promotions: CartPromotion[]) {
  const subtotalCents = items.reduce((sum, i) => sum + i.lineTotal.amount, 0);
  const discountCents = promotions.reduce((sum, p) => sum + p.discountTotal.amount, 0);
  const shippingCents = subtotalCents > 20000 ? 0 : 1500; // free shipping over $200
  const taxableCents  = Math.max(0, subtotalCents - discountCents);
  const taxCents      = Math.round(taxableCents * 0.08); // 8% tax
  const totalCents    = Math.max(0, taxableCents + shippingCents + taxCents);

  const usd = (n: number) => ({ currency: 'USD', amount: n });
  return {
    subtotal:  usd(subtotalCents),
    discounts: usd(discountCents),
    shipping:  usd(shippingCents),
    tax:       usd(taxCents),
    total:     usd(totalCents),
  };
}

export function getCart() {
  return {
    ...cart,
    totals: computeTotals(cart.items, cart.promotions),
  };
}

export function addItem(productId: string, variantId: string, quantity: number) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) throw new Error(`Product ${productId} not found`);

  const variant = product.variants.find(v => v.id === variantId);
  if (!variant) throw new Error(`Variant ${variantId} not found on product ${productId}`);
  if (variant.inventoryStatus === 'OUT_OF_STOCK') throw new Error('This variant is out of stock');

  const existing = cart.items.find(i => i.productId === productId && i.variantId === variantId);
  if (existing) {
    existing.quantity += quantity;
    existing.lineTotal = { currency: 'USD', amount: existing.unitPrice.amount * existing.quantity };
  } else {
    const unitPrice = variant.price.effective.amount;
    cart.items.push({
      id: `item_${Date.now()}`,
      productId,
      variantId,
      sku: variant.sku,
      title: `${product.title} — ${variant.title}`,
      quantity,
      unitPrice: { currency: 'USD', amount: unitPrice },
      lineTotal: { currency: 'USD', amount: unitPrice * quantity },
      imageUrl: product.images[0]?.url,
    });
  }

  touch();
  return getCart();
}

export function removeItem(itemId: string) {
  cart.items = cart.items.filter(i => i.id !== itemId);
  touch();
  return getCart();
}

export function updateQuantity(itemId: string, quantity: number) {
  const item = cart.items.find(i => i.id === itemId);
  if (!item) throw new Error(`Cart item ${itemId} not found`);
  if (quantity <= 0) {
    return removeItem(itemId);
  }
  item.quantity = quantity;
  item.lineTotal = { currency: 'USD', amount: item.unitPrice.amount * quantity };
  touch();
  return getCart();
}

export function applyPromo(code: string) {
  const upper = code.toUpperCase();
  const promo = PROMO_CODES[upper];
  if (!promo) throw new Error(`Promo code "${code}" is not valid`);

  if (cart.promotions.some(p => p.code === upper)) {
    throw new Error(`Promo code "${code}" is already applied`);
  }

  // Compute the discount amount dynamically for percentage-based promos
  const subtotal = cart.items.reduce((s, i) => s + i.lineTotal.amount, 0);
  let discountCents = promo.discountCents;
  if (upper === 'SAVE10')   discountCents = Math.round(subtotal * 0.10);
  if (upper === 'LUXE20')   discountCents = Math.round(subtotal * 0.20);
  if (upper === 'FREESHIP') discountCents = subtotal > 20000 ? 0 : 1500; // match shipping cost

  cart.promotions.push({
    code: upper,
    description: promo.description,
    discountTotal: { currency: 'USD', amount: discountCents },
  });

  touch();
  return getCart();
}
