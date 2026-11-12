import { useState } from 'react';
import { Link } from 'react-router-dom';
import { readError, subscribeNewsletter } from '../services/api';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setNote('');
    try {
      const data = await subscribeNewsletter(email);
      setNote(data.message);
      setEmail('');
    } catch (error) {
      setNote(readError(error, 'The list could not be reached. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="footer" id="contact">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/images/logo.jpg" alt="Surprise Fashion Sphere" />
          <p>Your beauty is our priority.</p>
          <p className="footer-order-note">Orders are confirmed on WhatsApp from your bag.</p>
        </div>

        <div>
          <h2>Quick Links</h2>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/shop">Shop</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h2>Customer Care</h2>
          <ul>
            <li><Link to="/help/faqs">FAQs</Link></li>
            <li><Link to="/help/shipping">Shipping & Delivery</Link></li>
            <li><Link to="/help/returns">Returns & Exchanges</Link></li>
            <li><Link to="/help/terms">Terms & Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h2>Stay Connected</h2>
          <p>Get the latest updates and offers.</p>
          <form className="newsletter" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" aria-label="Join the list" disabled={busy}>
              →
            </button>
          </form>
          {note && (
            <p className="form-note" role="status">
              {note}
            </p>
          )}
        </div>
      </div>
      <div className="fine-print">
        <div className="container fine-print-inner">
          <p>© {new Date().getFullYear()} Surprise Fashion Sphere. All rights reserved.</p>
          <p>Thanks for your patronage. We love you.</p>
          <p className="footer-admin">
            <Link to="/admin">Admin</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
