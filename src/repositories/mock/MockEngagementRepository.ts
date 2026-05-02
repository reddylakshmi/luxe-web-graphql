import { REVIEWS } from '../../data/reviews';
import { CUSTOMER_PHOTOS } from '../../data/customerPhotos';
import { STORES } from '../../data/stores';
import { PRODUCTS } from '../../data/products';
import type {
  IEngagementRepository, Review, ReviewListResponse,
  CustomerPhoto, Store, Product,
} from '../types';

export class MockEngagementRepository implements IEngagementRepository {
  async getReviews(productId: string, page: number, pageSize: number): Promise<ReviewListResponse> {
    const all = REVIEWS.filter(r => r.productId === productId);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      page,
      pageSize,
      totalItems: all.length,
    };
  }

  async getCustomerPhotos(productId: string): Promise<CustomerPhoto[]> {
    return CUSTOMER_PHOTOS.filter(p => p.productId === productId);
  }

  async getWearItWith(productId: string, allProducts: Product[]): Promise<Product[]> {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return [];
    // Return products from complementary categories
    const complementary: Record<string, string[]> = {
      'women-tops': ['women-bottoms', 'women-outerwear'],
      'women-bottoms': ['women-tops', 'women-outerwear'],
      'women-outerwear': ['women-tops', 'women-bottoms'],
      'women-dresses': ['women-outerwear'],
      'men-tops': ['men-bottoms', 'men-outerwear'],
      'men-bottoms': ['men-tops', 'men-outerwear'],
      'men-outerwear': ['men-tops', 'men-bottoms'],
    };
    const cats = product.categoryIds;
    const targetCats = cats.flatMap(c => complementary[c] ?? []);
    const results = allProducts.filter(p =>
      p.id !== productId &&
      p.categoryIds.some(c => targetCats.includes(c))
    );
    return results.slice(0, 4);
  }

  async getCustomersAlsoLiked(productId: string, allProducts: Product[]): Promise<Product[]> {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return [];
    const sameCat = product.categoryIds.find(c => c.includes('-'));
    const results = allProducts.filter(p =>
      p.id !== productId &&
      (sameCat ? p.categoryIds.includes(sameCat) : p.categoryIds.some(c => product.categoryIds.includes(c)))
    );
    return results.slice(0, 6);
  }

  async getCustomersAlsoPurchased(productId: string, allProducts: Product[]): Promise<Product[]> {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return [];
    // Cross-category: recommend from opposite gender or kids
    const isWomen = product.categoryIds.includes('women');
    const isMen = product.categoryIds.includes('men');
    const results = allProducts.filter(p => {
      if (p.id === productId) return false;
      if (isWomen && p.categoryIds.includes('men')) return true;
      if (isMen && p.categoryIds.includes('women')) return true;
      if (p.tags.some(t => product.tags.includes(t))) return true;
      return false;
    });
    return results.slice(0, 4);
  }

  async getNearbyStores(productId: string, zipCode?: string): Promise<Store[]> {
    // In mock mode, return all stores with deterministic inventory based on product
    const productNum = parseInt(productId.replace(/\D/g, ''), 10) || 1;
    return STORES.map((store, i) => ({
      ...store,
      hasInventory: (productNum + i) % 3 !== 0,
      distance: parseFloat(((i + 1) * 1.2).toFixed(1)),
    }));
  }
}
