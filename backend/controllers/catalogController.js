import {
  getAllProducts,
  getBestSellers,
  getCategory,
  getNewArrivals,
  getProductsByCategory,
  listCategories,
} from '../utils/catalog.js';

function readQuery(req) {
  return {
    category: req.query.category || '',
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    size: req.query.size || '',
    colour: req.query.colour || '',
    sort: req.query.sort || 'newest',
    page: req.query.page,
    pageSize: req.query.pageSize,
  };
}

export function getCategories(req, res) {
  res.json({ categories: listCategories() });
}

export function getShopProducts(req, res) {
  const query = readQuery(req);
  const result = getAllProducts(query);
  res.json({
    title: 'Shop',
    description: 'Browse every active piece currently listed in the shop.',
    filters: query,
    ...result,
  });
}

export function getBestSellerCollection(req, res) {
  const query = readQuery(req);
  const result = getBestSellers(query);
  res.json({
    title: 'Best Sellers',
    description: 'Every active product marked as a Best Seller across the store.',
    filters: query,
    ...result,
  });
}

export function getNewArrivalCollection(req, res) {
  const query = readQuery(req);
  const result = getNewArrivals(query);
  res.json({
    title: 'New Arrivals',
    description: 'Every active product classified as a New Arrival across the store.',
    filters: query,
    ...result,
  });
}

export function getCategoryCollection(req, res) {
  const slug = String(req.params.slug || '').toLowerCase();
  const category = getCategory(slug);

  if (!category) {
    res.status(404).json({ message: 'That category is not part of the shop yet.' });
    return;
  }

  const query = readQuery(req);
  const result = getProductsByCategory(slug, query);

  res.json({
    title: result.category.name,
    description: result.category.description,
    category: result.category,
    filters: query,
    products: result.products,
    pagination: result.pagination,
  });
}
