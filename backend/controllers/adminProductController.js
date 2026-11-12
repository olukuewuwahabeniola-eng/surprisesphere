import { isDbConnected } from '../config/db.js';
import {
  createProduct,
  deleteProduct,
  getAdminProductByIdOrSlug,
  listAdminProducts,
  updateProduct,
} from '../services/productService.js';
import { AppError } from '../utils/AppError.js';

function assertMongoForAdminWrite() {
  if (!isDbConnected()) {
    throw new AppError(
      'MongoDB must be connected to manage products. Start MongoDB and set MONGO_URI, then try again.',
      503,
    );
  }
}

function stripSecrets(body = {}) {
  const next = { ...body };
  delete next.adminKey;
  return next;
}

export async function listAdminProductsHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await listAdminProducts(req.query || {});
  res.json({
    title: 'Admin products',
    description: 'All catalogue products, including inactive items.',
    ...result,
  });
}

export async function getAdminProductHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await getAdminProductByIdOrSlug(req.params.idOrSlug);
  res.json(result);
}

export async function createAdminProductHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await createProduct(stripSecrets(req.body || {}));
  res.status(201).json({
    message: 'Product created.',
    ...result,
  });
}

export async function updateAdminProductHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await updateProduct(req.params.idOrSlug, stripSecrets(req.body || {}));
  res.json({
    message: 'Product updated.',
    ...result,
  });
}

export async function deleteAdminProductHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await deleteProduct(req.params.idOrSlug);
  res.json(result);
}
