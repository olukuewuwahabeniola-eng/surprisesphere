/**
 * Temporary offline fallback so the existing frontend keeps working
 * when MongoDB is not connected. Public responses set source: 'seed'.
 * Prefer MongoDB once MONGO_URI is connected and data is seeded.
 */
import {
  getAllProducts,
  getBestSellers,
  getFeaturedProducts,
  getHomepageCatalog,
  getNewArrivals,
  getProductByIdOrSlug,
  getProductsByCategory,
  listCategories,
} from '../utils/catalog.js';
import { AppError } from '../utils/AppError.js';

function withSeed(payload) {
  return {
    ...payload,
    source: 'seed',
    notice:
      'Serving temporary seed data because MongoDB is not connected. Run the backend seed after MongoDB is available.',
  };
}

export function seedListBestSellers(query) {
  const result = getBestSellers(query);
  return withSeed({
    title: 'Best Sellers',
    description: 'Every active product marked as a Best Seller across the store.',
    filters: query,
    ...result,
  });
}

export function seedListNewArrivals(query) {
  const result = getNewArrivals(query);
  return withSeed({
    title: 'New Arrivals',
    description: 'Every active product classified as a New Arrival across the store.',
    filters: query,
    ...result,
  });
}

export function seedListShop(query) {
  const result = getAllProducts(query);
  return withSeed({
    title: 'Shop',
    description: 'Browse every active piece currently listed in the shop.',
    filters: query,
    ...result,
  });
}

export function seedListFeatured(query) {
  const result = getFeaturedProducts(query);
  return withSeed({
    title: 'Featured',
    description: 'Featured products across the store.',
    filters: query,
    ...result,
  });
}

export function seedListCategory(slug, query) {
  const result = getProductsByCategory(slug, query);
  if (!result) {
    throw new AppError('That category is not part of the shop yet.', 404);
  }
  return withSeed({
    title: result.category.name,
    description: result.category.description,
    category: result.category,
    filters: query,
    products: result.products,
    pagination: result.pagination,
  });
}

export function seedListCategories() {
  return withSeed({
    categories: listCategories().map((category) => ({
      id: category.slug,
      slug: category.slug,
      name: category.name,
      description: category.description,
      group: category.group,
      featured: false,
      active: true,
      image: '',
      alt: category.name,
    })),
  });
}

export function seedGetHomepage() {
  return withSeed(getHomepageCatalog());
}

export function seedGetProduct(idOrSlug) {
  const product = getProductByIdOrSlug(idOrSlug);
  if (!product) {
    throw new AppError('That product was not found.', 404);
  }
  return withSeed({ product });
}
