import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required.'],
      trim: true,
      maxlength: 160,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 180,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required.'],
      min: [0, 'Price cannot be negative.'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required.'],
      index: true,
    },
    categorySlug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    categoryLabel: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one product image is required.',
      },
    },
    sizes: {
      type: [String],
      default: [],
    },
    colours: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative.'],
      default: 0,
    },
    bestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    newArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    listedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

productSchema.pre('validate', function assignSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  if (this.slug) {
    this.slug = slugify(this.slug);
  }
  next();
});

productSchema.index({ active: 1, bestSeller: 1, listedAt: -1 });
productSchema.index({ active: 1, newArrival: 1, listedAt: -1 });
productSchema.index({ active: 1, featured: 1, listedAt: -1 });
productSchema.index({ active: 1, category: 1, listedAt: -1 });
productSchema.index({ active: 1, categorySlug: 1, listedAt: -1 });
productSchema.index({ active: 1, price: 1 });
productSchema.index({ name: 'text', description: 'text', categoryLabel: 'text' });

export default mongoose.model('Product', productSchema);
