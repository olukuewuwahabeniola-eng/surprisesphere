import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getStoredAdminKey, setStoredAdminKey } from '../../utils/adminAuth';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true, ready: true },
  { to: '/admin/products', label: 'Products', ready: true },
  { to: '/admin/orders', label: 'Orders & Enquiries', ready: true },
  { to: '/admin/reviews', label: 'Reviews & Testimonials', ready: true },
  { to: '/admin/customers', label: 'Customers', ready: false },
  { to: '/admin/categories', label: 'Categories', ready: true },
  { to: '/admin/promotions', label: 'Promotions', ready: false },
  { to: '/admin/hero-slides', label: 'Hero Slides', ready: false },
  { to: '/admin/whatsapp', label: 'WhatsApp Settings', ready: true },
  { to: '/admin/analytics', label: 'Analytics', ready: true },
  { to: '/admin/settings', label: 'Settings', ready: false },
  { to: '/admin/support', label: 'Support Messages', ready: false },
];

function Icon({ name }) {
  const paths = {
    dashboard: 'M4 4h7v7H4V4Zm9 0h7v5h-7V4ZM4 13h7v7H4v-7Zm9 3h7v4h-7v-4Z',
    products: 'M4 7 12 3l8 4v10l-8 4-8-4V7Zm8 4 7-3.5M12 11v9',
    orders: 'M6 6h12l-1 12H7L6 6Zm3-3h6v3H9V3Z',
    reviews: 'M4 5h16v10H8l-4 4V5Z',
    customers: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 8a8 8 0 0 1 16 0',
    categories: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
    promotions: 'M5 12 12 4l7 8-7 8-7-8Zm7-3v6',
    hero: 'M4 6h16v12H4V6Zm3 3 3 4 2-2 4 5',
    whatsapp: 'M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Zm-3 6h6M9 12h6',
    analytics: 'M5 19V9m5 10V5m5 14v-7m5 7V8',
    settings: 'M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4Zm8 4a8 8 0 0 1-.3 2.1l2 1.5-2 3.4-2.4-.6a8.2 8.2 0 0 1-1.8 1l-.4 2.5h-4l-.4-2.5a8.2 8.2 0 0 1-1.8-1l-2.4.6-2-3.4 2-1.5A8 8 0 0 1 4 12a8 8 0 0 1 .3-2.1l-2-1.5 2-3.4 2.4.6a8.2 8.2 0 0 1 1.8-1L9 2h4l.4 2.5a8.2 8.2 0 0 1 1.8 1l2.4-.6 2 3.4-2 1.5A8 8 0 0 1 20 12Z',
    support: 'M5 11a7 7 0 0 1 14 0v5a3 3 0 0 1-3 3h-2v-5h5M5 16h5v5H8a3 3 0 0 1-3-3v-2Z',
    logout: 'M10 5H5v14h5M13 12h8M17 8l4 4-4 4',
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.dashboard} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  '/admin': 'dashboard',
  '/admin/products': 'products',
  '/admin/orders': 'orders',
  '/admin/reviews': 'reviews',
  '/admin/customers': 'customers',
  '/admin/categories': 'categories',
  '/admin/promotions': 'promotions',
  '/admin/hero-slides': 'hero',
  '/admin/whatsapp': 'whatsapp',
  '/admin/analytics': 'analytics',
  '/admin/settings': 'settings',
  '/admin/support': 'support',
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminKey, setAdminKey] = useState(() => getStoredAdminKey());
  const [keyDraft, setKeyDraft] = useState(() => getStoredAdminKey());
  const hasKey = Boolean(adminKey);

  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  const nav = useMemo(() => NAV_ITEMS, []);

  function unlock(event) {
    event.preventDefault();
    const next = String(keyDraft || '').trim();
    setStoredAdminKey(next);
    setAdminKey(next);
  }

  function logout() {
    setStoredAdminKey('');
    setAdminKey('');
    setKeyDraft('');
    navigate('/admin');
  }

  if (!hasKey) {
    return (
      <div className="admin-shell admin-locked">
        <form className="admin-unlock" onSubmit={unlock}>
          <p className="eyebrow">Surprise Fashion Sphere</p>
          <h1>Admin access</h1>
          <p>Enter the store admin key to open the dashboard. The key stays in this browser only.</p>
          <label>
            Admin key
            <input
              type="password"
              value={keyDraft}
              onChange={(event) => setKeyDraft(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="button button-wine">
            Unlock dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`admin-shell${sidebarOpen ? ' is-sidebar-open' : ''}`}>
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">
            S
          </span>
          <div>
            <strong>Surprise</strong>
            <em>Fashion Sphere</em>
          </div>
        </div>

        <nav className="admin-nav">
          {nav.map((item) =>
            item.ready ? (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon name={ICONS[item.to]} />
                <span>{item.label}</span>
              </NavLink>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `is-pending${isActive ? ' is-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                title={item.note || 'Not yet implemented'}
              >
                <Icon name={ICONS[item.to]} />
                <span>{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="admin-side-promo">
            <p>Fashion. Elegance. You.</p>
            <Link to="/" className="button button-cream button-rect">
              Visit Store →
            </Link>
          </div>
          <button type="button" className="admin-logout" onClick={logout}>
            <Icon name="logout" />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="admin-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="admin-profile-chip">
            <span className="admin-avatar" aria-hidden="true">
              A
            </span>
            <div>
              <strong>Super Admin</strong>
              <em>Store manager</em>
            </div>
          </div>
        </header>
        <Outlet context={{ adminKey, setAdminKey, logout }} />
      </div>
    </div>
  );
}
