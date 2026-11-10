import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
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
  return error?.response?.data?.message || fallback;
}
