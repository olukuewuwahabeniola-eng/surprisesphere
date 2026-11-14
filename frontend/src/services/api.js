import axios from 'axios';
import { adminHeaders } from '../utils/adminAuth';

function resolveBaseUrl() {
  const configured = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (configured) {
    return configured;
  }
  // Same-origin in production (Vercel rewrites /api to the Express function).
  // Empty base in Vite dev so the proxy at /api can be used.
  return '';
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
});

export function getHomepage() {
  return api.get('/api/homepage').then((response) => response.data);
}

export function getHomepageBanners() {
  return api.get('/api/homepage/banners').then((response) => response.data);
}

export function getBestSellers(params = {}) {
  return api.get('/api/collections/best-sellers', { params }).then((response) => response.data);
}

export function getNewArrivals(params = {}) {
  return api.get('/api/collections/new-arrivals', { params }).then((response) => response.data);
}

export function getShop(params = {}) {
  return api.get('/api/shop', { params }).then((response) => response.data);
}

export function getCategoryShop(slug, params = {}) {
  return api.get(`/api/shop/${slug}`, { params }).then((response) => response.data);
}

export function getCategories(params = {}) {
  return api.get('/api/categories', { params }).then((response) => response.data);
}

export function getProduct(idOrSlug) {
  return api.get(`/api/products/${idOrSlug}`).then((response) => response.data);
}

export function getProductReviews(idOrSlug, params = {}) {
  return api
    .get(`/api/products/${idOrSlug}/reviews`, { params })
    .then((response) => response.data);
}

export function submitProductReview(payload) {
  return api.post('/api/reviews', payload).then((response) => response.data);
}

export function getReviewPhotos(params = {}) {
  return api.get('/api/review-photos', { params }).then((response) => response.data);
}

export function getProducts(params = {}) {
  return api.get('/api/products', { params }).then((response) => response.data);
}

export function subscribeNewsletter(email) {
  return api.post('/api/newsletter', { email }).then((response) => response.data);
}

export function sendEnquiry(payload) {
  return api.post('/api/enquiries', payload).then((response) => response.data);
}

export function getStore() {
  return api.get('/api/store').then((response) => response.data);
}

export function updateStoreSettings({ adminKey, whatsappNumber }) {
  return api
    .put(
      '/api/admin/store',
      { whatsappNumber },
      {
        headers: adminHeaders(adminKey),
      },
    )
    .then((response) => response.data);
}

export function listAdminProducts(adminKey, params = {}) {
  return api
    .get('/api/admin/products', {
      params,
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function getAdminProduct(adminKey, idOrSlug) {
  return api
    .get(`/api/admin/products/${idOrSlug}`, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function createAdminProduct(adminKey, payload) {
  return api
    .post('/api/admin/products', payload, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function updateAdminProduct(adminKey, idOrSlug, payload) {
  return api
    .patch(`/api/admin/products/${idOrSlug}`, payload, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function deleteAdminProduct(adminKey, idOrSlug) {
  return api
    .delete(`/api/admin/products/${idOrSlug}`, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function listAdminCategories(adminKey, params = {}) {
  return api
    .get('/api/admin/categories', {
      params,
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function createAdminCategory(adminKey, payload) {
  return api
    .post('/api/admin/categories', payload, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function updateAdminCategory(adminKey, idOrSlug, payload) {
  return api
    .patch(`/api/admin/categories/${idOrSlug}`, payload, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function deleteAdminCategory(adminKey, idOrSlug) {
  return api
    .delete(`/api/admin/categories/${idOrSlug}`, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function reorderAdminCategories(adminKey, orderedIds) {
  return api
    .patch(
      '/api/admin/categories/reorder',
      { ids: orderedIds },
      {
        headers: adminHeaders(adminKey),
      },
    )
    .then((response) => response.data);
}

export function uploadAdminImages(adminKey, files, { onUploadProgress } = {}) {
  const formData = new FormData();
  const list = Array.from(files || []);
  list.forEach((file) => {
    formData.append('images', file);
  });

  return api
    .post('/api/admin/uploads/images', formData, {
      headers: adminHeaders(adminKey),
      timeout: 120000,
      onUploadProgress,
    })
    .then((response) => response.data);
}

export function listAdminReviews(adminKey, params = {}) {
  return api
    .get('/api/admin/reviews', {
      params,
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function getAdminReview(adminKey, id) {
  return api
    .get(`/api/admin/reviews/${id}`, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function approveAdminReview(adminKey, id) {
  return api
    .patch(`/api/admin/reviews/${id}/approve`, null, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function rejectAdminReview(adminKey, id) {
  return api
    .patch(`/api/admin/reviews/${id}/reject`, null, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function blockAdminReview(adminKey, id) {
  return api
    .patch(`/api/admin/reviews/${id}/block`, null, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function unpublishAdminReview(adminKey, id) {
  return api
    .patch(`/api/admin/reviews/${id}/unpublish`, null, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function restoreAdminReview(adminKey, id) {
  return api
    .patch(`/api/admin/reviews/${id}/restore`, null, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function deleteAdminReview(adminKey, id) {
  return api
    .delete(`/api/admin/reviews/${id}`, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function listAdminReviewPhotos(adminKey, params = {}) {
  return api
    .get('/api/admin/review-photos', {
      params,
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function uploadAdminReviewPhotos(adminKey, { files, caption, productId, placement, published }, { onUploadProgress } = {}) {
  const formData = new FormData();
  Array.from(files || []).forEach((file) => {
    formData.append('images', file);
  });
  if (caption != null) {
    formData.append('caption', caption);
  }
  if (productId) {
    formData.append('productId', productId);
  }
  if (placement) {
    formData.append('placement', placement);
  }
  if (published != null) {
    formData.append('published', String(Boolean(published)));
  }

  return api
    .post('/api/admin/review-photos', formData, {
      headers: adminHeaders(adminKey),
      timeout: 120000,
      onUploadProgress,
    })
    .then((response) => response.data);
}

export function updateAdminReviewPhoto(adminKey, id, payload) {
  return api
    .patch(`/api/admin/review-photos/${id}`, payload, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function publishAdminReviewPhoto(adminKey, id) {
  return api
    .patch(`/api/admin/review-photos/${id}/publish`, null, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function unpublishAdminReviewPhoto(adminKey, id) {
  return api
    .patch(`/api/admin/review-photos/${id}/unpublish`, null, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function reorderAdminReviewPhotos(adminKey, orderedIds) {
  return api
    .patch(
      '/api/admin/review-photos/reorder',
      { orderedIds },
      {
        headers: adminHeaders(adminKey),
      },
    )
    .then((response) => response.data);
}

export function deleteAdminReviewPhoto(adminKey, id) {
  return api
    .delete(`/api/admin/review-photos/${id}`, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function trackAnalyticsEvent(payload) {
  return api.post('/api/analytics/events', payload).then((response) => response.data);
}

export function recordWhatsAppOrderEnquiry(payload) {
  return api.post('/api/analytics/whatsapp-orders', payload).then((response) => response.data);
}

export function getAdminDashboard(adminKey, params = {}) {
  return api
    .get('/api/admin/analytics/dashboard', {
      params,
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function listAdminOrders(adminKey, params = {}) {
  return api
    .get('/api/admin/analytics/orders', {
      params,
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function updateAdminOrder(adminKey, id, payload) {
  return api
    .patch(`/api/admin/analytics/orders/${id}`, payload, {
      headers: adminHeaders(adminKey),
    })
    .then((response) => response.data);
}

export function readError(error, fallback) {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'The shop API could not be reached. Check that the backend is deployed and reachable.';
  }
  if (error?.response?.status === 404) {
    return 'The shop API route was not found. The backend may not be connected to this deployment.';
  }
  return fallback;
}
