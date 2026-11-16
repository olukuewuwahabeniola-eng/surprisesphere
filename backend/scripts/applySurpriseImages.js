/**
 * Apply the surpjpg / surprise library images to homepage, categories,
 * and placeholder product image URLs only. Never changes prices or names.
 *
 * Usage: node scripts/applySurpriseImages.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import HomepageContent from '../models/HomepageContent.js';
import Product from '../models/Product.js';
import {
  CATEGORY_IMAGE_MAP,
  DEFAULT_HOMEPAGE,
  PRODUCT_PLACEHOLDER_IMAGE_MAP,
} from '../utils/homepageDefaults.js';
import { HOMEPAGE_CURATED_COUNT } from '../utils/pagination.js';

function resolveUri() {
  const raw = process.env.MONGO_URI || process.env.MONGODB_URI || '';
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = '/test';
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

function rewritePlaceholderUrl(url = '') {
  const value = String(url || '');
  if (!value.startsWith('/images/')) return value;
  if (value.startsWith('/images/surprise/')) return value;
  return PRODUCT_PLACEHOLDER_IMAGE_MAP[value] || value;
}

async function main() {
  const uri = resolveUri();
  if (!uri) {
    throw new Error('MONGO_URI is not set.');
  }

  await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 20000 });
  console.log(`Connected to ${mongoose.connection.name}`);

  await HomepageContent.findOneAndUpdate(
    { key: 'main' },
    {
      $set: {
        announcement: DEFAULT_HOMEPAGE.announcement,
        heroSlides: DEFAULT_HOMEPAGE.heroSlides,
        promos: DEFAULT_HOMEPAGE.promos,
      },
      $setOnInsert: {
        curatedBestSellerLimit: HOMEPAGE_CURATED_COUNT,
        curatedNewArrivalLimit: HOMEPAGE_CURATED_COUNT,
      },
    },
    { upsert: true, new: true },
  );
  console.log(`Homepage hero slides: ${DEFAULT_HOMEPAGE.heroSlides.length}`);
  console.log(`Homepage promos: ${DEFAULT_HOMEPAGE.promos.length}`);

  let categoriesUpdated = 0;
  for (const [slug, image] of Object.entries(CATEGORY_IMAGE_MAP)) {
    const result = await Category.updateOne(
      { slug },
      { $set: { 'image.url': image.url, 'image.alt': image.alt } },
    );
    if (result.matchedCount) {
      categoriesUpdated += 1;
      console.log(`Category ${slug} -> ${image.url}`);
    }
  }
  console.log(`Categories updated: ${categoriesUpdated}`);

  const products = await Product.find({}).lean();
  let productsUpdated = 0;
  for (const product of products) {
    const images = Array.isArray(product.images) ? product.images : [];
    let changed = false;
    const nextImages = images.map((entry) => {
      if (typeof entry === 'string') {
        const next = rewritePlaceholderUrl(entry);
        if (next !== entry) changed = true;
        return next;
      }
      if (entry && typeof entry === 'object') {
        const nextUrl = rewritePlaceholderUrl(entry.url || entry.src || '');
        if (nextUrl && nextUrl !== entry.url) {
          changed = true;
          return { ...entry, url: nextUrl };
        }
      }
      return entry;
    });

    const colours = Array.isArray(product.colours) ? product.colours : [];
    const nextColours = colours.map((colour) => {
      const colourImages = Array.isArray(colour.images) ? colour.images : [];
      const mapped = colourImages.map((entry) => {
        if (typeof entry === 'string') {
          const next = rewritePlaceholderUrl(entry);
          if (next !== entry) changed = true;
          return next;
        }
        if (entry && typeof entry === 'object') {
          const nextUrl = rewritePlaceholderUrl(entry.url || entry.src || '');
          if (nextUrl && nextUrl !== entry.url) {
            changed = true;
            return { ...entry, url: nextUrl };
          }
        }
        return entry;
      });
      return { ...colour, images: mapped };
    });

    if (!changed) continue;

    // Image URLs only — never touch price, stock, name, or placement flags.
    await Product.updateOne(
      { _id: product._id },
      { $set: { images: nextImages, colours: nextColours } },
    );
    productsUpdated += 1;
    console.log(`Product placeholder images updated: ${product.name}`);
  }

  console.log(`Products with placeholder images updated: ${productsUpdated}`);
  console.log('Done. Prices and product details were not modified.');
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
