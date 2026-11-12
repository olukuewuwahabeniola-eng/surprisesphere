/**
 * Integration test for admin product CRUD against a real MongoDB connection.
 * Usage (from backend/): node scripts/testAdminProductCrud.js
 * Requires MONGO_URI and ADMIN_KEY in backend/.env
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDB, isDbConnected } from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const ADMIN_KEY = String(process.env.ADMIN_KEY || '').trim();

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

async function main() {
  if (!ADMIN_KEY) {
    throw new Error('ADMIN_KEY is not set in backend/.env');
  }

  await connectDB();
  if (!isDbConnected()) {
    throw new Error('MongoDB is not connected. Start MongoDB and set MONGO_URI, then retry.');
  }

  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-admin-key': ADMIN_KEY,
  };

  let category = await Category.findOne({ slug: 'bags' });
  if (!category) {
    category = await Category.create({
      name: 'Bags',
      slug: 'bags',
      description: 'Handbags and totes',
      image: { url: '/images/cat-bags.jpg', alt: 'Bags' },
      active: true,
    });
  }

  const app = createApp();
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const results = [];
  let productId = '';

  try {
    let res = await request(baseUrl, 'POST', '/api/admin/products', {
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Nope', price: 1000, category: category._id, images: ['/images/a.jpg'] },
    });
    assert(res.status === 401, `Expected 401 without key, got ${res.status}`);
    results.push('PASS unauthorized create → 401');

    res = await request(baseUrl, 'POST', '/api/admin/products', {
      headers: adminHeaders,
      body: { name: 'Broken', price: -5, category: category._id, images: ['/images/a.jpg'] },
    });
    assert(res.status === 400, `Expected 400 for invalid create, got ${res.status}`);
    results.push('PASS invalid create → 400');

    res = await request(baseUrl, 'POST', '/api/admin/products', {
      headers: adminHeaders,
      body: {
        name: `CRUD Test Bag ${Date.now()}`,
        description: 'Created by admin CRUD test',
        price: 22000,
        category: category._id,
        images: [
          { url: '/images/prod-handbag.jpg', alt: 'Front' },
          { url: '/images/cat-tote.jpg', alt: 'Side' },
        ],
        sizes: ['One Size'],
        colours: [
          { label: 'Tan', price: 22000 },
          { label: 'Black', price: 23500 },
        ],
        variants: [
          { size: 'One Size', colour: 'Tan', price: 22000, stock: 4 },
          { size: 'One Size', colour: 'Black', price: 23500, stock: 2 },
        ],
        stock: 6,
        bestSeller: true,
        newArrival: false,
        featured: true,
        active: true,
      },
    });
    assert(res.status === 201, `Expected 201 create, got ${res.status}: ${res.data?.message}`);
    productId = res.data.product.id;
    assert(res.data.product.images.length === 2, 'Expected 2 images');
    assert(res.data.product.variants.length === 2, 'Expected 2 variants');
    results.push('PASS create product');

    res = await request(baseUrl, 'GET', '/api/admin/products?status=active&bestSeller=true&pageSize=50', {
      headers: adminHeaders,
    });
    assert(res.status === 200, `Admin list failed: ${res.status}`);
    assert((res.data.products || []).some((item) => item.id === productId), 'Admin list missing product');
    results.push('PASS admin list with filters');

    res = await request(baseUrl, 'PATCH', `/api/admin/products/${productId}`, {
      headers: adminHeaders,
      body: { price: 25000, stock: 3 },
    });
    assert(res.status === 200, `Update failed: ${res.status}: ${res.data?.message}`);
    assert(res.data.product.price === 25000, 'Price not updated');
    assert(res.data.product.stock === 3, 'Stock not updated');
    assert(res.data.product.images.length === 2, 'Images erased on partial update');
    assert(res.data.product.variants.length === 2, 'Variants erased on partial update');
    results.push('PASS partial update preserves other fields');

    res = await request(baseUrl, 'PUT', `/api/admin/products/${productId}`, {
      headers: adminHeaders,
      body: { active: false },
    });
    assert(res.status === 200 && res.data.product.active === false, 'Deactivate failed');

    const publicGet = await request(baseUrl, 'GET', `/api/products/${productId}`);
    assert(publicGet.status === 404, `Expected public 404 for inactive product, got ${publicGet.status}`);
    results.push('PASS inactive visibility (admin yes, public no)');

    res = await request(baseUrl, 'DELETE', `/api/admin/products/${productId}`, {
      headers: adminHeaders,
    });
    assert(res.status === 200, `Delete failed: ${res.status}: ${res.data?.message}`);
    productId = '';

    const afterDelete = await request(baseUrl, 'GET', `/api/admin/products/${res.data.product.id}`, {
      headers: adminHeaders,
    });
    assert(afterDelete.status === 404, `Expected 404 after delete, got ${afterDelete.status}`);
    results.push('PASS delete product');

    console.log('\nAdmin product CRUD tests\n');
    results.forEach((line) => console.log(`- ${line}`));
    console.log(`\nAll ${results.length} checks passed.`);
  } finally {
    if (productId) {
      await Product.findByIdAndDelete(productId).catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('\nAdmin product CRUD tests failed:\n', error.message || error);
  process.exitCode = 1;
});
