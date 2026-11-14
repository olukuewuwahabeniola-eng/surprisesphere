import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import {
  parseAdminCategoryQuery,
  sanitizeCategoryCreateInput,
  sanitizeCategoryReorderInput,
  sanitizeCategoryUpdateInput,
} from '../utils/categoryPayload.js';
import { buildPagination, readPagination } from '../utils/pagination.js';
import { mapCategory } from '../utils/productMapper.js';
import { requireDb } from '../utils/requireDb.js';
import { uniqueSlug } from '../utils/slugify.js';

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

async function findCategoryDocByIdOrSlug(idOrSlug) {
  const value = String(idOrSlug || '').trim();
  if (!value) {
    throw new AppError('Category id or slug is required.', 400);
  }

  let doc = null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    doc = await Category.findById(value);
  }
  if (!doc) {
    doc = await Category.findOne({ slug: value.toLowerCase() });
  }
  if (!doc) {
    throw new AppError('That category was not found.', 404);
  }
  return doc;
}

async function assertUniqueCategoryName(name, excludeId) {
  const query = { name: new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await Category.findOne(query).lean();
  if (existing) {
    throw new AppError('A category with that name already exists.', 409);
  }
}

async function withProductCount(doc) {
  const productCount = await Product.countDocuments({ category: doc._id });
  return mapCategory({ ...doc, productCount });
}

export async function listAdminCategories(rawQuery = {}) {
  requireDb();

  const { page, pageSize, skip } = readPagination(rawQuery);
  const { filters, sort, sortKey } = parseAdminCategoryQuery(rawQuery);

  const [total, docs, publishedCount, hiddenCount] = await Promise.all([
    Category.countDocuments(filters),
    Category.find(filters).sort(sort).skip(skip).limit(pageSize).lean(),
    Category.countDocuments({ active: true }),
    Category.countDocuments({ active: false }),
  ]);

  const productCounts = await Promise.all(
    docs.map((doc) => Product.countDocuments({ category: doc._id })),
  );

  return {
    categories: docs.map((doc, index) =>
      mapCategory({ ...doc, productCount: productCounts[index] }),
    ),
    pagination: buildPagination({ page, pageSize, total }),
    counts: {
      total: publishedCount + hiddenCount,
      published: publishedCount,
      hidden: hiddenCount,
    },
    filters: {
      ...rawQuery,
      sort: sortKey,
      page,
      pageSize,
    },
    source: 'mongodb',
  };
}

export async function getAdminCategoryByIdOrSlug(idOrSlug) {
  requireDb();
  const doc = await findCategoryDocByIdOrSlug(idOrSlug);
  return {
    category: await withProductCount(doc.toObject()),
    source: 'mongodb',
  };
}

export async function createCategory(rawBody = {}) {
  requireDb();

  const input = sanitizeCategoryCreateInput(rawBody);
  await assertUniqueCategoryName(input.name);

  const slug = await uniqueSlug(Category, input.slug || input.name);

  const category = await Category.create({
    name: input.name,
    slug,
    description: input.description,
    image: input.image,
    group: input.group,
    featured: input.featured,
    active: input.active,
    sortOrder: input.sortOrder,
  });

  return {
    category: await withProductCount(category.toObject()),
    source: 'mongodb',
  };
}

export async function updateCategory(idOrSlug, rawBody = {}) {
  requireDb();

  const category = await findCategoryDocByIdOrSlug(idOrSlug);
  const patch = sanitizeCategoryUpdateInput(rawBody);

  if (patch.name) {
    await assertUniqueCategoryName(patch.name, category._id);
  }

  if (patch.slug) {
    category.slug = await uniqueSlug(Category, patch.slug, category._id);
    delete patch.slug;
  }

  Object.entries(patch).forEach(([key, value]) => {
    category[key] = value;
  });

  await category.save();

  return {
    category: await withProductCount(category.toObject()),
    source: 'mongodb',
  };
}

export async function reorderCategories(rawBody = {}) {
  requireDb();

  const ids = sanitizeCategoryReorderInput(rawBody);
  const objectIds = ids.map((id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(`That category id is not valid: ${id}`, 400);
    }
    return new mongoose.Types.ObjectId(id);
  });

  const existing = await Category.find({ _id: { $in: objectIds } }).select('_id').lean();
  if (existing.length !== objectIds.length) {
    throw new AppError('One or more categories in the reorder list were not found.', 404);
  }

  await Promise.all(
    objectIds.map((id, index) =>
      Category.updateOne({ _id: id }, { $set: { sortOrder: index } }),
    ),
  );

  const docs = await Category.find({ _id: { $in: objectIds } })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  const counts = await Promise.all(
    docs.map((doc) => Product.countDocuments({ category: doc._id })),
  );

  return {
    categories: docs.map((doc, index) => mapCategory({ ...doc, productCount: counts[index] })),
    message: 'Category order updated.',
    source: 'mongodb',
  };
}

export async function deleteCategory(idOrSlug) {
  requireDb();

  const category = await findCategoryDocByIdOrSlug(idOrSlug);
  const productCount = await Product.countDocuments({ category: category._id });

  if (productCount > 0) {
    throw new AppError(
      `This category still has ${productCount} product${productCount === 1 ? '' : 's'}. Reassign or delete those products before deleting the category.`,
      409,
      { productCount, categoryId: String(category._id), categorySlug: category.slug },
    );
  }

  const snapshot = mapCategory({ ...category.toObject(), productCount: 0 });
  await category.deleteOne();

  return {
    category: snapshot,
    message: 'Category deleted.',
    source: 'mongodb',
  };
}
