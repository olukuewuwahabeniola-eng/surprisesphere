import { Link } from 'react-router-dom';

const COPY = {
  customers: {
    title: 'Customers',
    body: 'A dedicated customer directory is not implemented yet. Newsletter subscribers exist in the database, but there is no admin customer CRM page.',
  },
  categories: {
    title: 'Categories',
    body: 'Category management APIs already exist at /api/admin/categories. A full Categories admin screen has not been built yet.',
  },
  promotions: {
    title: 'Promotions',
    body: 'Homepage promo banners are stored in HomepageContent, but there is no promotions admin UI yet.',
  },
  'hero-slides': {
    title: 'Hero Slides',
    body: 'Hero slides live in HomepageContent. An admin editor for hero slides has not been built yet.',
  },
  settings: {
    title: 'Settings',
    body: 'General settings beyond WhatsApp are not available yet. Use WhatsApp Settings for the store order number.',
  },
  support: {
    title: 'Support Messages',
    body: 'Contact enquiries can be stored via POST /api/enquiries, but there is no admin inbox UI yet.',
  },
};

export default function AdminPlaceholderPage({ section }) {
  const content = COPY[section] || {
    title: 'Coming soon',
    body: 'This admin section is not implemented yet.',
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-head">
        <div>
          <h1>{content.title}</h1>
          <p>{content.body}</p>
        </div>
      </div>
      <div className="admin-panel">
        <p>
          This navigation item is intentionally honest: the feature is listed for the target
          dashboard structure, but it is not fully built. Existing store tools remain available.
        </p>
        <div className="admin-quick-actions" style={{ marginTop: 16 }}>
          <Link to="/admin">Back to Dashboard</Link>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/orders">Orders &amp; Enquiries</Link>
          <Link to="/admin/whatsapp">WhatsApp Settings</Link>
        </div>
      </div>
    </div>
  );
}
