import { trackAnalyticsEvent, recordWhatsAppOrderEnquiry } from '../services/api';

const VISITOR_KEY = 'sfs-visitor-id';
const SESSION_KEY = 'sfs-session-id';
const SESSION_TS_KEY = 'sfs-session-ts';
const SESSION_MS = 30 * 60 * 1000;

function randomId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function readStorage(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

export function getVisitorId() {
  let id = readStorage(VISITOR_KEY);
  if (!id) {
    id = randomId('v');
    writeStorage(VISITOR_KEY, id);
  }
  return id;
}

export function getSessionId() {
  const now = Date.now();
  const last = Number(readStorage(SESSION_TS_KEY)) || 0;
  let id = readStorage(SESSION_KEY);
  if (!id || now - last > SESSION_MS) {
    id = randomId('s');
    writeStorage(SESSION_KEY, id);
  }
  writeStorage(SESSION_TS_KEY, String(now));
  return id;
}

function basePayload(extra = {}) {
  return {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    path: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
    ...extra,
  };
}

export function trackPageView(path) {
  const resolvedPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  return trackAnalyticsEvent(
    basePayload({
      type: 'page_view',
      path: resolvedPath,
    }),
  ).catch(() => null);
}

export function trackAddToCart({ productId, productName, qty, value, size, colour } = {}) {
  return trackAnalyticsEvent(
    basePayload({
      type: 'add_to_cart',
      productId,
      productName,
      qty,
      value,
      meta: { size: size || '', colour: colour || '' },
      dedupeKey: '',
    }),
  ).catch(() => null);
}

export async function trackWhatsAppEnquiry({ items = [], channel = 'cart', note = '' } = {}) {
  const payload = basePayload({
    items,
    channel,
    note,
  });
  try {
    return await recordWhatsAppOrderEnquiry(payload);
  } catch {
    return null;
  }
}
