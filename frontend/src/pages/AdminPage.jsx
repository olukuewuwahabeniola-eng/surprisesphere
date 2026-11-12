import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStore, readError, updateStoreSettings } from '../services/api';
import { getStoredAdminKey, setStoredAdminKey } from '../utils/adminAuth';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(() => getStoredAdminKey());
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [current, setCurrent] = useState({ whatsappNumber: '', whatsappConfigured: false });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getStore()
      .then((data) => {
        setCurrent(data);
        setWhatsappNumber(data.whatsappNumber || '');
      })
      .catch((error) => {
        setNote(readError(error, 'Could not load store settings.'));
      });
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setNote('');
    try {
      setStoredAdminKey(adminKey);
      const data = await updateStoreSettings({
        adminKey,
        whatsappNumber,
      });
      setCurrent(data);
      setWhatsappNumber(data.whatsappNumber || '');
      setNote(data.message || 'Saved.');
    } catch (error) {
      setNote(readError(error, 'Could not save store settings.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="plain-page admin-page">
      <div className="container narrow">
        <p className="eyebrow">Admin</p>
        <h1>Store settings</h1>
        <p>
          Set the WhatsApp business number used for cart orders. Use digits with country code and no
          plus sign (example: 2348012345678). Do not invent a number.
        </p>

        <nav className="admin-section-nav" aria-label="Admin sections">
          <Link className="button button-wine button-rect" to="/admin/products">
            Product management
          </Link>
          <Link className="button button-cream button-rect" to="/admin/reviews">
            Reviews &amp; Testimonials
          </Link>
        </nav>

        <p className="admin-current">
          Current number:{' '}
          <strong>{current.whatsappConfigured ? current.whatsappNumber : 'Not set'}</strong>
        </p>

        <form className="contact-form" onSubmit={onSubmit}>
          <label>
            Admin key
            <input
              type="password"
              name="adminKey"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <label>
            WhatsApp business number
            <input
              name="whatsappNumber"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              inputMode="numeric"
              placeholder="2348012345678"
              maxLength={32}
            />
          </label>
          <button type="submit" className="button button-wine" disabled={busy}>
            {busy ? 'Saving…' : 'Save WhatsApp number'}
          </button>
        </form>

        {note && (
          <p className="form-note" role="status">
            {note}
          </p>
        )}

        <p className="drawer-note">
          Manage catalogue products and customer reviews from the admin links above. This page only
          updates the order WhatsApp number.
        </p>
      </div>
    </article>
  );
}
