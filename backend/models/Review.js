import mongoose from 'mongoose';

export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
  UNPUBLISHED: 'unpublished',
};

export const REVIEW_STATUS_VALUES = Object.values(REVIEW_STATUS);

/** Statuses that never appear on public endpoints. */
export const REVIEW_HIDDEN_STATUSES = [
  REVIEW_STATUS.PENDING,
  REVIEW_STATUS.REJECTED,
  REVIEW_STATUS.BLOCKED,
  REVIEW_STATUS.UNPUBLISHED,
];

/** Statuses that may be restored to pending. */
export const REVIEW_RESTORABLE_STATUSES = [
  REVIEW_STATUS.REJECTED,
  REVIEW_STATUS.BLOCKED,
  REVIEW_STATUS.UNPUBLISHED,
];

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required.'],
      index: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required.'],
      trim: true,
      maxlength: 80,
    },
    rating: {
      type: Number,
      required: [true, 'Star rating is required.'],
      min: [1, 'Rating must be at least 1.'],
      max: [5, 'Rating cannot be more than 5.'],
      validate: {
        validator(value) {
          return Number.isInteger(value);
        },
        message: 'Rating must be a whole number from 1 to 5.',
      },
    },
    body: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    status: {
      type: String,
      enum: REVIEW_STATUS_VALUES,
      default: REVIEW_STATUS.PENDING,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    /**
     * Fingerprint used only for spam / duplicate protection.
     * Never exposed on public APIs.
     */
    submitterKey: {
      type: String,
      trim: true,
      default: '',
      index: true,
      select: false,
    },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, status: 1, submittedAt: -1 });
reviewSchema.index({ status: 1, submittedAt: -1 });
reviewSchema.index({ product: 1, rating: 1, status: 1 });
reviewSchema.index({ product: 1, submitterKey: 1, submittedAt: -1 });

export default mongoose.model('Review', reviewSchema);
