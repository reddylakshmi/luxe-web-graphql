import path from 'path';
import fs   from 'fs';

import type {
  ICartRepository,
  Cart,
  CartLineItem,
  CartPromotion,
  CartTotals,
  Product,
} from '../types';

type PromoDefinition = {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number;
  description: string;
};

function loadPromos(): Record<string, PromoDefinition> {
  const file = path.resolve(__dirname, '../../../data/promos.json');
  const list = JSON.parse(fs.readFileSync(file, 'utf8')) as PromoDefinition[];
  return Object.fromEntries(list.map(p => [p.code, p]));
}

function loadProducts(): Product[] {
  const file = path.resolve(__dirname, '../../../data/products.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Product[];
}

const PROMOS   = loadPromos();
const PRODUCTS = loadProducts();

function usd(n: number) { return { currency: 'USD', amount: n }; }

function computeTotals(items: CartLineItem[], promotions: CartPromotion[]): CartTotals {
  const subtotalCents  = items.reduce((s, i) => s + i.lineTotal.amount, 0);
  const discountCents  = promotions.reduce((s, p) => s + p.discountTotal.amount, 0);
  const shippingCents  = subtotalCents > 20_000 ? 0 : 1_500;
  const taxableCents   = Math.max(0, subtotalCents - discountCents);
  const taxCents       = Math.round(taxableCents * 0.08);
  const totalCents     = Math.max(0, taxableCents + shippingCents + taxCents);

  return {
    subtotal:  usd(subtotalCents),
    discounts: usd(discountCents),
    shipping:  usd(shippingCents),
    tax:       usd(taxCents),
    total:     usd(totalCents),
  };
}

// Single shared in-memory cart for mock mode.
// In production the Java cart service is session-aware.
let store: Omit<Cart, 'totals'> = {
  id: 'cart_mock_001',
  currency: 'USD',
  items: [],
  promotions: [],
  updatedAt: new Date().toISOString(),
};

function touch() { store.updatedAt = new Date().toISOString(); }
function snapshot(): Cart {
  return { ...store, totals: computeTotals(store.items, store.promotions) };
}

export class MockCartRepository implements ICartRepository {
  async getCart(): Promise<Cart> {
    return snapshot();
  }

  async addItem(productId: string, variantId: string, quantity: number): Promise<Cart> {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) throw new Error(`Product ${productId} not found`);

    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) throw new Error(`Variant ${variantId} not found on product ${productId}`);
    if (variant.inventoryStatus === 'OUT_OF_STOCK') throw new Error('This variant is out of stock');

    const existing = store.items.find(i => i.productId === productId && i.variantId === variantId);
    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal = usd(existing.unitPrice.amount * existing.quantity);
    } else {
      const unitCents = variant.price.effective.amount;
      store.items.push({
        id: `item_${Date.now()}`,
        productId,
        variantId,
        sku: variant.sku,
        title: `${product.title} — ${variant.title}`,
        quantity,
        unitPrice: usd(unitCents),
        lineTotal: usd(unitCents * quantity),
        imageUrl: product.images[0]?.url,
      });
    }

    touch();
    return snapshot();
  }

  async removeItem(itemId: string): Promise<Cart> {
    store.items = store.items.filter(i => i.id !== itemId);
    touch();
    return snapshot();
  }

  async updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    if (quantity <= 0) return this.removeItem(itemId);

    const item = store.items.find(i => i.id === itemId);
    if (!item) throw new Error(`Cart item ${itemId} not found`);

    item.quantity = quantity;
    item.lineTotal = usd(item.unitPrice.amount * quantity);
    touch();
    return snapshot();
  }

  async applyPromo(code: string): Promise<Cart> {
    const upper = code.toUpperCase();
    const promo = PROMOS[upper];
    if (!promo) throw new Error(`Promo code "${code}" is not valid`);
    if (store.promotions.some(p => p.code === upper)) {
      throw new Error(`Promo code "${code}" is already applied`);
    }

    const subtotal = store.items.reduce((s, i) => s + i.lineTotal.amount, 0);
    let discountCents = 0;

    switch (promo.type) {
      case 'percentage': discountCents = Math.round(subtotal * promo.value / 100); break;
      case 'fixed':      discountCents = promo.value; break;
      case 'shipping':   discountCents = subtotal > 20_000 ? 0 : 1_500; break;
    }

    store.promotions.push({
      code: upper,
      description: promo.description,
      discountTotal: usd(discountCents),
    });

    touch();
    return snapshot();
  }
}
