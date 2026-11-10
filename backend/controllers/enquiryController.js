import mongoose from 'mongoose';
import Enquiry from '../models/Enquiry.js';
import { readEmail, readText } from '../utils/validate.js';

export async function createEnquiry(req, res) {
  const name = readText(req.body?.name, { min: 2, max: 80 });
  const email = readEmail(req.body?.email);
  const message = readText(req.body?.message, { min: 10, max: 1000 });
  const phone = readText(req.body?.phone || '', { min: 0, max: 30 });

  if (!name || !email || !message) {
    res.status(400).json({
      message: 'Add your name, a valid email, and a message of at least 10 characters.',
    });
    return;
  }

  if (req.body?.phone && !phone) {
    res.status(400).json({ message: 'The phone number is too long.' });
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: 'Messages cannot be saved until the store database is connected. Nothing was sent.',
    });
    return;
  }

  await Enquiry.create({ name, email, phone, message });
  res.status(201).json({
    message: 'Your message is saved. The shop will reply when contact details are in use.',
  });
}
