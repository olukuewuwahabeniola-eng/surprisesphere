import AnalyticsEvent from '../models/AnalyticsEvent.js';
import Review, { REVIEW_STATUS } from '../models/Review.js';
import WhatsAppOrder, { WHATSAPP_ORDER_STATUS } from '../models/WhatsAppOrder.js';
import { AppError } from '../utils/AppError.js';
import { isDbConnected } from '../config/db.js';

const SOURCE_LABELS = {
  direct: 'Direct',
  social: 'Social Media',
  search: 'Search Engines',
  other: 'Other/Unknown',
  unknown: 'Other/Unknown',
};

function requireDb() {
  if (!isDbConnected()) {
    throw new AppError('Analytics requires a connected MongoDB database.', 503);
  }
}

function parseDate(value, fallback) {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError('Invalid date range.', 400);
  }
  return date;
}

export function resolveDateRange(query = {}) {
  const now = new Date();
  const to = parseDate(query.to, now);
  to.setHours(23, 59, 59, 999);

  let from;
  if (query.from) {
    from = parseDate(query.from, null);
  } else {
    const days = Math.min(365, Math.max(1, Number(query.days) || 30));
    from = new Date(to);
    from.setDate(from.getDate() - (days - 1));
  }
  from.setHours(0, 0, 0, 0);

  if (from > to) {
    throw new AppError('Start date must be before end date.', 400);
  }

  const durationMs = to.getTime() - from.getTime();
  const previousTo = new Date(from.getTime() - 1);
  previousTo.setHours(23, 59, 59, 999);
  const previousFrom = new Date(previousTo.getTime() - durationMs);
  previousFrom.setHours(0, 0, 0, 0);

  return { from, to, previousFrom, previousTo };
}

function classifySource(referrer = '', explicit = '') {
  const provided = String(explicit || '').trim().toLowerCase();
  if (provided && SOURCE_LABELS[provided]) {
    return provided === 'unknown' ? 'other' : provided;
  }

  const value = String(referrer || '').trim().toLowerCase();
  if (!value) {
    return 'direct';
  }

  try {
    const host = new URL(value).hostname.replace(/^www\./, '');
    if (!host) {
      return 'direct';
    }
    if (/(facebook|instagram|tiktok|twitter|x\.com|pinterest|linkedin|youtube|whatsapp)/.test(host)) {
      return 'social';
    }
    if (/(google|bing|yahoo|duckduckgo|baidu|yandex)/.test(host)) {
      return 'search';
    }
    return 'other';
  } catch {
    return 'other';
  }
}

function percentChange(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  // Only compare when the previous period actually has a baseline.
  if (prev <= 0) {
    return { value: null, available: false };
  }
  return {
    value: Math.round(((cur - prev) / prev) * 1000) / 10,
    available: true,
  };
}

function metricCard(value, previousValue, spark) {
  const change = percentChange(value, previousValue);
  return {
    value: Number(value) || 0,
    change: change.available ? change.value : null,
    changeAvailable: change.available,
    spark: Array.isArray(spark) ? spark : [],
  };
}

const ANALYTICS_TZ = 'Africa/Lagos';

function dayKey(date) {
  // Local calendar day in Nigeria time — matches Mongo $dateToString timezone.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ANALYTICS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function buildDaySeries(from, to) {
  const days = [];
  const cursor = new Date(from);
  const endKey = dayKey(to);
  // Guard against infinite loops on bad ranges.
  for (let i = 0; i < 400; i += 1) {
    const key = dayKey(cursor);
    days.push(key);
    if (key === endKey) {
      break;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function sparkFromSeries(series, key) {
  return series.map((row) => Number(row[key]) || 0);
}

async function uniqueVisitors(from, to) {
  const values = await AnalyticsEvent.distinct('visitorId', {
    type: 'page_view',
    createdAt: { $gte: from, $lte: to },
  });
  return values.length;
}

async function countEvents(type, from, to) {
  return AnalyticsEvent.countDocuments({
    type,
    createdAt: { $gte: from, $lte: to },
  });
}

async function uniqueVisitorsWithEvent(type, from, to) {
  const values = await AnalyticsEvent.distinct('visitorId', {
    type,
    createdAt: { $gte: from, $lte: to },
  });
  return values.length;
}

async function confirmedOrdersSummary(from, to) {
  const [agg] = await WhatsAppOrder.aggregate([
    {
      $match: {
        status: WHATSAPP_ORDER_STATUS.CONFIRMED,
        confirmedAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        salesValue: { $sum: '$salesValue' },
      },
    },
  ]);
  return {
    count: agg?.count || 0,
    salesValue: agg?.salesValue || 0,
  };
}

async function dailyBreakdown(from, to) {
  const days = buildDaySeries(from, to);
  const [eventRows, visitorRows, salesRows] = await Promise.all([
    AnalyticsEvent.aggregate([
      {
        $match: {
          type: { $in: ['add_to_cart', 'whatsapp_enquiry'] },
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            day: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ANALYTICS_TZ },
            },
            type: '$type',
          },
          events: { $sum: 1 },
        },
      },
    ]),
    AnalyticsEvent.aggregate([
      {
        $match: {
          type: 'page_view',
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            day: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ANALYTICS_TZ },
            },
            visitorId: '$visitorId',
          },
        },
      },
      {
        $group: {
          _id: '$_id.day',
          uniqueVisitors: { $sum: 1 },
        },
      },
    ]),
    WhatsAppOrder.aggregate([
      {
        $match: {
          status: WHATSAPP_ORDER_STATUS.CONFIRMED,
          confirmedAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$confirmedAt', timezone: ANALYTICS_TZ },
          },
          salesValue: { $sum: '$salesValue' },
          orders: { $sum: 1 },
        },
      },
    ]),
  ]);

  const map = new Map(
    days.map((day) => [
      day,
      {
        date: day,
        visitors: 0,
        addToCart: 0,
        whatsappEnquiries: 0,
        salesValue: 0,
        confirmedOrders: 0,
      },
    ]),
  );

  eventRows.forEach((row) => {
    const entry = map.get(row._id.day);
    if (!entry) {
      return;
    }
    if (row._id.type === 'add_to_cart') {
      entry.addToCart = row.events;
    } else if (row._id.type === 'whatsapp_enquiry') {
      entry.whatsappEnquiries = row.events;
    }
  });

  visitorRows.forEach((row) => {
    const entry = map.get(row._id);
    if (entry) {
      entry.visitors = row.uniqueVisitors || 0;
    }
  });

  salesRows.forEach((row) => {
    const entry = map.get(row._id);
    if (!entry) {
      return;
    }
    entry.salesValue = row.salesValue || 0;
    entry.confirmedOrders = row.orders || 0;
  });

  return [...map.values()];
}

async function trafficSources(from, to) {
  const rows = await AnalyticsEvent.aggregate([
    {
      $match: {
        type: 'page_view',
        createdAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: { source: '$source', visitorId: '$visitorId' },
      },
    },
    {
      $group: {
        _id: '$_id.source',
        visitors: { $sum: 1 },
      },
    },
  ]);

  const totals = { direct: 0, social: 0, search: 0, other: 0 };
  rows.forEach((row) => {
    const key = row._id === 'unknown' ? 'other' : row._id;
    if (Object.prototype.hasOwnProperty.call(totals, key)) {
      totals[key] += row.visitors;
    } else {
      totals.other += row.visitors;
    }
  });

  const totalVisitors = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const segments = ['direct', 'social', 'search', 'other'].map((key) => ({
    key,
    label: SOURCE_LABELS[key],
    visitors: totals[key],
    percent: totalVisitors > 0 ? Math.round((totals[key] / totalVisitors) * 1000) / 10 : 0,
  }));

  return { totalVisitors, segments, tracked: totalVisitors > 0 };
}

async function topProducts(from, to, limit = 5) {
  const rows = await WhatsAppOrder.aggregate([
    {
      $match: {
        status: WHATSAPP_ORDER_STATUS.CONFIRMED,
        confirmedAt: { $gte: from, $lte: to },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          productId: '$items.productId',
          name: '$items.name',
          image: '$items.image',
        },
        quantity: { $sum: '$items.qty' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
      },
    },
    { $sort: { quantity: -1, revenue: -1 } },
    { $limit: limit },
  ]);

  const totalQty = rows.reduce((sum, row) => sum + (row.quantity || 0), 0) || 1;

  return rows.map((row) => ({
    productId: row._id.productId || '',
    name: row._id.name || 'Product',
    image: row._id.image || '',
    quantity: row.quantity || 0,
    revenue: row.revenue || 0,
    share: Math.round(((row.quantity || 0) / totalQty) * 1000) / 10,
  }));
}

async function recentActivity(from, to, limit = 12) {
  const range = { $gte: from, $lte: to };

  const [ordersCreated, ordersConfirmed, pendingReviews, approvedReviews, storeEvents] =
    await Promise.all([
      WhatsAppOrder.find({ createdAt: range })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      WhatsAppOrder.find({
        status: WHATSAPP_ORDER_STATUS.CONFIRMED,
        confirmedAt: range,
      })
        .sort({ confirmedAt: -1 })
        .limit(20)
        .lean(),
      Review.find({
        status: REVIEW_STATUS.PENDING,
        submittedAt: range,
      })
        .sort({ submittedAt: -1 })
        .limit(20)
        .select('displayName status submittedAt')
        .lean(),
      Review.find({
        status: REVIEW_STATUS.APPROVED,
        moderatedAt: range,
      })
        .sort({ moderatedAt: -1 })
        .limit(20)
        .select('displayName status moderatedAt')
        .lean(),
      AnalyticsEvent.find({
        type: {
          $in: ['add_to_cart', 'product_created', 'review_approved', 'testimonial_published'],
        },
        createdAt: range,
      })
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
    ]);

  const activities = [];

  ordersCreated.forEach((order) => {
    activities.push({
      id: `order-enquiry-${order._id}`,
      type: 'whatsapp_enquiry',
      title: 'Customer initiated WhatsApp order enquiry',
      detail: `${order.itemCount || order.items?.length || 0} item(s) · ₦${Number(order.enquiryTotal || 0).toLocaleString('en-NG')}`,
      at: order.createdAt,
    });
  });

  ordersConfirmed.forEach((order) => {
    activities.push({
      id: `order-confirmed-${order._id}`,
      type: 'order_confirmed',
      title: 'Order manually confirmed',
      detail: `₦${Number(order.salesValue || 0).toLocaleString('en-NG')} confirmed sale`,
      at: order.confirmedAt,
    });
  });

  pendingReviews.forEach((review) => {
    activities.push({
      id: `review-pending-${review._id}`,
      type: 'review_pending',
      title: 'New review submitted and awaiting approval',
      detail: review.displayName || 'Customer',
      at: review.submittedAt,
    });
  });

  approvedReviews.forEach((review) => {
    activities.push({
      id: `review-approved-${review._id}`,
      type: 'review_approved',
      title: 'Review approved',
      detail: review.displayName || 'Customer',
      at: review.moderatedAt,
    });
  });

  storeEvents.forEach((event) => {
    if (event.type === 'add_to_cart') {
      activities.push({
        id: `cart-${event._id}`,
        type: 'add_to_cart',
        title: 'Product added to cart',
        detail: event.productName || 'Item',
        at: event.createdAt,
      });
      return;
    }
    if (event.type === 'product_created') {
      activities.push({
        id: `product-created-${event._id}`,
        type: 'product_created',
        title: 'Product created',
        detail: event.productName || 'New product',
        at: event.createdAt,
      });
      return;
    }
    if (event.type === 'review_approved') {
      // Prefer Review.moderatedAt entries above; skip duplicate analytics copies.
      return;
    }
    if (event.type === 'testimonial_published') {
      activities.push({
        id: `testimonial-${event._id}`,
        type: 'testimonial_published',
        title: 'Testimonial published',
        detail: event.productName || event.path || 'WhatsApp picture review',
        at: event.createdAt,
      });
    }
  });

  return activities
    .filter((item) => item.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);
}

export async function recordStoreActivity({
  type,
  productId,
  productName = '',
  path = '',
  meta = {},
} = {}) {
  requireDb();
  if (!['product_created', 'review_approved', 'testimonial_published'].includes(type)) {
    throw new AppError('Unsupported store activity type.', 400);
  }

  const event = await AnalyticsEvent.create({
    type,
    visitorId: 'admin',
    sessionId: 'admin',
    path: String(path || '').slice(0, 300),
    referrer: '',
    source: 'direct',
    productId: productId || undefined,
    productName: String(productName || '').trim().slice(0, 160),
    meta: meta && typeof meta === 'object' ? meta : {},
    dedupeKey: '',
  });

  return { id: String(event._id), type: event.type, createdAt: event.createdAt };
}

export async function recordAnalyticsEvent(payload = {}) {
  requireDb();

  const type = String(payload.type || '').trim();
  if (!['page_view', 'add_to_cart', 'whatsapp_enquiry'].includes(type)) {
    throw new AppError('Unsupported analytics event type.', 400);
  }

  const visitorId = String(payload.visitorId || '').trim().slice(0, 80);
  const sessionId = String(payload.sessionId || '').trim().slice(0, 80);
  if (!visitorId || !sessionId) {
    throw new AppError('visitorId and sessionId are required.', 400);
  }

  const path = String(payload.path || '').trim().slice(0, 300);
  const referrer = String(payload.referrer || '').trim().slice(0, 500);
  const source = classifySource(referrer, payload.source);
  const productId = payload.productId || null;
  const productName = String(payload.productName || '').trim().slice(0, 160);
  const qty = Math.max(0, Number(payload.qty) || 0);
  const value = Math.max(0, Number(payload.value) || 0);
  const size = String(payload.meta?.size || payload.size || '').trim();
  const colour = String(payload.meta?.colour || payload.colour || '').trim();

  let dedupeKey = String(payload.dedupeKey || '').trim().slice(0, 160);
  if (!dedupeKey && type === 'page_view') {
    // Collapse rapid refresh duplicates within the same minute for same path.
    const minute = new Date();
    minute.setSeconds(0, 0);
    dedupeKey = `pv:${visitorId}:${path}:${minute.toISOString()}`;
  }
  if (!dedupeKey && type === 'add_to_cart') {
    // Collapse accidental double-fires within a 15-second window.
    const bucket = Math.floor(Date.now() / 15000);
    dedupeKey = `atc:${visitorId}:${productId || productName}:${size}:${colour}:${bucket}`;
  }

  try {
    const event = await AnalyticsEvent.create({
      type,
      visitorId,
      sessionId,
      path,
      referrer,
      source,
      productId: productId || undefined,
      productName,
      qty,
      value,
      meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : {},
      dedupeKey,
    });

    return {
      id: String(event._id),
      type: event.type,
      createdAt: event.createdAt,
      duplicate: false,
    };
  } catch (error) {
    if (error?.code === 11000) {
      return { duplicate: true, type };
    }
    throw error;
  }
}

export async function createWhatsAppOrderEnquiry(payload = {}) {
  requireDb();

  const items = Array.isArray(payload.items)
    ? payload.items
        .map((item) => ({
          productId: String(item.productId || item.id || '').trim(),
          name: String(item.name || '').trim().slice(0, 160),
          size: String(item.size || '').trim().slice(0, 40),
          colour: String(item.colour || '').trim().slice(0, 40),
          price: Math.max(0, Number(item.price) || 0),
          qty: Math.max(1, Number(item.qty) || 1),
          image: String(item.image || '').trim(),
        }))
        .filter((item) => item.name)
    : [];

  if (!items.length) {
    throw new AppError('At least one order item is required.', 400);
  }

  const enquiryTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  const order = await WhatsAppOrder.create({
    items,
    itemCount,
    enquiryTotal,
    salesValue: 0,
    status: WHATSAPP_ORDER_STATUS.ENQUIRY,
    channel: payload.channel === 'product' ? 'product' : 'cart',
    visitorId: String(payload.visitorId || '').trim().slice(0, 80),
    sessionId: String(payload.sessionId || '').trim().slice(0, 80),
    note: String(payload.note || '').trim().slice(0, 500),
  });

  // Also record analytics click (best-effort; ignore duplicates).
  try {
    await recordAnalyticsEvent({
      type: 'whatsapp_enquiry',
      visitorId: payload.visitorId,
      sessionId: payload.sessionId,
      path: payload.path || '/cart',
      referrer: payload.referrer || '',
      productId: items[0]?.productId || undefined,
      productName: items.length === 1 ? items[0].name : `${items.length} items`,
      qty: itemCount,
      value: enquiryTotal,
      dedupeKey: `wa:${payload.visitorId}:${order._id}`,
      meta: { orderId: String(order._id), channel: order.channel },
    });
  } catch {
    // Analytics failure should not block enquiry creation.
  }

  return serializeOrder(order);
}

function serializeOrder(order) {
  const doc = order.toObject ? order.toObject() : order;
  return {
    id: String(doc._id),
    items: doc.items || [],
    itemCount: doc.itemCount || 0,
    enquiryTotal: doc.enquiryTotal || 0,
    salesValue: doc.salesValue || 0,
    status: doc.status,
    channel: doc.channel,
    note: doc.note || '',
    confirmedAt: doc.confirmedAt,
    cancelledAt: doc.cancelledAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listWhatsAppOrders({ status, page = 1, pageSize = 20 } = {}) {
  requireDb();
  const filter = {};
  if (status && WHATSAPP_ORDER_STATUS[status.toUpperCase()]) {
    filter.status = status;
  } else if (status && Object.values(WHATSAPP_ORDER_STATUS).includes(status)) {
    filter.status = status;
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const skip = (safePage - 1) * safeSize;

  const [orders, total] = await Promise.all([
    WhatsAppOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeSize),
    WhatsAppOrder.countDocuments(filter),
  ]);

  return {
    orders: orders.map(serializeOrder),
    pagination: {
      page: safePage,
      pageSize: safeSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeSize)),
      hasMore: skip + orders.length < total,
    },
  };
}

export async function updateWhatsAppOrderStatus(id, { status, salesValue, note } = {}) {
  requireDb();
  const order = await WhatsAppOrder.findById(id);
  if (!order) {
    throw new AppError('Order enquiry not found.', 404);
  }

  if (status === WHATSAPP_ORDER_STATUS.CONFIRMED) {
    order.status = WHATSAPP_ORDER_STATUS.CONFIRMED;
    order.confirmedAt = new Date();
    order.cancelledAt = null;
    const amount = Number(salesValue);
    order.salesValue = Number.isFinite(amount) && amount >= 0 ? amount : order.enquiryTotal;
  } else if (status === WHATSAPP_ORDER_STATUS.CANCELLED) {
    order.status = WHATSAPP_ORDER_STATUS.CANCELLED;
    order.cancelledAt = new Date();
    order.salesValue = 0;
  } else if (status === WHATSAPP_ORDER_STATUS.ENQUIRY) {
    order.status = WHATSAPP_ORDER_STATUS.ENQUIRY;
    order.confirmedAt = null;
    order.cancelledAt = null;
    order.salesValue = 0;
  } else {
    throw new AppError('Invalid order status.', 400);
  }

  if (typeof note === 'string') {
    order.note = note.trim().slice(0, 500);
  }

  await order.save();
  return serializeOrder(order);
}

export async function getDashboardAnalytics(query = {}) {
  requireDb();
  const { from, to, previousFrom, previousTo } = resolveDateRange(query);

  const [
    visitors,
    prevVisitors,
    addToCart,
    prevAddToCart,
    whatsappEnquiries,
    prevWhatsapp,
    confirmed,
    prevConfirmed,
    series,
    traffic,
    products,
    activity,
    atcVisitors,
    waVisitors,
    confirmedVisitorIds,
    pendingReviews,
  ] = await Promise.all([
    uniqueVisitors(from, to),
    uniqueVisitors(previousFrom, previousTo),
    countEvents('add_to_cart', from, to),
    countEvents('add_to_cart', previousFrom, previousTo),
    countEvents('whatsapp_enquiry', from, to),
    countEvents('whatsapp_enquiry', previousFrom, previousTo),
    confirmedOrdersSummary(from, to),
    confirmedOrdersSummary(previousFrom, previousTo),
    dailyBreakdown(from, to),
    trafficSources(from, to),
    topProducts(from, to, 5),
    recentActivity(from, to, 12),
    uniqueVisitorsWithEvent('add_to_cart', from, to),
    uniqueVisitorsWithEvent('whatsapp_enquiry', from, to),
    WhatsAppOrder.distinct('visitorId', {
      status: WHATSAPP_ORDER_STATUS.CONFIRMED,
      confirmedAt: { $gte: from, $lte: to },
      visitorId: { $ne: '' },
    }),
    Review.countDocuments({ status: REVIEW_STATUS.PENDING }),
  ]);

  const linkedConfirmedVisitors = confirmedVisitorIds.filter(Boolean).length;
  const ratesAvailable = visitors > 0;

  const visitorsChange = percentChange(visitors, prevVisitors);
  const engagement = {
    visitors: {
      value: visitors,
      change: visitorsChange.available ? visitorsChange.value : null,
      changeAvailable: visitorsChange.available,
      available: true,
    },
    addToCartRate: {
      value: ratesAvailable ? Math.round((atcVisitors / visitors) * 1000) / 10 : null,
      available: ratesAvailable,
      numerator: atcVisitors,
      denominator: visitors,
      change: null,
      changeAvailable: false,
    },
    whatsappEnquiryRate: {
      value: ratesAvailable ? Math.round((waVisitors / visitors) * 1000) / 10 : null,
      available: ratesAvailable,
      numerator: waVisitors,
      denominator: visitors,
      change: null,
      changeAvailable: false,
    },
    confirmedPurchaseRate: {
      value:
        ratesAvailable && linkedConfirmedVisitors > 0
          ? Math.round((linkedConfirmedVisitors / visitors) * 1000) / 10
          : null,
      available: ratesAvailable && linkedConfirmedVisitors > 0,
      numerator: linkedConfirmedVisitors,
      denominator: visitors,
      change: null,
      changeAvailable: false,
    },
  };

  // Previous-period engagement deltas only when both periods have visitors.
  const [prevAtcVisitors, prevWaVisitors] = await Promise.all([
    uniqueVisitorsWithEvent('add_to_cart', previousFrom, previousTo),
    uniqueVisitorsWithEvent('whatsapp_enquiry', previousFrom, previousTo),
  ]);
  if (visitors > 0 && prevVisitors > 0) {
    const prevAtcRate = (prevAtcVisitors / prevVisitors) * 100;
    const prevWaRate = (prevWaVisitors / prevVisitors) * 100;
    engagement.addToCartRate.change =
      Math.round((engagement.addToCartRate.value - prevAtcRate) * 10) / 10;
    engagement.addToCartRate.changeAvailable = true;
    engagement.whatsappEnquiryRate.change =
      Math.round((engagement.whatsappEnquiryRate.value - prevWaRate) * 10) / 10;
    engagement.whatsappEnquiryRate.changeAvailable = true;
  }

  const salesChange = percentChange(confirmed.salesValue, prevConfirmed.salesValue);

  return {
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      previousFrom: previousFrom.toISOString(),
      previousTo: previousTo.toISOString(),
    },
    cards: {
      visitors: metricCard(visitors, prevVisitors, sparkFromSeries(series, 'visitors')),
      addToCart: metricCard(addToCart, prevAddToCart, sparkFromSeries(series, 'addToCart')),
      whatsappEnquiries: metricCard(
        whatsappEnquiries,
        prevWhatsapp,
        sparkFromSeries(series, 'whatsappEnquiries'),
      ),
      confirmedOrders: metricCard(
        confirmed.count,
        prevConfirmed.count,
        sparkFromSeries(series, 'confirmedOrders'),
      ),
      confirmedSales: metricCard(
        confirmed.salesValue,
        prevConfirmed.salesValue,
        sparkFromSeries(series, 'salesValue'),
      ),
    },
    overview: series,
    traffic,
    topProducts: products,
    salesSummary: {
      value: confirmed.salesValue,
      change: salesChange.available ? salesChange.value : null,
      changeAvailable: salesChange.available,
      series: series.map((row) => ({ date: row.date, salesValue: row.salesValue })),
    },
    engagement,
    recentActivity: activity,
    notifications: {
      unread: pendingReviews,
    },
  };
}
