import mongoose from 'mongoose';

export const REVIEW_PHOTO_PLACEMENT = {
  HOMEPAGE: 'homepage',
  PRODUCT: 'product',
};

export const REVIEW_PHOTO_PLACEMENT_VALUES = Object.values(REVIEW_PHOTO_PLACEMENT);

const reviewPhotoSchema = new mongoose.Schema(
  {
    image: {
      url: { type: String, required: true, trim: true },
      publicId: { type: String, trim: true, default: '' },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      format: { type: String, trim: true, default: '' },
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 280,
      default: '',
    },
    /** Optional product association. Null/undefined = general testimonial. */
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    placement: {
      type: String,
      enum: REVIEW_PHOTO_PLACEMENT_VALUES,
      default: REVIEW_PHOTO_PLACEMENT.HOMEPAGE,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

reviewPhotoSchema.index({ published: 1, placement: 1, sortOrder: 1, createdAt: -1 });
reviewPhotoSchema.index({ published: 1, product: 1, sortOrder: 1 });

export default mongoose.model('ReviewPhoto', reviewPhotoSchema);
