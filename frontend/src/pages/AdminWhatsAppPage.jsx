import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getStore, readError, updateStoreSettings } from '../services/api';

export default function AdminWhatsAppPage() {
  const { adminKey } = useOutletContext();
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
    <div className="admin-dashboard">
      <div className="admin-dashboard-head">
        <div>
          <h1>WhatsApp Settings</h1>
          <p>
            Set the WhatsApp business number used for cart and product order enquiries. Use digits
            with country code and no plus sign.
          </p>
        </div>
      </div>

      <div className="admin-panel" style={{ maxWidth: 560 }}>
        <p className="admin-current">
          Current number:{' '}
          <strong>{current.whatsappConfigured ? current.whatsappNumber : 'Not set'}</strong>
        </p>
        <form className="contact-form" onSubmit={onSubmit}>
          <label>
            WhatsApp business number
            <input
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              placeholder="2348012345678"
              inputMode="numeric"
            />
          </label>
          {note ? <p className="form-note">{note}</p> : null}
          <button type="submit" className="button button-wine" disabled={busy}>
            {busy ? 'Saving…' : 'Save WhatsApp number'}
          </button>
        </form>
      </div>
    </div>
  );
}
