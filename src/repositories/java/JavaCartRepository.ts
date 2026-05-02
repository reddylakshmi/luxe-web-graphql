import type { ICartRepository, Cart } from '../types';
import type { JavaApiClient } from './JavaApiClient';

/**
 * Java REST API mapping:
 *
 *   GET    /api/cart                      → getCart()
 *   POST   /api/cart/items                → addItem(productId, variantId, quantity)
 *   DELETE /api/cart/items/:itemId        → removeItem(itemId)
 *   PATCH  /api/cart/items/:itemId        → updateQuantity(itemId, quantity)
 *   POST   /api/cart/promotions           → applyPromo(code)
 */
export class JavaCartRepository implements ICartRepository {
  constructor(private readonly client: JavaApiClient) {}

  async getCart(): Promise<Cart> {
    return this.client.get<Cart>('/api/cart');
  }

  async addItem(productId: string, variantId: string, quantity: number): Promise<Cart> {
    const res = await this.client.post<{ cart: Cart }>('/api/cart/items', { productId, variantId, quantity });
    return res.cart;
  }

  async removeItem(itemId: string): Promise<Cart> {
    const res = await this.client.delete<{ cart: Cart }>(`/api/cart/items/${encodeURIComponent(itemId)}`);
    return res.cart;
  }

  async updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    const res = await this.client.patch<{ cart: Cart }>(
      `/api/cart/items/${encodeURIComponent(itemId)}`,
      { quantity }
    );
    return res.cart;
  }

  async applyPromo(code: string): Promise<Cart> {
    const res = await this.client.post<{ cart: Cart }>('/api/cart/promotions', { code });
    return res.cart;
  }
}
