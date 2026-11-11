import axios from 'axios';

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

export function getProducts(params = {}) {
  return api.get('/api/products', { params }).then((response) => response.data);
}

export function subscribeNewsletter(email) {
  return api.post('/api/newsletter', { email }).then((response) => response.data);
}

export function sendEnquiry(payload) {
  return api.post('/api/enquiries', payload).then((response) => response.data);
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
