import { PRODUCTS } from '../../data/products';
import type { IProductRepository, Product, ProductFilters, PaginatedProducts } from '../types';

export class MockProductRepository implements IProductRepository {
  async list(filters: ProductFilters): Promise<PaginatedProducts> {
    const { category, size, color, priceMin, priceMax } = filters;
    const page     = Math.max(1, filters.page     ?? 1);
    const pageSize = Math.max(1, filters.pageSize ?? 24);

    const all = (PRODUCTS as unknown as Product[]).filter(p => {
      if (category && !p.categoryIds.includes(category)) return false;
      if (size  && !p.variants.some(v => v.attributes['size']  === size))  return false;
      if (color && !p.variants.some(v => v.attributes['color'] === color)) return false;
      if (priceMin !== undefined) {
        const min = Math.min(...p.variants.map(v => v.price.effective.amount));
        if (min < priceMin) return false;
      }
      if (priceMax !== undefined) {
        const max = Math.max(...p.variants.map(v => v.price.effective.amount));
        if (max > priceMax) return false;
      }
      return true;
    });

    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), page, pageSize, totalItems: all.length };
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return (PRODUCTS as unknown as Product[]).find(p => p.slug === slug) ?? null;
  }

  async search(query: string, page: number, pageSize: number): Promise<PaginatedProducts> {
    const q = query.toLowerCase().trim();
    if (!q) return { items: [], page, pageSize, totalItems: 0 };

    const all = (PRODUCTS as unknown as Product[]).filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q) ||
      (p.brand ?? '').toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.categoryIds.some(c => c.toLowerCase().includes(q))
    );

    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), page, pageSize, totalItems: all.length };
  }
}
