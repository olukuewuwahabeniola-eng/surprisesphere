import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },
  },
  { timestamps: true },
);

export default mongoose.model('Subscriber', subscriberSchema);
