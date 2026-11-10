import { isDbConnected } from '../config/db.js';
import {
  getProductByIdOrSlug,
  listBestSellers,
  listFeaturedProducts,
  listNewArrivals,
  listProducts,
  listProductsByCategorySlug,
  validateProductDocument,
} from '../services/productService.js';
import {
  seedGetProduct,
  seedListBestSellers,
  seedListCategory,
  seedListFeatured,
  seedListNewArrivals,
  seedListShop,
} from '../services/seedFallback.js';
import { AppError } from '../utils/AppError.js';

function readQuery(req) {
  return {
    category: req.query.category || '',
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    size: req.query.size || '',
    colour: req.query.colour || req.query.color || '',
    sort: req.query.sort || 'newest',
    page: req.query.page,
    pageSize: req.query.pageSize,
    q: req.query.q || req.query.search || '',
  };
}

export async function getProducts(req, res) {
  const query = readQuery(req);
  if (!isDbConnected()) {
    res.json(seedListShop(query));
    return;
  }
  const result = await listProducts(query);
  res.json({
    title: 'Shop',
    description: 'Browse every active piece currently listed in the shop.',
    ...result,
  });
}

export async function getBestSellers(req, res) {
  const query = readQuery(req);
  if (!isDbConnected()) {
    res.json(seedListBestSellers(query));
    return;
  }
  const result = await listBestSellers(query);
  res.json({
    title: 'Best Sellers',
    description: 'Every active product marked as a Best Seller across the store.',
    ...result,
  });
}

export async function getNewArrivals(req, res) {
  const query = readQuery(req);
  if (!isDbConnected()) {
    res.json(seedListNewArrivals(query));
    return;
  }
  const result = await listNewArrivals(query);
  res.json({
    title: 'New Arrivals',
    description: 'Every active product classified as a New Arrival across the store.',
    ...result,
  });
}

export async function getFeaturedProducts(req, res) {
  const query = readQuery(req);
  if (!isDbConnected()) {
    res.json(seedListFeatured(query));
    return;
  }
  const result = await listFeaturedProducts(query);
  res.json({
    title: 'Featured',
    description: 'Featured products across the store.',
    ...result,
  });
}

export async function getProduct(req, res) {
  if (!isDbConnected()) {
    res.json(seedGetProduct(req.params.idOrSlug));
    return;
  }
  const result = await getProductByIdOrSlug(req.params.idOrSlug);
  res.json(result);
}

export async function getProductsByCategory(req, res) {
  const query = readQuery(req);
  const slug = String(req.params.slug || '').toLowerCase();

  if (!isDbConnected()) {
    res.json(seedListCategory(slug, query));
    return;
  }

  const result = await listProductsByCategorySlug(slug, query);
  res.json({
    title: result.category.name,
    description: result.category.description,
    category: result.category,
    products: result.products,
    pagination: result.pagination,
    filters: result.filters,
    source: result.source,
  });
}

/** Validation-only probe used in tests / future admin create flow. */
export async function validateProduct(req, res) {
  if (!isDbConnected()) {
    throw new AppError('Product validation needs a connected MongoDB database.', 503);
  }
  await validateProductDocument(req.body || {});
  res.json({ ok: true, message: 'Product payload is valid.' });
}
