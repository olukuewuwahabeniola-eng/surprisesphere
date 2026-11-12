import { isDbConnected } from '../config/db.js';
import {
  createCategory,
  deleteCategory,
  getAdminCategoryByIdOrSlug,
  listAdminCategories,
  reorderCategories,
  updateCategory,
} from '../services/categoryService.js';
import { AppError } from '../utils/AppError.js';

function assertMongoForAdminWrite() {
  if (!isDbConnected()) {
    throw new AppError(
      'MongoDB must be connected to manage categories. Start MongoDB and set MONGO_URI, then try again.',
      503,
    );
  }
}

function stripSecrets(body = {}) {
  const next = { ...body };
  delete next.adminKey;
  return next;
}

export async function listAdminCategoriesHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await listAdminCategories(req.query || {});
  res.json({
    title: 'Admin categories',
    description: 'All shop categories, including inactive items.',
    ...result,
  });
}

export async function getAdminCategoryHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await getAdminCategoryByIdOrSlug(req.params.idOrSlug);
  res.json(result);
}

export async function createAdminCategoryHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await createCategory(stripSecrets(req.body || {}));
  res.status(201).json({
    message: 'Category created.',
    ...result,
  });
}

export async function updateAdminCategoryHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await updateCategory(req.params.idOrSlug, stripSecrets(req.body || {}));
  res.json({
    message: 'Category updated.',
    ...result,
  });
}

export async function reorderAdminCategoriesHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await reorderCategories(stripSecrets(req.body || {}));
  res.json(result);
}

export async function deleteAdminCategoryHandler(req, res) {
  assertMongoForAdminWrite();
  const result = await deleteCategory(req.params.idOrSlug);
  res.json(result);
}
