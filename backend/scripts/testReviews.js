/**
 * Integration tests for customer reviews + admin review photos.
 * Usage (from backend/): npm run test:reviews
 * Requires MONGO_URI and ADMIN_KEY. Cloudinary needed for photo upload checks.
 */
import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { createApp } from '../app.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { connectDB, isDbConnected } from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import ReviewPhoto from '../models/ReviewPhoto.js';

const ADMIN_KEY = String(process.env.ADMIN_KEY || '').trim();
const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function pass(message) {
  results.push(`PASS ${message}`);
  console.log(`PASS ${message}`);
}

async function request(baseUrl, method, pathName, { headers = {}, body, formData } = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method,
    headers: formData ? headers : headers,
    body: formData || (body === undefined ? undefined : JSON.stringify(body)),
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

function loadPng() {
  const candidates = [
    path.join(process.env.TEMP || '', 'sfs-upload-test', 'a.png'),
    path.join(process.env.TMP || '', 'sfs-upload-test', 'a.png'),
  ];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return fs.readFileSync(candidate);
    }
  }
  return Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex',
  );
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

  let category = await Category.findOne({ active: true });
  if (!category) {
    category = await Category.create({
      name: 'Bags',
      slug: `bags-review-test-${Date.now()}`,
      description: 'Review test category',
      image: { url: '/images/cat-bags.jpg', alt: 'Bags' },
      active: true,
    });
  }

  const product = await Product.create({
    name: `Review Test Product ${Date.now()}`,
    description: 'Temporary product for review tests',
    price: 15000,
    category: category._id,
    categorySlug: category.slug,
    categoryLabel: category.name,
    images: [{ url: '/images/prod-handbag.jpg', alt: 'Test' }],
    active: true,
  });

  const app = createApp();
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const createdReviewIds = [];
  const createdPhotoIds = [];

  try {
    // Invalid product / rating
    let res = await request(baseUrl, 'POST', '/api/reviews', {
      headers: { 'Content-Type': 'application/json' },
      body: {
        productId: 'not-an-id',
        displayName: 'Ada',
        rating: 5,
      },
    });
    assert(res.status === 400, `invalid product expected 400 got ${res.status}`);
    pass('invalid product id → 400');

    res = await request(baseUrl, 'POST', '/api/reviews', {
      headers: { 'Content-Type': 'application/json' },
      body: {
        productId: String(product._id),
        displayName: 'Ada',
        rating: 9,
      },
    });
    assert(res.status === 400, `invalid rating expected 400 got ${res.status}`);
    pass('invalid rating → 400');

    // Submit review — always pending; ignore client status
    res = await request(baseUrl, 'POST', '/api/reviews', {
      headers: { 'Content-Type': 'application/json' },
      body: {
        productId: String(product._id),
        displayName: 'Ada Okafor',
        rating: 5,
        body: 'Beautiful quality and packaging.',
        status: 'approved',
      },
    });
    assert(res.status === 201, `submit expected 201 got ${res.status}: ${res.data?.message}`);
    assert(res.data.review.status === 'pending', 'new review must be pending');
    const reviewA = res.data.review.id;
    createdReviewIds.push(reviewA);
    pass('submit review → pending (client status ignored)');

    // Duplicate protection
    res = await request(baseUrl, 'POST', '/api/reviews', {
      headers: { 'Content-Type': 'application/json' },
      body: {
        productId: String(product._id),
        displayName: 'Ada Okafor',
        rating: 4,
        body: 'Trying again',
      },
    });
    assert(res.status === 429, `duplicate expected 429 got ${res.status}`);
    pass('duplicate submission → 429');

    // Second distinct review for rating math (different client fingerprint)
    res = await request(baseUrl, 'POST', '/api/reviews', {
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.20',
      },
      body: {
        productId: String(product._id),
        displayName: 'Chioma Bello',
        rating: 3,
        body: 'Nice, but sizing ran small.',
      },
    });
    assert(res.status === 201, `second submit expected 201 got ${res.status}`);
    const reviewB = res.data.review.id;
    createdReviewIds.push(reviewB);
    pass('second distinct review submitted');

    // Public list hides pending
    res = await request(baseUrl, 'GET', `/api/products/${product._id}/reviews`);
    assert(res.status === 200, `public list expected 200 got ${res.status}`);
    assert(res.data.summary.count === 0, 'pending reviews must not count');
    assert((res.data.reviews || []).length === 0, 'pending reviews must not be listed');
    pass('public endpoint hides pending reviews');

    // Admin auth required
    res = await request(baseUrl, 'GET', '/api/admin/reviews');
    assert(res.status === 401, `admin list without key expected 401 got ${res.status}`);
    pass('admin reviews unauthorized → 401');

    res = await request(baseUrl, 'GET', '/api/admin/reviews?status=pending', {
      headers: adminHeaders,
    });
    assert(res.status === 200, `admin list expected 200 got ${res.status}`);
    assert((res.data.reviews || []).some((item) => item.id === reviewA), 'admin missing pending review');
    pass('admin list pending reviews');

    // Approve A
    res = await request(baseUrl, 'PATCH', `/api/admin/reviews/${reviewA}/approve`, {
      headers: adminHeaders,
    });
    assert(res.status === 200 && res.data.review.status === 'approved', 'approve failed');
    pass('approve pending review');

    // Public now shows A only; average 5 / count 1
    res = await request(baseUrl, 'GET', `/api/products/${product.slug}/reviews`);
    assert(res.status === 200, `public after approve expected 200 got ${res.status}`);
    assert(res.data.summary.count === 1, `expected count 1 got ${res.data.summary.count}`);
    assert(res.data.summary.average === 5, `expected average 5 got ${res.data.summary.average}`);
    assert(res.data.reviews.length === 1 && res.data.reviews[0].id === reviewA, 'only approved review visible');
    assert(!('status' in (res.data.reviews[0] || {})), 'public review must not expose status');
    pass('public average/count after approval');

    // Reject B
    res = await request(baseUrl, 'PATCH', `/api/admin/reviews/${reviewB}/reject`, {
      headers: adminHeaders,
    });
    assert(res.status === 200 && res.data.review.status === 'rejected', 'reject failed');
    pass('reject pending review');

    res = await request(baseUrl, 'GET', `/api/products/${product._id}/reviews`);
    assert(res.data.summary.count === 1, 'rejected review must not affect count');
    pass('rejected review excluded from public rating');

    // Restore B → pending → approve → average becomes 4
    res = await request(baseUrl, 'PATCH', `/api/admin/reviews/${reviewB}/restore`, {
      headers: adminHeaders,
    });
    assert(res.status === 200 && res.data.review.status === 'pending', 'restore failed');
    pass('restore rejected review → pending');

    res = await request(baseUrl, 'PATCH', `/api/admin/reviews/${reviewB}/approve`, {
      headers: adminHeaders,
    });
    assert(res.status === 200 && res.data.review.status === 'approved', 're-approve failed');

    res = await request(baseUrl, 'GET', `/api/products/${product._id}/reviews`);
    assert(res.data.summary.count === 2, 'expected 2 approved');
    assert(res.data.summary.average === 4, `expected average 4 got ${res.data.summary.average}`);
    pass('rating recalculated after second approval');

    // Unpublish B
    res = await request(baseUrl, 'PATCH', `/api/admin/reviews/${reviewB}/unpublish`, {
      headers: adminHeaders,
    });
    assert(res.status === 200 && res.data.review.status === 'unpublished', 'unpublish failed');
    res = await request(baseUrl, 'GET', `/api/products/${product._id}/reviews`);
    assert(res.data.summary.count === 1 && res.data.summary.average === 5, 'unpublished still counted');
    pass('unpublish removes review from public rating');

    // Block A
    res = await request(baseUrl, 'PATCH', `/api/admin/reviews/${reviewA}/block`, {
      headers: adminHeaders,
    });
    assert(res.status === 200 && res.data.review.status === 'blocked', 'block failed');
    res = await request(baseUrl, 'GET', `/api/products/${product._id}/reviews`);
    assert(res.data.summary.count === 0, 'blocked review still public');
    pass('block removes review from public');

    // Filter admin by rating/status
    res = await request(baseUrl, 'GET', `/api/admin/reviews?product=${product._id}&status=blocked&rating=5`, {
      headers: adminHeaders,
    });
    assert(res.status === 200, `filter expected 200 got ${res.status}`);
    assert((res.data.reviews || []).every((item) => item.status === 'blocked' && item.rating === 5), 'filter mismatch');
    pass('admin filter by product/status/rating');

    // Delete A
    res = await request(baseUrl, 'DELETE', `/api/admin/reviews/${reviewA}`, {
      headers: adminHeaders,
    });
    assert(res.status === 200, `delete expected 200 got ${res.status}`);
    createdReviewIds.splice(createdReviewIds.indexOf(reviewA), 1);
    const gone = await Review.findById(reviewA).lean();
    assert(!gone, 'review still in database after delete');
    pass('permanent delete review');

    // --- Admin review photos ---
    res = await request(baseUrl, 'POST', '/api/admin/review-photos', {
      headers: {},
      formData: (() => {
        const form = new FormData();
        form.append('images', new Blob([loadPng()], { type: 'image/png' }), 'review.png');
        form.append('caption', 'WhatsApp customer photo');
        form.append('placement', 'homepage');
        form.append('published', 'false');
        return form;
      })(),
    });
    assert(res.status === 401, `photo upload without key expected 401 got ${res.status}`);
    pass('admin review-photo unauthorized → 401');

    if (isCloudinaryConfigured()) {
      res = await request(baseUrl, 'POST', '/api/admin/review-photos', {
        headers: { 'x-admin-key': ADMIN_KEY },
        formData: (() => {
          const form = new FormData();
          form.append('images', new Blob([loadPng()], { type: 'image/png' }), 'review-a.png');
          form.append('images', new Blob([loadPng()], { type: 'image/png' }), 'review-b.png');
          form.append('caption', 'Shared WhatsApp review');
          form.append('placement', 'product');
          form.append('productId', String(product._id));
          form.append('published', 'false');
          return form;
        })(),
      });
      assert(res.status === 201, `photo create expected 201 got ${res.status}: ${res.data?.message}`);
      assert((res.data.photos || []).length === 2, 'expected 2 uploaded photos');
      const photoA = res.data.photos[0].id;
      const photoB = res.data.photos[1].id;
      createdPhotoIds.push(photoA, photoB);
      pass('admin multi photo upload');

      res = await request(baseUrl, 'GET', '/api/review-photos?placement=product');
      assert(res.status === 200 && (res.data.photos || []).length === 0, 'unpublished photos leaked publicly');
      pass('public hides unpublished review photos');

      res = await request(baseUrl, 'PATCH', `/api/admin/review-photos/${photoA}/publish`, {
        headers: adminHeaders,
      });
      assert(res.status === 200 && res.data.photo.published === true, 'publish photo failed');
      pass('publish review photo');

      res = await request(
        baseUrl,
        'GET',
        `/api/review-photos?placement=product&productId=${product._id}`,
      );
      assert(res.status === 200, `public photos expected 200 got ${res.status}`);
      assert((res.data.photos || []).some((item) => item.id === photoA), 'published photo missing publicly');
      assert(!(res.data.photos || []).some((item) => item.id === photoB), 'unpublished sibling leaked');
      pass('public shows only published review photos');

      res = await request(baseUrl, 'PATCH', '/api/admin/review-photos/reorder', {
        headers: adminHeaders,
        body: { orderedIds: [photoB, photoA] },
      });
      assert(res.status === 200, `reorder expected 200 got ${res.status}`);
      assert(res.data.photos[0].id === photoB && res.data.photos[1].id === photoA, 'reorder order wrong');
      pass('reorder review photos');

      res = await request(baseUrl, 'PATCH', `/api/admin/review-photos/${photoA}`, {
        headers: adminHeaders,
        body: { caption: 'Updated caption', placement: 'homepage', productId: null },
      });
      assert(res.status === 200, `patch photo expected 200 got ${res.status}`);
      assert(res.data.photo.caption === 'Updated caption', 'caption not updated');
      assert(res.data.photo.placement === 'homepage', 'placement not updated');
      assert(res.data.photo.productId == null, 'product not cleared for general testimonial');
      pass('update caption/placement/general association');

      res = await request(baseUrl, 'PATCH', `/api/admin/review-photos/${photoA}/unpublish`, {
        headers: adminHeaders,
      });
      assert(res.status === 200 && res.data.photo.published === false, 'unpublish photo failed');
      res = await request(baseUrl, 'GET', '/api/review-photos?placement=homepage');
      assert(!(res.data.photos || []).some((item) => item.id === photoA), 'unpublished homepage photo leaked');
      pass('unpublish review photo');

      res = await request(baseUrl, 'DELETE', `/api/admin/review-photos/${photoB}`, {
        headers: adminHeaders,
      });
      assert(res.status === 200, `delete photo expected 200 got ${res.status}`);
      createdPhotoIds.splice(createdPhotoIds.indexOf(photoB), 1);
      pass('delete review photo');

      // Photos must not affect numerical ratings
      res = await request(baseUrl, 'GET', `/api/products/${product._id}/reviews`);
      assert(res.data.summary.count === 0, 'photos affected rating count');
      pass('review photos do not affect numerical ratings');
    } else {
      pass('SKIP Cloudinary photo upload checks (credentials not configured)');
    }

    console.log('\nReview system tests\n');
    results.forEach((line) => console.log(`- ${line}`));
    console.log(`\nAll ${results.length} checks finished.`);
  } finally {
    if (createdReviewIds.length) {
      await Review.deleteMany({ _id: { $in: createdReviewIds } }).catch(() => {});
    }
    if (createdPhotoIds.length) {
      await ReviewPhoto.deleteMany({ _id: { $in: createdPhotoIds } }).catch(() => {});
    }
    await Review.deleteMany({ product: product._id }).catch(() => {});
    await ReviewPhoto.deleteMany({ product: product._id }).catch(() => {});
    await Product.findByIdAndDelete(product._id).catch(() => {});
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('\nReview system tests failed:\n', error.message || error);
  process.exitCode = 1;
});
