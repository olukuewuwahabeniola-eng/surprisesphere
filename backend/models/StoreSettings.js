import mongoose from 'mongoose';

const storeSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'main',
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
      maxlength: 32,
    },
  },
  { timestamps: true },
);

export default mongoose.model('StoreSettings', storeSettingsSchema);
