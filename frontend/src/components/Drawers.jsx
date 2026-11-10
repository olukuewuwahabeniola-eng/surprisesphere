import { useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { useBodyLock } from '../hooks/useBodyLock';
import { formatNaira } from '../utils/money';

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
  } = useShop();

  useBodyLock(cartOpen || wishOpen);

  return (
    <>
      <Drawer title="Your bag" open={cartOpen} onClose={() => setCartOpen(false)}>
        {cart.length === 0 ? (
          <p className="drawer-empty">Your bag is empty. Add a piece from the homepage.</p>
        ) : (
          <ul className="drawer-list">
            {cart.map((item) => (
              <li key={item.id}>
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <p>{formatNaira(item.price)}</p>
                  <div className="qty">
                    <button type="button" onClick={() => changeQty(item.id, item.qty - 1)} aria-label="Decrease quantity">
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button type="button" onClick={() => changeQty(item.id, item.qty + 1)} aria-label="Increase quantity">
                      +
                    </button>
                  </div>
                </div>
                <button type="button" className="text-button" onClick={() => removeFromCart(item.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <footer className="drawer-foot">
          <p>
            <span>Subtotal</span>
            <strong>{formatNaira(subtotal)}</strong>
          </p>
          <p className="drawer-note">Checkout, delivery and payment are not open yet. This bag stays on this device.</p>
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
