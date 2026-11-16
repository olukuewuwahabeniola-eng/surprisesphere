import { getStoreSettings, updateStoreSettings } from '../services/storeService.js';
import { isDbConnected } from '../config/db.js';
import { assertMongoReady } from '../utils/assertMongo.js';

export async function getStore(_req, res) {
  const store = await getStoreSettings();
  res.json({
    ...store,
    source: isDbConnected() ? 'mongodb' : 'env',
  });
}

export async function putStore(req, res) {
  await assertMongoReady('MongoDB must be connected to save the WhatsApp business number.');

  const store = await updateStoreSettings({
    whatsappNumber: req.body?.whatsappNumber,
  });

  res.json({
    message: store.whatsappConfigured
      ? 'WhatsApp business number saved.'
      : 'WhatsApp business number cleared.',
    ...store,
  });
}
