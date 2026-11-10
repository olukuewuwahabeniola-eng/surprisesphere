import mongoose from 'mongoose';
import { isDbConnected } from '../config/db.js';
import {
  getCategoryByIdOrSlug,
  listActiveCategories,
  validateCategoryDocument,
} from '../services/categoryService.js';
import { listProductsByCategorySlug } from '../services/productService.js';
import { seedListCategories, seedListCategory } from '../services/seedFallback.js';
import { AppError } from '../utils/AppError.js';

export async function getCategories(req, res) {
  const featuredOnly = req.query.featured === 'true';

  if (!isDbConnected()) {
    const seed = seedListCategories();
    res.json({
      ...seed,
      categories: featuredOnly
        ? seed.categories.filter((category) => category.featured)
        : seed.categories,
    });
    return;
  }

  const result = await listActiveCategories({ featuredOnly });
  res.json(result);
}

export async function getCategory(req, res) {
  if (!isDbConnected()) {
    const seed = seedListCategory(String(req.params.slugOrId || '').toLowerCase(), {});
    res.json({ category: seed.category, source: 'seed', notice: seed.notice });
    return;
  }

  const result = await getCategoryByIdOrSlug(req.params.slugOrId);
  res.json(result);
}

export async function getCategoryProducts(req, res) {
  const query = {
    category: req.query.category || '',
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    size: req.query.size || '',
    colour: req.query.colour || req.query.color || '',
    sort: req.query.sort || 'newest',
    page: req.query.page,
    pageSize: req.query.pageSize,
    q: req.query.q || '',
  };
  const slug = String(req.params.slugOrId || '').toLowerCase();

  if (!isDbConnected()) {
    res.json(seedListCategory(slug, query));
    return;
  }

  // Allow lookup by id or slug.
  let categorySlug = slug;
  if (mongoose.Types.ObjectId.isValid(slug)) {
    const category = await getCategoryByIdOrSlug(slug);
    categorySlug = category.category.slug;
  }

  const result = await listProductsByCategorySlug(categorySlug, query);
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

export async function validateCategory(req, res) {
  if (!isDbConnected()) {
    throw new AppError('Category validation needs a connected MongoDB database.', 503);
  }
  await validateCategoryDocument(req.body || {});
  res.json({ ok: true, message: 'Category payload is valid.' });
}
