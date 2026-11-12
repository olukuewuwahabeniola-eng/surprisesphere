import StoreSettings from '../models/StoreSettings.js';
import { isDbConnected } from '../config/db.js';

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function fromEnv() {
  return digitsOnly(process.env.WHATSAPP_BUSINESS_NUMBER || process.env.STORE_WHATSAPP_NUMBER || '');
}

export function publicStorePayload(whatsappNumber = '') {
  const digits = digitsOnly(whatsappNumber) || fromEnv();
  return {
    whatsappNumber: digits,
    whatsappConfigured: Boolean(digits),
  };
}

export async function getStoreSettings() {
  if (!isDbConnected()) {
    return publicStorePayload('');
  }

  let settings = await StoreSettings.findOne({ key: 'main' }).lean();
  if (!settings) {
    settings = (await StoreSettings.create({ key: 'main', whatsappNumber: fromEnv() })).toObject();
  }

  return publicStorePayload(settings.whatsappNumber);
}

export async function updateStoreSettings({ whatsappNumber }) {
  const digits = digitsOnly(whatsappNumber);
  const settings = await StoreSettings.findOneAndUpdate(
    { key: 'main' },
    { $set: { whatsappNumber: digits } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return publicStorePayload(settings.whatsappNumber);
}
