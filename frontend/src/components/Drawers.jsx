import { useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { useBodyLock } from '../hooks/useBodyLock';
import { trackWhatsAppEnquiry } from '../utils/analytics';
import { formatNaira } from '../utils/money';
import { buildWhatsAppOrderUrl, cartLineKey, lineSubtotal } from '../utils/whatsappOrder';

function Drawer({ title, open, onClose, children }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label="Close panel" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer-head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}

export default function Drawers() {
  const {
    cart,
    wishlist,
    cartOpen,
    wishOpen,
    setCartOpen,
    setWishOpen,
    changeQty,
    removeFromCart,
    toggleWishlist,
    subtotal,
    store,
  } = useShop();

  useBodyLock(cartOpen || wishOpen);

  const orderUrl = buildWhatsAppOrderUrl(store?.whatsappNumber, cart, subtotal);
  const canOrder = Boolean(orderUrl);

  return (
    <>
      <Drawer title="Your bag" open={cartOpen} onClose={() => setCartOpen(false)}>
        {cart.length === 0 ? (
          <p className="drawer-empty">Your bag is empty. Add a piece from the shop.</p>
        ) : (
          <ul className="drawer-list">
            {cart.map((item) => {
              const key = item.lineKey || cartLineKey(item);
              const variation = [item.size && `Size: ${item.size}`, item.colour && `Colour: ${item.colour}`]
                .filter(Boolean)
                .join(' · ');
              return (
                <li key={key}>
                  <img src={item.image} alt="" />
                  <div>
                    <strong>{item.name}</strong>
                    {variation && <p className="drawer-variant">{variation}</p>}
                    <p className="drawer-unit">{formatNaira(item.price)} each</p>
                    <div className="qty">
                      <button
                        type="button"
                        onClick={() => changeQty(key, item.qty - 1)}
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(key, item.qty + 1)}
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <p className="drawer-line-total">Subtotal {formatNaira(lineSubtotal(item))}</p>
                  </div>
                  <button type="button" className="text-button" onClick={() => removeFromCart(key)}>
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <footer className="drawer-foot">
          <p>
            <span>Grand total</span>
            <strong>{formatNaira(subtotal)}</strong>
          </p>
          {cart.length > 0 && (
            <>
              {canOrder ? (
                <a
                  className="button button-wine button-block button-rect whatsapp-order"
                  href={orderUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    trackWhatsAppEnquiry({
                      channel: 'cart',
                      items: cart.map((item) => ({
                        productId: item.id,
                        name: item.name,
                        size: item.size,
                        colour: item.colour,
                        price: item.price,
                        qty: item.qty,
                        image: item.image,
                      })),
                    });
                  }}
                >
                  Proceed to Order on WhatsApp
                </a>
              ) : (
                <p className="drawer-note">
                  WhatsApp ordering is not ready yet. The store still needs to set its business number in Admin.
                </p>
              )}
              <p className="drawer-note">
                This opens WhatsApp with your bag details. The shop will confirm availability, then share payment and delivery instructions. No payment is taken on this website.
              </p>
            </>
          )}
        </footer>
      </Drawer>

      <Drawer title="Wishlist" open={wishOpen} onClose={() => setWishOpen(false)}>
        {wishlist.length === 0 ? (
          <p className="drawer-empty">Nothing saved yet. Use the heart on a product to keep it here.</p>
        ) : (
          <ul className="drawer-list">
            {wishlist.map((item) => (
              <li key={item.id}>
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <p>{formatNaira(item.price)}</p>
                </div>
                <button type="button" className="text-button" onClick={() => toggleWishlist(item)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </>
  );
}
