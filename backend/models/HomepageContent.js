import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    cta: { type: String, default: 'Shop Now' },
    href: { type: String, default: '/shop' },
    image: { type: String, required: true },
    alt: { type: String, default: '' },
  },
  { _id: false },
);

const promoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    kicker: { type: String, default: '' },
    cta: { type: String, default: 'Shop Now' },
    href: { type: String, default: '/shop' },
    image: { type: String, required: true },
    alt: { type: String, default: '' },
    tone: { type: String, enum: ['wine', 'cream'], default: 'wine' },
  },
  { _id: false },
);

const homepageContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'main',
    },
    announcement: {
      type: String,
      default: 'Fast & Reliable Delivery Across Nigeria  |  Shop with Confidence',
    },
    heroSlides: {
      type: [slideSchema],
      default: [],
    },
    promos: {
      type: [promoSchema],
      default: [],
    },
    curatedBestSellerLimit: {
      type: Number,
      default: 5,
      min: 1,
      max: 12,
    },
    curatedNewArrivalLimit: {
      type: Number,
      default: 5,
      min: 1,
      max: 12,
    },
  },
  { timestamps: true },
);

export default mongoose.model('HomepageContent', homepageContentSchema);
