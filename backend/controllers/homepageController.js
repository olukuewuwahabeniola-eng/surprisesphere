import { dbState, ensureConnected, isDbConnected } from '../config/db.js';
import { getHomepageBanners, getHomepagePayload } from '../services/homepageService.js';
import { listFeaturedProducts } from '../services/productService.js';
import { listActiveCategories } from '../services/categoryService.js';
import { seedGetHomepage, seedListFeatured } from '../services/seedFallback.js';
import { getStoreSettings } from '../services/storeService.js';

async function dbReadyForRead() {
  if (isDbConnected()) return true;
  return ensureConnected({ retries: 2, waitMs: 500 });
}

export async function getHomepage(req, res) {
  if (!(await dbReadyForRead())) {
    const store = await getStoreSettings();
    res.json({ ...seedGetHomepage(), store });
    return;
  }
  const payload = await getHomepagePayload();
  res.json(payload);
}

export async function getBanners(req, res) {
  if (!(await dbReadyForRead())) {
    const seed = seedGetHomepage();
    res.json({
      announcement: seed.announcement,
      heroSlides: seed.heroSlides,
      promos: seed.promos,
      source: 'seed',
      notice: seed.notice,
    });
    return;
  }
  const payload = await getHomepageBanners();
  res.json(payload);
}

export async function getFeaturedHomepageProducts(req, res) {
  if (!(await dbReadyForRead())) {
    res.json(seedListFeatured({ page: 1, pageSize: 5, sort: 'newest' }));
    return;
  }
  const result = await listFeaturedProducts({
    page: 1,
    pageSize: Number(req.query.limit) || 5,
    sort: 'newest',
  });
  res.json(result);
}

export async function getFeaturedHomepageCategories(req, res) {
  if (!(await dbReadyForRead())) {
    const seed = seedGetHomepage();
    res.json({
      categories: seed.categories,
      source: 'seed',
      notice: seed.notice,
    });
    return;
  }
  // Keep public category endpoints aligned with admin: every active category is available.
  const result = await listActiveCategories();
  res.json(result);
}

export function getHealth(req, res) {
  res.json({
    ok: true,
    service: 'surprise-fashion-sphere-api',
    database: dbState.status,
    databaseConnected: isDbConnected(),
    databaseError: dbState.lastError || undefined,
    databaseLastConnectedAt: dbState.lastConnectedAt || undefined,
    databaseReconnectAttempts: dbState.reconnectAttempts || 0,
    mongoUriConfigured: Boolean(process.env.MONGO_URI || process.env.MONGODB_URI),
  });
}
