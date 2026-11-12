import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export default function ContactPage() {
  const { setCartOpen, store } = useShop();

  return (
    <article className="plain-page">
      <div className="container narrow">
        <p className="eyebrow">Contact</p>
        <h1>Contact Us</h1>
        <p>
          Surprise Fashion Sphere takes orders on WhatsApp. Add pieces to your bag, then use
          Proceed to Order on WhatsApp so the shop can confirm availability and share payment and
          delivery instructions.
        </p>
        <p>
          This website does not process payments and does not use an email contact form.
        </p>
        {store?.whatsappConfigured ? (
          <p>The WhatsApp order button in your bag opens a pre-filled message to the store.</p>
        ) : (
          <p>
            The shop WhatsApp number is not published yet. Once it is set in Admin, the bag order
            button will open WhatsApp automatically.
          </p>
        )}
        <div className="contact-actions">
          <button type="button" className="button button-wine" onClick={() => setCartOpen(true)}>
            Open your bag
          </button>
          <Link className="button button-cream" to="/shop">
            Continue shopping
          </Link>
        </div>
      </div>
    </article>
  );
}
