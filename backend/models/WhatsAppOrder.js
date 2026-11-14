import mongoose from 'mongoose';

export const WHATSAPP_ORDER_STATUS = {
  ENQUIRY: 'enquiry',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

export const WHATSAPP_ORDER_STATUS_VALUES = Object.values(WHATSAPP_ORDER_STATUS);

const lineItemSchema = new mongoose.Schema(
  {
    productId: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, maxlength: 160, default: '' },
    size: { type: String, trim: true, maxlength: 40, default: '' },
    colour: { type: String, trim: true, maxlength: 40, default: '' },
    price: { type: Number, min: 0, default: 0 },
    qty: { type: Number, min: 1, default: 1 },
    image: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const whatsAppOrderSchema = new mongoose.Schema(
  {
    items: {
      type: [lineItemSchema],
      default: [],
    },
    itemCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    enquiryTotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    salesValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: WHATSAPP_ORDER_STATUS_VALUES,
      default: WHATSAPP_ORDER_STATUS.ENQUIRY,
      index: true,
    },
    channel: {
      type: String,
      enum: ['cart', 'product'],
      default: 'cart',
    },
    visitorId: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
      index: true,
    },
    sessionId: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

whatsAppOrderSchema.index({ status: 1, createdAt: -1 });
whatsAppOrderSchema.index({ confirmedAt: -1 });

export default mongoose.model('WhatsAppOrder', whatsAppOrderSchema);
