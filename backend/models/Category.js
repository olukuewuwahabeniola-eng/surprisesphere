import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required.'],
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    image: {
      url: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    group: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
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
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

categorySchema.pre('validate', function assignSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  if (this.slug) {
    this.slug = slugify(this.slug);
  }
  next();
});

categorySchema.index({ active: 1, featured: 1, sortOrder: 1 });
categorySchema.index({ active: 1, slug: 1 });

export default mongoose.model('Category', categorySchema);
