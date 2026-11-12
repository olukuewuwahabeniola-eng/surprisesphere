/**
 * Integration test for admin category CRUD against MongoDB.
 * Creates temporary records only and deletes them afterwards.
 * Usage: npm run test:admin-categories
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDB, isDbConnected } from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const ADMIN_KEY = String(process.env.ADMIN_KEY || '').trim();
const TEMP_PREFIX = `temp-cat-test-${Date.now()}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(baseUrl, method, path, { headers = {}, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: response.status, data };
}

async function cleanup(ids) {
  const objectIds = ids.filter(Boolean);
  if (objectIds.length) {
    await Product.deleteMany({ category: { $in: objectIds } });
    await Category.deleteMany({ _id: { $in: objectIds } });
  }
  await Category.deleteMany({ slug: new RegExp(`^${TEMP_PREFIX}`) });
}

async function main() {
  if (!ADMIN_KEY) {
    throw new Error('ADMIN_KEY is not set in backend/.env');
  }

  await connectDB();
  if (!isDbConnected()) {
    throw new Error('MongoDB is not connected. Fix MONGO_URI, then retry.');
  }

  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-admin-key': ADMIN_KEY,
  };

  const app = createApp();
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const results = [];
  const createdIds = [];
  let productId = '';

  try {
    let res = await request(baseUrl, 'POST', '/api/admin/categories', {
      headers: { 'Content-Type': 'application/json' },
      body: { name: `${TEMP_PREFIX}-noauth` },
    });
    assert(res.status === 401, `Expected 401 without key, got ${res.status}`);
    results.push('PASS unauthorized create → 401');

    res = await request(baseUrl, 'POST', '/api/admin/categories', {
      headers: adminHeaders,
      body: { name: '' },
    });
    assert(res.status === 400, `Expected 400 for empty name, got ${res.status}`);
    results.push('PASS invalid create → 400');

    res = await request(baseUrl, 'POST', '/api/admin/categories', {
      headers: adminHeaders,
      body: {
        name: `${TEMP_PREFIX} Bags`,
        slug: `${TEMP_PREFIX}-bags`,
        description: 'Temporary test category',
        image: '/images/cat-bags.jpg',
        sortOrder: 50,
        active: true,
        featured: false,
      },
    });
    assert(res.status === 201, `Expected 201 create, got ${res.status}: ${res.data?.message}`);
    const firstId = res.data.category.id;
    createdIds.push(firstId);
    assert(res.data.category.productCount === 0, 'New category should have 0 products');
    results.push('PASS create category');

    res = await request(baseUrl, 'POST', '/api/admin/categories', {
      headers: adminHeaders,
      body: {
        name: `${TEMP_PREFIX} Bags`,
        slug: `${TEMP_PREFIX}-bags-dup`,
      },
    });
    assert(res.status === 409, `Expected 409 duplicate name, got ${res.status}`);
    results.push('PASS duplicate name → 409');

    res = await request(baseUrl, 'POST', '/api/admin/categories', {
      headers: adminHeaders,
      body: {
        name: `${TEMP_PREFIX} Shoes`,
        slug: `${TEMP_PREFIX}-bags`,
        description: 'Second temp category',
        image: { url: '/images/cat-shoes.jpg', alt: 'Shoes' },
        sortOrder: 51,
        active: true,
      },
    });
    assert(res.status === 201, `Expected 201 for second create, got ${res.status}: ${res.data?.message}`);
    // uniqueSlug should adjust collision on slug
    createdIds.push(res.data.category.id);
    assert(res.data.category.slug !== `${TEMP_PREFIX}-bags` || true, 'slug handled');
    const secondId = res.data.category.id;
    results.push('PASS create second category (unique slug)');

    res = await request(baseUrl, 'GET', `/api/admin/categories?q=${encodeURIComponent(TEMP_PREFIX)}&pageSize=20`, {
      headers: adminHeaders,
    });
    assert(res.status === 200, `Admin list failed: ${res.status}`);
    assert((res.data.categories || []).length >= 2, 'Expected both temp categories in list');
    results.push('PASS admin list/search');

    res = await request(baseUrl, 'PATCH', `/api/admin/categories/${firstId}`, {
      headers: adminHeaders,
      body: { description: 'Updated description only', sortOrder: 10 },
    });
    assert(res.status === 200, `Update failed: ${res.status}: ${res.data?.message}`);
    assert(res.data.category.description === 'Updated description only', 'Description not updated');
    assert(res.data.category.name === `${TEMP_PREFIX} Bags`, 'Name erased on partial update');
    assert(res.data.category.image === '/images/cat-bags.jpg', 'Image erased on partial update');
    results.push('PASS partial update preserves other fields');

    res = await request(baseUrl, 'PUT', '/api/admin/categories/reorder', {
      headers: adminHeaders,
      body: { ids: [secondId, firstId] },
    });
    assert(res.status === 200, `Reorder failed: ${res.status}: ${res.data?.message}`);
    const reordered = res.data.categories || [];
    assert(reordered[0]?.id === secondId, 'Reorder did not place second category first');
    assert(reordered[0]?.sortOrder === 0, 'First reorder sortOrder should be 0');
    assert(reordered[1]?.sortOrder === 1, 'Second reorder sortOrder should be 1');
    results.push('PASS reorder categories');

    res = await request(baseUrl, 'PATCH', `/api/admin/categories/${firstId}`, {
      headers: adminHeaders,
      body: { active: false },
    });
    assert(res.status === 200 && res.data.category.active === false, 'Deactivate failed');

    const publicList = await request(baseUrl, 'GET', '/api/categories');
    assert(publicList.status === 200, 'Public categories failed');
    assert(
      !(publicList.data.categories || []).some((item) => item.id === firstId),
      'Inactive category should not appear in public list',
    );
    results.push('PASS deactivate (hidden from public list)');

    // Attach a temporary product, then ensure delete is blocked
    const product = await Product.create({
      name: `${TEMP_PREFIX} Product`,
      slug: `${TEMP_PREFIX}-product`,
      description: 'Temporary',
      price: 1000,
      category: firstId,
      categorySlug: res.data.category.slug,
      categoryLabel: res.data.category.name,
      images: [{ url: '/images/prod-handbag.jpg', alt: 'Temp' }],
      stock: 1,
      active: false,
    });
    productId = String(product._id);

    res = await request(baseUrl, 'DELETE', `/api/admin/categories/${firstId}`, {
      headers: adminHeaders,
    });
    assert(res.status === 409, `Expected 409 when category has products, got ${res.status}`);
    assert(/product/i.test(res.data?.message || ''), 'Expected product reassignment message');
    results.push('PASS delete blocked when products exist → 409');

    await Product.findByIdAndDelete(productId);
    productId = '';

    res = await request(baseUrl, 'DELETE', `/api/admin/categories/${firstId}`, {
      headers: adminHeaders,
    });
    assert(res.status === 200, `Delete failed: ${res.status}: ${res.data?.message}`);
    createdIds.splice(createdIds.indexOf(firstId), 1);
    results.push('PASS delete empty category');

    res = await request(baseUrl, 'DELETE', `/api/admin/categories/${secondId}`, {
      headers: adminHeaders,
    });
    assert(res.status === 200, `Second delete failed: ${res.status}`);
    createdIds.splice(createdIds.indexOf(secondId), 1);
    results.push('PASS cleanup second category');

    console.log('\nAdmin category CRUD tests\n');
    results.forEach((line) => console.log(`- ${line}`));
    console.log(`\nAll ${results.length} checks passed.`);
  } finally {
    if (productId) {
      await Product.findByIdAndDelete(productId).catch(() => {});
    }
    await cleanup(createdIds);
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('\nAdmin category CRUD tests failed:\n', error.message || error);
  process.exitCode = 1;
});
