import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { buildPagination, readPagination } from '../utils/pagination.js';
import { mapProduct } from '../utils/productMapper.js';
import { assertObjectId, parseProductQuery } from '../utils/queryParsers.js';
import { requireDb } from '../utils/requireDb.js';

const FOOTWEAR_SLUGS = ['shoes', 'sneakers', 'slides', 'heels'];

async function resolveCategorySlugs(slug) {
  if (!slug) {
    return null;
  }

  const category = await Category.findOne({ slug, active: true }).lean();
  if (!category) {
    return null;
  }

  if (slug === 'shoes') {
    return {
      category,
      slugs: FOOTWEAR_SLUGS,
    };
  }

  if (slug === 'headwear') {
    return {
      category,
      slugs: ['berets', 'turbans'],
    };
  }

  return {
    category,
    slugs: [slug],
  };
}

export async function listProducts(rawQuery = {}, extraFilters = {}) {
  requireDb();

  const { page, pageSize, skip } = readPagination(rawQuery);
  const { filters, sort, sortKey } = parseProductQuery(rawQuery);

  const mongoFilters = {
    ...filters,
    ...extraFilters,
  };

  const [total, docs] = await Promise.all([
    Product.countDocuments(mongoFilters),
    Product.find(mongoFilters)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .populate('category', 'name slug')
      .lean(),
  ]);

  return {
    products: docs.map(mapProduct),
    pagination: buildPagination({ page, pageSize, total }),
    filters: {
      ...rawQuery,
      sort: sortKey,
      page,
      pageSize,
    },
    source: 'mongodb',
  };
}

export async function listBestSellers(rawQuery = {}) {
  return listProducts(rawQuery, { bestSeller: true, active: true });
}

export async function listNewArrivals(rawQuery = {}) {
  return listProducts(rawQuery, { newArrival: true, active: true });
}

export async function listFeaturedProducts(rawQuery = {}) {
  return listProducts(rawQuery, { featured: true, active: true });
}

export async function listProductsByCategorySlug(slug, rawQuery = {}) {
  requireDb();

  const resolved = await resolveCategorySlugs(slug);
  if (!resolved) {
    throw new AppError('That category is not part of the shop yet.', 404);
  }

  const query = { ...rawQuery };
  delete query.category;

  const result = await listProducts(query, {
    active: true,
    categorySlug: { $in: resolved.slugs },
  });

  return {
    ...result,
    category: {
      id: String(resolved.category._id),
      slug: resolved.category.slug,
      name: resolved.category.name,
      description: resolved.category.description || '',
      group: resolved.category.group || '',
      featured: Boolean(resolved.category.featured),
      image: resolved.category.image?.url || '',
      alt: resolved.category.image?.alt || resolved.category.name,
    },
  };
}

export async function getProductByIdOrSlug(idOrSlug) {
  requireDb();

  const value = String(idOrSlug || '').trim();
  if (!value) {
    throw new AppError('Product id or slug is required.', 400);
  }

  let doc = null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    doc = await Product.findOne({ _id: value, active: true })
      .populate('category', 'name slug description image')
      .lean();
  }

  if (!doc) {
    doc = await Product.findOne({ slug: value.toLowerCase(), active: true })
      .populate('category', 'name slug description image')
      .lean();
  }

  if (!doc) {
    throw new AppError('That product was not found.', 404);
  }

  return {
    product: mapProduct(doc),
    source: 'mongodb',
  };
}

export async function getCuratedProducts({ bestSeller, newArrival, featured, limit }) {
  requireDb();

  const filters = { active: true };
  if (bestSeller) filters.bestSeller = true;
  if (newArrival) filters.newArrival = true;
  if (featured) filters.featured = true;

  const docs = await Product.find(filters)
    .sort({ listedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return docs.map(mapProduct);
}

export async function validateProductDocument(payload) {
  requireDb();
  assertObjectId(payload.category, 'category');

  const category = await Category.findById(payload.category);
  if (!category || !category.active) {
    throw new AppError('Choose an active category for this product.', 400);
  }

  const product = new Product({
    ...payload,
    category: category._id,
    categorySlug: category.slug,
    categoryLabel: category.name,
  });

  await product.validate();
  return product;
}
