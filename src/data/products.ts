// Mock product catalogue — replace resolver calls with Java REST API calls when ready.
// All prices are in cents (USD). Images use placehold.co for dev; swap for real CDN URLs.

export type Money = { currency: string; amount: number };
export type Price = { list: Money; sale: Money | null; effective: Money };
export type ProductImage = { url: string; alt: string; width: number; height: number };
export type ProductVariant = {
  id: string; sku: string; title: string;
  attributes: Record<string, string>;
  price: Price;
  inventoryStatus: string;
  availableQuantity?: number;
};
export type Product = {
  id: string; slug: string; title: string; brand?: string; description?: string;
  categoryIds: string[]; images: ProductImage[]; variants: ProductVariant[];
  defaultVariantId: string; tags: string[]; updatedAt: string;
};

const usd = (n: number): Money => ({ currency: 'USD', amount: n });
const listPrice = (c: number): Price => ({ list: usd(c), sale: null, effective: usd(c) });
const salePrice = (l: number, s: number): Price => ({ list: usd(l), sale: usd(s), effective: usd(s) });

const img = (name: string, bg: string, fg: string): ProductImage[] => [
  { url: `https://placehold.co/600x800/${bg}/${fg}?text=${encodeURIComponent(name)}`, alt: `${name} front`, width: 600, height: 800 },
  { url: `https://placehold.co/600x800/${bg}/${fg}?text=${encodeURIComponent(name)}+Back`, alt: `${name} back`, width: 600, height: 800 },
];

// Rotating inventory — deterministic, realistic stock mix
const INV: Array<{ s: string; q?: number }> = [
  { s: 'IN_STOCK', q: 8 }, { s: 'IN_STOCK', q: 12 }, { s: 'LOW_STOCK', q: 3 },
  { s: 'IN_STOCK', q: 6 }, { s: 'OUT_OF_STOCK' },    { s: 'IN_STOCK', q: 9 },
  { s: 'IN_STOCK', q: 5 }, { s: 'BACKORDER' },        { s: 'IN_STOCK', q: 7 },
  { s: 'LOW_STOCK', q: 2 }, { s: 'IN_STOCK', q: 10 }, { s: 'IN_STOCK', q: 4 },
];
let _ii = 0;
const nextInv = () => { const r = INV[_ii++ % INV.length]; return r; };

function mkVs(pfx: string, sku: string, sizes: string[], colors: string[], price: Price): ProductVariant[] {
  let n = 0;
  return colors.flatMap(c =>
    sizes.map(s => {
      n++;
      const { s: status, q: qty } = nextInv();
      return {
        id: `${pfx}-v${String(n).padStart(2, '0')}`,
        sku: `${sku}-${String(n).padStart(2, '0')}`,
        title: `${s} / ${c}`,
        attributes: { size: s, color: c },
        price,
        inventoryStatus: status,
        ...(qty !== undefined ? { availableQuantity: qty } : {}),
      };
    })
  );
}

const TS = '2025-10-01T10:00:00.000Z';

export const PRODUCTS: Product[] = [

  // ── WOMEN ────────────────────────────────────────────────────────────────────

  {
    id: 'prod_w001', slug: 'women-essential-tee',
    title: 'Essential Crewneck Tee', brand: 'Luxe',
    description: 'A wardrobe staple in soft cotton jersey. Relaxed crewneck fit, perfect for everyday layering.',
    categoryIds: ['women', 'women-tops', 'new-arrivals'],
    images: img('Essential Tee', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt001', 'WET', ['XS', 'S', 'M', 'L', 'XL'], ['White', 'Black', 'Navy', 'Sage'], listPrice(2495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_w002', slug: 'women-slim-jeans',
    title: 'Slim Fit Jeans', brand: 'Luxe',
    description: 'Mid-rise slim fit in stretch denim. Contoured waistband and five-pocket styling.',
    categoryIds: ['women', 'women-bottoms'],
    images: img('Slim Jeans', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt002', 'WSJ', ['00', '0', '2', '4', '6', '8', '10', '12'], ['Light Wash', 'Dark Wash', 'Black'], listPrice(5995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_w003', slug: 'women-floral-wrap-dress',
    title: 'Floral Midi Wrap Dress', brand: 'Luxe',
    description: 'Midi-length wrap silhouette in a printed woven fabric. V-neckline and self-tie waist.',
    categoryIds: ['women', 'women-dresses', 'new-arrivals', 'sale'],
    images: img('Wrap Dress', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt003', 'WFD', ['XS', 'S', 'M', 'L', 'XL'], ['Floral Blue', 'Floral Pink'], salePrice(7995, 5995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals', 'sale'], updatedAt: TS,
  },
  {
    id: 'prod_w004', slug: 'women-linen-blazer',
    title: 'Linen-Blend Blazer', brand: 'Luxe',
    description: 'Relaxed single-button blazer in a lightweight linen blend. Notch lapels and two welt pockets.',
    categoryIds: ['women', 'women-outerwear', 'new-arrivals'],
    images: img('Linen Blazer', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt004', 'WLB', ['XS', 'S', 'M', 'L', 'XL'], ['Ivory', 'Black', 'Dusty Blue'], listPrice(11995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_w005', slug: 'women-wide-leg-khaki',
    title: 'Wide-Leg Khaki', brand: 'Luxe',
    description: 'Relaxed wide-leg trouser in a cotton-blend twill. Elasticized waistband with belt loops.',
    categoryIds: ['women', 'women-bottoms'],
    images: img('Wide Leg Khaki', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt005', 'WWK', ['00', '0', '2', '4', '6', '8', '10', '12'], ['Khaki', 'Black', 'Cream'], listPrice(5495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_w006', slug: 'women-ribbed-sweater',
    title: 'Ribbed Turtleneck Sweater', brand: 'Luxe',
    description: 'Fine-knit ribbed sweater with a generous roll neck. Relaxed fit in a soft acrylic-blend.',
    categoryIds: ['women', 'women-tops'],
    images: img('Ribbed Sweater', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt006', 'WRS', ['XS', 'S', 'M', 'L', 'XL'], ['Camel', 'Cream', 'Charcoal'], listPrice(6995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_w007', slug: 'women-denim-jacket',
    title: 'Classic Denim Jacket', brand: 'Luxe',
    description: 'Timeless trucker silhouette in rigid denim. Button front, chest pockets, and adjustable side tabs.',
    categoryIds: ['women', 'women-outerwear', 'sale'],
    images: img('Denim Jacket', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt007', 'WDJ', ['XS', 'S', 'M', 'L', 'XL'], ['Light Wash', 'Dark Wash'], salePrice(7995, 5995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['sale'], updatedAt: TS,
  },
  {
    id: 'prod_w008', slug: 'women-mock-neck-tee',
    title: 'Softspun Mock-Neck Tee', brand: 'Luxe',
    description: 'Ultra-soft jersey mock-neck top. Fitted silhouette ideal for layering under blazers.',
    categoryIds: ['women', 'women-tops'],
    images: img('Mock Neck Tee', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt008', 'WMT', ['XS', 'S', 'M', 'L', 'XL'], ['Black', 'White', 'Blush', 'Sage'], listPrice(2995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_w009', slug: 'women-straight-trousers',
    title: 'Straight-Leg Trousers', brand: 'Luxe',
    description: 'Mid-rise straight-leg trousers in a polished stretch-wool blend. Concealed zip fly.',
    categoryIds: ['women', 'women-bottoms', 'new-arrivals'],
    images: img('Straight Trousers', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt009', 'WST', ['00', '0', '2', '4', '6', '8', '10', '12'], ['Black', 'Navy', 'Camel'], listPrice(6495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_w010', slug: 'women-midi-skirt',
    title: 'A-Line Midi Skirt', brand: 'Luxe',
    description: 'Flared A-line midi skirt in a fluid crêpe. Invisible side zip and lined for comfort.',
    categoryIds: ['women', 'women-bottoms', 'new-arrivals'],
    images: img('Midi Skirt', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt010', 'WMS', ['XS', 'S', 'M', 'L', 'XL'], ['Black', 'Cream', 'Dusty Rose'], listPrice(4995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_w011', slug: 'women-fleece-hoodie',
    title: 'Cozy Fleece Pullover', brand: 'Luxe',
    description: 'Brushed fleece pullover with kangaroo pocket. Relaxed fit, ribbed cuffs and hem.',
    categoryIds: ['women', 'women-tops', 'sale'],
    images: img('Fleece Pullover', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt011', 'WFP', ['XS', 'S', 'M', 'L', 'XL'], ['Heather Grey', 'Black', 'Blush'], salePrice(5495, 3995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['sale'], updatedAt: TS,
  },
  {
    id: 'prod_w012', slug: 'women-utility-jacket',
    title: 'Cropped Utility Jacket', brand: 'Luxe',
    description: 'Cropped field jacket with cargo pockets and a drawstring hem. Lightweight canvas construction.',
    categoryIds: ['women', 'women-outerwear'],
    images: img('Utility Jacket', 'f5e6e0', '5c3d2e'),
    variants: mkVs('wt012', 'WUJ', ['XS', 'S', 'M', 'L', 'XL'], ['Army Green', 'Khaki', 'Black'], listPrice(9995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },

  // ── MEN ──────────────────────────────────────────────────────────────────────

  {
    id: 'prod_m001', slug: 'men-classic-tee',
    title: 'Classic Crewneck Tee', brand: 'Luxe',
    description: 'Everyday crewneck tee in 100% combed cotton. Slightly relaxed fit with reinforced collar.',
    categoryIds: ['men', 'men-tops', 'new-arrivals'],
    images: img('Classic Tee', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt001', 'MCT', ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['White', 'Black', 'Navy', 'Heather Grey'], listPrice(2495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_m002', slug: 'men-slim-jeans',
    title: 'Slim Fit Jeans', brand: 'Luxe',
    description: 'Modern slim fit in stretch-selvedge denim. Mid-rise with a tapered leg. Machine wash cold.',
    categoryIds: ['men', 'men-bottoms'],
    images: img('Slim Jeans', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt002', 'MSJ', ['28x30', '30x30', '32x30', '32x32', '34x32', '36x32'], ['Light Wash', 'Dark Wash', 'Black'], listPrice(6995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_m003', slug: 'men-oxford-shirt',
    title: 'Oxford Cloth Button-Down', brand: 'Luxe',
    description: 'Classic OCBD in a fine-weave oxford cotton. Button-down collar, chest pocket, and curved hem.',
    categoryIds: ['men', 'men-tops', 'new-arrivals'],
    images: img('Oxford Shirt', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt003', 'MOS', ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['White', 'Blue', 'Pink'], listPrice(5495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_m004', slug: 'men-vintage-tee',
    title: 'Vintage Soft Tee', brand: 'Luxe',
    description: 'Garment-washed for a broken-in feel. Slightly oversized fit with a raw-edge hem.',
    categoryIds: ['men', 'men-tops'],
    images: img('Vintage Tee', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt004', 'MVT', ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['Washed Black', 'Washed Navy', 'Washed Grey'], listPrice(2995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_m005', slug: 'men-straight-khaki',
    title: 'Straight Fit Khakis', brand: 'Luxe',
    description: 'Versatile straight-leg chino in a wrinkle-resistant cotton blend. Hidden stretch waistband.',
    categoryIds: ['men', 'men-bottoms', 'new-arrivals'],
    images: img('Straight Khaki', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt005', 'MSK', ['28x30', '30x30', '32x30', '32x32', '34x32', '36x32'], ['Khaki', 'Navy', 'Olive'], listPrice(5995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_m006', slug: 'men-fleece-hoodie',
    title: 'Pullover Fleece Hoodie', brand: 'Luxe',
    description: 'Midweight fleece with a cozy hood and kangaroo pocket. Ribbed trim and a relaxed fit.',
    categoryIds: ['men', 'men-tops', 'sale'],
    images: img('Fleece Hoodie', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt006', 'MFH', ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['Heather Grey', 'Navy', 'Black'], salePrice(5995, 4495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['sale'], updatedAt: TS,
  },
  {
    id: 'prod_m007', slug: 'men-denim-jacket',
    title: 'Denim Trucker Jacket', brand: 'Luxe',
    description: 'Classic trucker silhouette in rigid denim. Chest and side pockets, and adjustable side tabs.',
    categoryIds: ['men', 'men-outerwear', 'new-arrivals'],
    images: img('Trucker Jacket', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt007', 'MDJ', ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['Light Wash', 'Dark Wash'], listPrice(8995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_m008', slug: 'men-straight-jeans',
    title: 'Straight Fit Jeans', brand: 'Luxe',
    description: 'A relaxed straight leg from hip to hem. Five-pocket styling in a durable cotton-poly denim.',
    categoryIds: ['men', 'men-bottoms'],
    images: img('Straight Jeans', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt008', 'MStrJ', ['28x30', '30x30', '32x30', '32x32', '34x32', '36x32'], ['Medium Wash', 'Dark Wash'], listPrice(6495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_m009', slug: 'men-polo',
    title: 'Performance Polo', brand: 'Luxe',
    description: 'Moisture-wicking piqué polo with UPF 30+ sun protection. Two-button placket and ribbed collar.',
    categoryIds: ['men', 'men-tops', 'sale'],
    images: img('Performance Polo', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt009', 'MPP', ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['Navy', 'White', 'Red', 'Forest Green'], salePrice(4995, 3495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['sale'], updatedAt: TS,
  },
  {
    id: 'prod_m010', slug: 'men-chino',
    title: 'Slim Fit Chino', brand: 'Luxe',
    description: 'Slim-leg chino in a lightweight cotton-stretch twill. Clean front and signature back pocket.',
    categoryIds: ['men', 'men-bottoms'],
    images: img('Slim Chino', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt010', 'MSC', ['28x30', '30x30', '32x30', '32x32', '34x32', '36x32'], ['Khaki', 'Navy', 'Olive', 'Black'], listPrice(5995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_m011', slug: 'men-sherpa-jacket',
    title: 'Sherpa-Lined Trucker Jacket', brand: 'Luxe',
    description: 'Denim trucker with a plush sherpa lining for warmth. Button-front with chest and side pockets.',
    categoryIds: ['men', 'men-outerwear'],
    images: img('Sherpa Jacket', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt011', 'MSherp', ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['Denim', 'Brown'], listPrice(11995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_m012', slug: 'men-coaches-jacket',
    title: 'Coaches Jacket', brand: 'Luxe',
    description: 'Lightweight nylon coaches jacket with a full-zip front and elastic cuffs. Packable into the chest pocket.',
    categoryIds: ['men', 'men-outerwear', 'sale', 'new-arrivals'],
    images: img('Coaches Jacket', 'c4d5e8', '1a2a4a'),
    variants: mkVs('mt012', 'MCJ', ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Navy', 'Forest Green'], salePrice(7995, 5995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['sale', 'new-arrivals'], updatedAt: TS,
  },

  // ── KIDS ─────────────────────────────────────────────────────────────────────

  {
    id: 'prod_k001', slug: 'boys-graphic-tee',
    title: "Boys' Graphic Tee", brand: 'Luxe',
    description: 'Soft cotton jersey tee with a bold screen-print graphic. Easy pull-on styling.',
    categoryIds: ['kids', 'kids-boys', 'new-arrivals'],
    images: img('Boys Graphic Tee', 'd4e8c4', '1a4a1a'),
    variants: mkVs('kt001', 'KBT', ['XS', 'S', 'M', 'L', 'XL'], ['Blue', 'Red', 'Black'], listPrice(1995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_k002', slug: 'boys-joggers',
    title: "Boys' Pull-On Joggers", brand: 'Luxe',
    description: 'Cozy fleece joggers with an elastic waistband and rib-knit cuffs. Side pockets.',
    categoryIds: ['kids', 'kids-boys'],
    images: img('Boys Joggers', 'd4e8c4', '1a4a1a'),
    variants: mkVs('kt002', 'KBJ', ['XS', 'S', 'M', 'L', 'XL'], ['Black', 'Navy', 'Heather Grey'], listPrice(2495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_k003', slug: 'boys-denim-jacket',
    title: "Boys' Denim Jacket", brand: 'Luxe',
    description: 'Mini-me trucker jacket in rigid denim. Button front, chest pockets, and adjustable side tabs.',
    categoryIds: ['kids', 'kids-boys', 'sale'],
    images: img('Boys Denim Jacket', 'd4e8c4', '1a4a1a'),
    variants: mkVs('kt003', 'KBDJ', ['XS', 'S', 'M', 'L', 'XL'], ['Light Wash'], salePrice(4495, 3495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['sale'], updatedAt: TS,
  },
  {
    id: 'prod_k004', slug: 'girls-floral-dress',
    title: "Girls' Floral Smocked Dress", brand: 'Luxe',
    description: 'Woven floral dress with an elasticized smocked bodice. Tiered skirt and flutter sleeves.',
    categoryIds: ['kids', 'kids-girls', 'new-arrivals'],
    images: img('Girls Floral Dress', 'd4e8c4', '1a4a1a'),
    variants: mkVs('kt004', 'KGD', ['XS', 'S', 'M', 'L', 'XL'], ['Floral Pink', 'Floral Blue'], listPrice(2995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_k005', slug: 'girls-zip-hoodie',
    title: "Girls' Zip-Up Hoodie", brand: 'Luxe',
    description: 'Soft French-terry hoodie with a full-zip front. Kangaroo pocket and cozy hood.',
    categoryIds: ['kids', 'kids-girls', 'sale'],
    images: img('Girls Zip Hoodie', 'd4e8c4', '1a4a1a'),
    variants: mkVs('kt005', 'KGZH', ['XS', 'S', 'M', 'L', 'XL'], ['Lavender', 'Pink', 'Teal'], salePrice(3495, 2495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['sale'], updatedAt: TS,
  },
  {
    id: 'prod_k006', slug: 'girls-wide-pants',
    title: "Girls' Wide-Leg Pants", brand: 'Luxe',
    description: 'Pull-on wide-leg pants in a soft jersey. Elasticized waistband for an easy fit.',
    categoryIds: ['kids', 'kids-girls'],
    images: img('Girls Wide Pants', 'd4e8c4', '1a4a1a'),
    variants: mkVs('kt006', 'KGWP', ['XS', 'S', 'M', 'L', 'XL'], ['Black', 'Pink', 'Cream'], listPrice(2995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
  {
    id: 'prod_k007', slug: 'baby-bodysuit-set',
    title: 'Baby Organic Bodysuit 3-Pack', brand: 'Luxe',
    description: 'GOTS-certified organic cotton bodysuits. Snap-close leg and envelope neckline for easy dressing.',
    categoryIds: ['kids', 'kids-baby', 'new-arrivals'],
    images: img('Baby Bodysuit Set', 'd4e8c4', '1a4a1a'),
    variants: mkVs('kt007', 'KBBS', ['0-3M', '3-6M', '6-12M', '12-18M', '18-24M'], ['White', 'Pastel Mix'], listPrice(2995)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: ['new-arrivals'], updatedAt: TS,
  },
  {
    id: 'prod_k008', slug: 'baby-footed-pajamas',
    title: 'Baby Zip-Up Footed Pajamas', brand: 'Luxe',
    description: 'Soft fleece footed pajamas with a two-way zipper and snug fit for safe sleep.',
    categoryIds: ['kids', 'kids-baby'],
    images: img('Baby Pajamas', 'd4e8c4', '1a4a1a'),
    variants: mkVs('kt008', 'KBFP', ['0-3M', '3-6M', '6-12M', '12-18M', '18-24M'], ['Blue Stars', 'Pink Hearts', 'Mint'], listPrice(2495)),
    get defaultVariantId() { return this.variants[0].id; },
    tags: [], updatedAt: TS,
  },
];
