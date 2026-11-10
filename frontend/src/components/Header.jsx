import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { navigation } from '../data/navigation';
import { formatNaira } from '../utils/money';

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16.5 20 20.5" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.4-2.8 3.6-4.2 6.5-4.2s5.1 1.4 6.5 4.2" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19.4 5.6 13a3.8 3.8 0 0 1 5.4-5.4L12 8.6l1-1a3.8 3.8 0 0 1 5.4 5.4L12 19.4Z" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 8.5h11l-.8 10.2a1.5 1.5 0 0 1-1.5 1.3H8.8a1.5 1.5 0 0 1-1.5-1.3L6.5 8.5Z" />
      <path d="M9 8.4V7.2A3 3 0 0 1 12 4a3 3 0 0 1 3 3.2v1.2" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default function Header() {
  const {
    products,
    cartCount,
    wishlist,
    setCartOpen,
    setWishOpen,
    accountOpen,
    setAccountOpen,
  } = useShop();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.hash, setAccountOpen]);

  const results =
    query.trim().length === 0
      ? []
      : products
          .filter((product) => {
            const haystack = `${product.name} ${product.categoryLabel}`.toLowerCase();
            return haystack.includes(query.trim().toLowerCase());
          })
          .slice(0, 6);

  function openProduct(id) {
    setQuery('');
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#product-${id}`);
      return;
    }
    document.getElementById(`product-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <header className="site-header">
      <div className="header-main">
        <Link to="/" className="brand">
          <img src="/images/logo.jpg" alt="Surprise Fashion Sphere" />
          <p>Your beauty is our priority</p>
        </Link>

        <form
          className="search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            if (results[0]) {
              openProduct(results[0].id);
            }
          }}
        >
          <label className="sr-only" htmlFor="site-search">
            Search the shop
          </label>
          <input
            id="site-search"
            type="search"
            placeholder="Search for bags, shoes, berets, headbands..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          <button type="submit" aria-label="Search">
            <IconSearch />
          </button>
          {query.trim() && (
            <div className="search-panel">
              {results.length === 0 ? (
                <p className="search-empty">No matching pieces on the homepage yet.</p>
              ) : (
                results.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="search-result"
                    onClick={() => openProduct(product.id)}
                  >
                    <img src={product.image} alt="" />
                    <span>
                      <strong>{product.name}</strong>
                      <em>{formatNaira(product.price)}</em>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </form>

        <div className="header-actions">
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <IconMenu />
            <span className="sr-only">Menu</span>
          </button>

          <div className="account-wrap">
            <button
              type="button"
              className="icon-button"
              aria-expanded={accountOpen}
              onClick={() => {
                setAccountOpen((open) => !open);
                setCartOpen(false);
                setWishOpen(false);
              }}
            >
              <IconUser />
              <span className="action-label">Account</span>
            </button>
            {accountOpen && (
              <div className="account-pop" role="dialog" aria-label="Account">
                <p>Sign in and registration are not open yet.</p>
                <p>Pieces you save stay in the bag and wishlist on this device.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={() => {
              setWishOpen(true);
              setCartOpen(false);
              setAccountOpen(false);
            }}
          >
            <IconHeart />
            <span className="action-label">Wishlist</span>
            {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={() => {
              setCartOpen(true);
              setWishOpen(false);
              setAccountOpen(false);
            }}
          >
            <IconBag />
            <span className="action-label">Cart</span>
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      <nav id="site-nav" className={menuOpen ? 'nav is-open' : 'nav'} aria-label="Primary">
        {navigation.map((item) => (
          <div className="nav-item" key={item.label}>
            <Link
              to={item.href}
              className="nav-link"
              aria-current={item.label === 'Home' && location.pathname === '/' ? 'page' : undefined}
            >
              {item.label}
              {item.children && (
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2.2 4.2 6 8l3.8-3.8" />
                </svg>
              )}
            </Link>
            {item.children && (
              <div className="nav-panel">
                {item.children.map((child) => (
                  <Link key={child.label} to={child.href}>
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}
