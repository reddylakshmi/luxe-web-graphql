import type { IProductRepository, Product, ProductFilters, PaginatedProducts } from '../types';
import type { JavaApiClient } from './JavaApiClient';

/**
 * Java REST API mapping (ready to activate — set JAVA_API_URL in .env):
 *
 *   GET  /api/products           → list(filters)
 *   GET  /api/products/:slug     → findBySlug(slug)
 *   GET  /api/products/search    → search(query, page, pageSize)
 */
export class JavaProductRepository implements IProductRepository {
  constructor(private readonly client: JavaApiClient) {}

  async list(filters: ProductFilters): Promise<PaginatedProducts> {
    return this.client.get<PaginatedProducts>('/api/products', {
      category:  filters.category,
      size:      filters.size,
      color:     filters.color,
      priceMin:  filters.priceMin,
      priceMax:  filters.priceMax,
      page:      filters.page ?? 1,
      pageSize:  filters.pageSize ?? 24,
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    try {
      return await this.client.get<Product>(`/api/products/${encodeURIComponent(slug)}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('404')) return null;
      throw err;
    }
  }

  async search(query: string, page: number, pageSize: number): Promise<PaginatedProducts> {
    return this.client.get<PaginatedProducts>('/api/products/search', { q: query, page, pageSize });
  }
}
