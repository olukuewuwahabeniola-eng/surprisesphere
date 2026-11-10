import { useState } from 'react';
import { readError, sendEnquiry } from '../services/api';

const initial = { name: '', email: '', phone: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState(initial);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setNote('');
    try {
      const data = await sendEnquiry(form);
      setNote(data.message);
      setForm(initial);
    } catch (error) {
      setNote(readError(error, 'The message could not be sent. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="plain-page">
      <div className="container narrow">
        <p className="eyebrow">Contact</p>
        <h1>Contact Us</h1>
        <p>
          Send a note to the shop. A public phone number, email address and WhatsApp line will be shown here once they are provided.
        </p>
        <form className="contact-form" onSubmit={onSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={update} required minLength={2} maxLength={80} />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={update} required />
          </label>
          <label>
            Phone <span>(optional)</span>
            <input name="phone" value={form.phone} onChange={update} maxLength={30} />
          </label>
          <label>
            Message
            <textarea name="message" value={form.message} onChange={update} required minLength={10} maxLength={1000} rows={5} />
          </label>
          <button type="submit" className="button button-wine" disabled={busy}>
            {busy ? 'Sending…' : 'Send message'}
          </button>
        </form>
        {note && (
          <p className="form-note" role="status">
            {note}
          </p>
        )}
      </div>
    </article>
  );
}
