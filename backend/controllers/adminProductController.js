import {
  createProduct,
  createProductsBulk,
  deleteProduct,
  getAdminProductByIdOrSlug,
  listAdminProducts,
  updateProduct,
} from '../services/productService.js';
import { assertMongoReady } from '../utils/assertMongo.js';
import { AppError } from '../utils/AppError.js';

function stripSecrets(body = {}) {
  const next = { ...body };
  delete next.adminKey;
  return next;
}

export async function listAdminProductsHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage products. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await listAdminProducts(req.query || {});
  res.json({
    title: 'Admin products',
    description: 'All catalogue products, including inactive items.',
    ...result,
  });
}

export async function getAdminProductHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage products. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await getAdminProductByIdOrSlug(req.params.idOrSlug);
  res.json(result);
}

export async function createAdminProductHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage products. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await createProduct(stripSecrets(req.body || {}));
  res.status(201).json({
    message: 'Product created.',
    ...result,
  });
}

export async function createAdminProductsBulkHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage products. Start MongoDB and set MONGO_URI, then try again.',
  );
  const body = stripSecrets(req.body || {});
  const items = Array.isArray(body.products)
    ? body.products
    : Array.isArray(body.items)
      ? body.items
      : Array.isArray(body)
        ? body
        : null;

  if (!items) {
    throw new AppError('Send a products array for bulk upload.', 400);
  }

  const result = await createProductsBulk(items);
  const status = result.summary.created > 0 ? 201 : 400;
  res.status(status).json({
    message:
      result.summary.failed === 0
        ? `Created ${result.summary.created} product${result.summary.created === 1 ? '' : 's'}.`
        : `Created ${result.summary.created} of ${result.summary.total}. ${result.summary.failed} failed.`,
    ...result,
  });
}

export async function updateAdminProductHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage products. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await updateProduct(req.params.idOrSlug, stripSecrets(req.body || {}));
  res.json({
    message: 'Product updated.',
    ...result,
  });
}

export async function deleteAdminProductHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage products. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await deleteProduct(req.params.idOrSlug);
  res.json(result);
}
