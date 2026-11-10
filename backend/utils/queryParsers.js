import mongoose from 'mongoose';
import { AppError } from './AppError.js';

const SORT_MAP = {
  newest: { listedAt: -1, createdAt: -1 },
  'price-asc': { price: 1, listedAt: -1 },
  'price-desc': { price: -1, listedAt: -1 },
};

export function parseProductQuery(query = {}) {
  const sortKey = String(query.sort || 'newest').toLowerCase();
  if (!SORT_MAP[sortKey]) {
    throw new AppError('Sort must be newest, price-asc or price-desc.', 400);
  }

  const filters = {
    active: true,
  };

  if (query.category) {
    filters.categorySlug = String(query.category).trim().toLowerCase();
  }

  if (query.minPrice !== undefined && query.minPrice !== '') {
    const minPrice = Number(query.minPrice);
    if (!Number.isFinite(minPrice) || minPrice < 0) {
      throw new AppError('minPrice must be a number that is 0 or greater.', 400);
    }
    filters.price = { ...(filters.price || {}), $gte: minPrice };
  }

  if (query.maxPrice !== undefined && query.maxPrice !== '') {
    const maxPrice = Number(query.maxPrice);
    if (!Number.isFinite(maxPrice) || maxPrice < 0) {
      throw new AppError('maxPrice must be a number that is 0 or greater.', 400);
    }
    filters.price = { ...(filters.price || {}), $lte: maxPrice };
  }

  if (query.size) {
    filters.sizes = String(query.size).trim();
  }

  if (query.colour || query.color) {
    filters.colours = String(query.colour || query.color).trim();
  }

  if (query.q) {
    const term = String(query.q).trim();
    if (term.length < 2) {
      throw new AppError('Search text must be at least 2 characters.', 400);
    }
    if (term.length > 80) {
      throw new AppError('Search text is too long.', 400);
    }
    filters.$or = [
      { name: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { categoryLabel: { $regex: term, $options: 'i' } },
      { slug: { $regex: term, $options: 'i' } },
    ];
  }

  if (query.bestSeller === 'true' || query.bestSeller === true) {
    filters.bestSeller = true;
  }

  if (query.newArrival === 'true' || query.newArrival === true) {
    filters.newArrival = true;
  }

  if (query.featured === 'true' || query.featured === true) {
    filters.featured = true;
  }

  return {
    filters,
    sort: SORT_MAP[sortKey],
    sortKey,
  };
}

export function assertObjectId(id, label = 'id') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`That ${label} is not valid.`, 400);
  }
}
