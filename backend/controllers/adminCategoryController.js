import {
  createCategory,
  deleteCategory,
  getAdminCategoryByIdOrSlug,
  listAdminCategories,
  reorderCategories,
  updateCategory,
} from '../services/categoryService.js';
import { assertMongoReady } from '../utils/assertMongo.js';

function stripSecrets(body = {}) {
  const next = { ...body };
  delete next.adminKey;
  return next;
}

export async function listAdminCategoriesHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage categories. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await listAdminCategories(req.query || {});
  res.json({
    title: 'Admin categories',
    description: 'All shop categories, including inactive items.',
    ...result,
  });
}

export async function getAdminCategoryHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage categories. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await getAdminCategoryByIdOrSlug(req.params.idOrSlug);
  res.json(result);
}

export async function createAdminCategoryHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage categories. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await createCategory(stripSecrets(req.body || {}));
  res.status(201).json({
    message: 'Category created.',
    ...result,
  });
}

export async function updateAdminCategoryHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage categories. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await updateCategory(req.params.idOrSlug, stripSecrets(req.body || {}));
  res.json({
    message: 'Category updated.',
    ...result,
  });
}

export async function reorderAdminCategoriesHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage categories. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await reorderCategories(stripSecrets(req.body || {}));
  res.json(result);
}

export async function deleteAdminCategoryHandler(req, res) {
  await assertMongoReady(
    'MongoDB must be connected to manage categories. Start MongoDB and set MONGO_URI, then try again.',
  );
  const result = await deleteCategory(req.params.idOrSlug);
  res.json(result);
}
