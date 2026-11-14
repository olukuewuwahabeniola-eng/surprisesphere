import mongoose from 'mongoose';

export const ANALYTICS_EVENT_TYPES = [
  'page_view',
  'add_to_cart',
  'whatsapp_enquiry',
  'product_created',
  'review_approved',
  'testimonial_published',
];

const analyticsEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ANALYTICS_EVENT_TYPES,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    path: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    referrer: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    source: {
      type: String,
      trim: true,
      maxlength: 40,
      default: 'unknown',
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    productName: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
    qty: {
      type: Number,
      min: 0,
      default: 0,
    },
    value: {
      type: Number,
      min: 0,
      default: 0,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    dedupeKey: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

analyticsEventSchema.index({ type: 1, createdAt: -1 });
analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: 'string', $gt: '' } },
  },
);

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
