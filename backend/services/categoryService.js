import mongoose from 'mongoose';
import Category from '../models/Category.js';
import { AppError } from '../utils/AppError.js';
import { mapCategory } from '../utils/productMapper.js';
import { requireDb } from '../utils/requireDb.js';

export async function listActiveCategories({ featuredOnly = false } = {}) {
  requireDb();

  const filters = { active: true };
  if (featuredOnly) {
    filters.featured = true;
  }

  const docs = await Category.find(filters).sort({ sortOrder: 1, name: 1 }).lean();
  return {
    categories: docs.map(mapCategory),
    source: 'mongodb',
  };
}

export async function getCategoryByIdOrSlug(idOrSlug) {
  requireDb();

  const value = String(idOrSlug || '').trim();
  if (!value) {
    throw new AppError('Category id or slug is required.', 400);
  }

  let doc = null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    doc = await Category.findOne({ _id: value, active: true }).lean();
  }
  if (!doc) {
    doc = await Category.findOne({ slug: value.toLowerCase(), active: true }).lean();
  }
  if (!doc) {
    throw new AppError('That category was not found.', 404);
  }

  return {
    category: mapCategory(doc),
    source: 'mongodb',
  };
}

export async function validateCategoryDocument(payload) {
  requireDb();
  const category = new Category(payload);
  await category.validate();
  return category;
}
