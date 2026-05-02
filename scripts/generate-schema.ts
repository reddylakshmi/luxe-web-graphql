/**
 * Extracts the SDL string from src/schema.ts and writes schema.graphql.
 * Run: npx tsx scripts/generate-schema.ts
 * Called automatically by `npm run docs` via the predocs hook.
 */
import { typeDefs } from '../src/schema';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const out = resolve(__dirname, '../schema.graphql');
writeFileSync(out, typeDefs.trim() + '\n');
console.log(`[generate-schema] Written ${out}`);
