import mongoose from 'mongoose';
import Subscriber from '../models/Subscriber.js';
import { readEmail } from '../utils/validate.js';

export async function subscribe(req, res) {
  const email = readEmail(req.body?.email);

  if (!email) {
    res.status(400).json({ message: 'Enter a valid email address.' });
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: 'The mailing list is not connected yet. Your address was not saved.',
    });
    return;
  }

  await Subscriber.updateOne({ email }, { $set: { email } }, { upsert: true });
  res.status(201).json({
    message: 'You are on the list. We will write when there is something to send.',
  });
}
