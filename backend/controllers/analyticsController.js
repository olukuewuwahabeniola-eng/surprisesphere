import {
  createWhatsAppOrderEnquiry,
  getDashboardAnalytics,
  listWhatsAppOrders,
  recordAnalyticsEvent,
  updateWhatsAppOrderStatus,
} from '../services/analyticsService.js';

export async function postAnalyticsEvent(req, res) {
  const result = await recordAnalyticsEvent(req.body || {});
  res.status(result.duplicate ? 200 : 201).json({
    message: result.duplicate ? 'Duplicate event ignored.' : 'Event recorded.',
    ...result,
  });
}

export async function postWhatsAppOrderEnquiry(req, res) {
  const order = await createWhatsAppOrderEnquiry(req.body || {});
  res.status(201).json({
    message: 'WhatsApp order enquiry recorded.',
    order,
  });
}

export async function getAdminDashboard(req, res) {
  const dashboard = await getDashboardAnalytics(req.query || {});
  res.json(dashboard);
}

export async function getAdminOrders(req, res) {
  const data = await listWhatsAppOrders({
    status: req.query?.status,
    page: req.query?.page,
    pageSize: req.query?.pageSize,
  });
  res.json(data);
}

export async function patchAdminOrder(req, res) {
  const order = await updateWhatsAppOrderStatus(req.params.id, {
    status: req.body?.status,
    salesValue: req.body?.salesValue,
    note: req.body?.note,
  });
  res.json({
    message: `Order marked as ${order.status}.`,
    order,
  });
}
