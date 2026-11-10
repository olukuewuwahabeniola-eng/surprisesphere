import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

export default mongoose.model('Enquiry', enquirySchema);
