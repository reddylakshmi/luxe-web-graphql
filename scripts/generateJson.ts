/**
 * One-time script: materialises in-memory TypeScript mock data into flat JSON files.
 * Run: npx tsx scripts/generateJson.ts
 *
 * After running, the JSON files become the canonical data source and the
 * resolver layer reads them at startup.  When the Java REST API is ready,
 * set JAVA_API_URL in .env and the Java repositories will be used instead.
 */
import fs   from 'fs';
import path from 'path';

import { PRODUCTS } from '../src/data/products';

// ── Users ─────────────────────────────────────────────────────────────────────

const USERS = [
  {
    id: 'user_001',
    email: 'sarah.johnson@example.com',
    passwordHash: 'Luxe2024!',           // plain-text for mock only
    firstName: 'Sarah',
    lastName: 'Johnson',
    tier: 'Gold',
    points: 2450,
    phone: '+1 (415) 555-0182',
    address: { line1: '1234 Pacific Heights Blvd', city: 'San Francisco', state: 'CA', zip: '94115', country: 'US' },
    orders: [
      { id: 'LX-204891', date: '2026-04-18', status: 'Delivered', totalCents: 18900, itemCount: 2,
        items: ['Essential Crewneck Tee', 'Slim Fit Straight Jeans'] },
      { id: 'LX-198234', date: '2026-03-05', status: 'Delivered', totalCents: 24500, itemCount: 3,
        items: ['Floral Midi Wrap Dress', 'Linen-Blend Blazer', 'Ribbed Turtleneck Sweater'] },
      { id: 'LX-187001', date: '2026-01-22', status: 'Delivered', totalCents: 8900, itemCount: 1,
        items: ['A-Line Midi Skirt'] },
    ],
    createdAt: '2023-08-15T10:30:00Z',
  },
  {
    id: 'user_002',
    email: 'james.chen@example.com',
    passwordHash: 'ShopLuxe1!',
    firstName: 'James',
    lastName: 'Chen',
    tier: 'Silver',
    points: 890,
    phone: '+1 (212) 555-0134',
    address: { line1: '56 West 77th Street, Apt 8B', city: 'New York', state: 'NY', zip: '10024', country: 'US' },
    orders: [
      { id: 'LX-206112', date: '2026-04-27', status: 'Shipped', totalCents: 14500, itemCount: 2,
        items: ['Oxford Cloth Button-Down', 'Slim Fit Chino'] },
      { id: 'LX-201334', date: '2026-02-14', status: 'Delivered', totalCents: 9800, itemCount: 1,
        items: ['Denim Trucker Jacket'] },
    ],
    createdAt: '2024-01-22T14:45:00Z',
  },
  {
    id: 'user_003',
    email: 'emma.davis@example.com',
    passwordHash: 'Fashion23!',
    firstName: 'Emma',
    lastName: 'Davis',
    tier: 'Platinum',
    points: 8200,
    phone: '+1 (312) 555-0267',
    address: { line1: '890 N Michigan Ave, Suite 400', city: 'Chicago', state: 'IL', zip: '60611', country: 'US' },
    orders: [
      { id: 'LX-206980', date: '2026-04-30', status: 'Processing', totalCents: 38600, itemCount: 4,
        items: ['Floral Midi Wrap Dress', 'Linen-Blend Blazer', 'Essential Crewneck Tee', 'A-Line Midi Skirt'] },
      { id: 'LX-204501', date: '2026-04-12', status: 'Delivered', totalCents: 21200, itemCount: 2,
        items: ['Cropped Utility Jacket', 'Slim Fit Jeans'] },
      { id: 'LX-199887', date: '2026-03-18', status: 'Delivered', totalCents: 16400, itemCount: 3,
        items: ['Vintage Soft Tee', 'Ribbed Turtleneck Sweater', 'A-Line Midi Skirt'] },
    ],
    createdAt: '2022-11-08T09:15:00Z',
  },
  {
    id: 'user_004',
    email: 'michael.torres@example.com',
    passwordHash: 'MensFashion1!',
    firstName: 'Michael',
    lastName: 'Torres',
    tier: 'Bronze',
    points: 220,
    phone: '+1 (310) 555-0398',
    address: { line1: '4521 Sunset Blvd, Unit 12', city: 'Los Angeles', state: 'CA', zip: '90027', country: 'US' },
    orders: [
      { id: 'LX-205670', date: '2026-04-21', status: 'Delivered', totalCents: 9500, itemCount: 1,
        items: ['Performance Polo'] },
    ],
    createdAt: '2025-10-05T16:20:00Z',
  },
];

// ── Promo codes ───────────────────────────────────────────────────────────────

const PROMOS = [
  { code: 'SAVE10',   type: 'percentage', value: 10,   description: '10% off your order' },
  { code: 'LUXE20',   type: 'percentage', value: 20,   description: '20% off your order' },
  { code: 'WELCOME',  type: 'fixed',      value: 1500, description: '$15 off first order' },
  { code: 'FREESHIP', type: 'shipping',   value: 0,    description: 'Free shipping' },
];

// ── Write files ───────────────────────────────────────────────────────────────

const OUT = path.resolve(__dirname, '../data');

// JSON.stringify triggers object-literal getters (like defaultVariantId)
fs.writeFileSync(path.join(OUT, 'products.json'), JSON.stringify(PRODUCTS, null, 2));
fs.writeFileSync(path.join(OUT, 'users.json'),    JSON.stringify(USERS, null, 2));
fs.writeFileSync(path.join(OUT, 'promos.json'),   JSON.stringify(PROMOS, null, 2));

console.log(`✓ products.json  (${PRODUCTS.length} products)`);
console.log(`✓ users.json     (${USERS.length} users)`);
console.log(`✓ promos.json    (${PROMOS.length} promo codes)`);
