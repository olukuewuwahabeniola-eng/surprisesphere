import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  EngagementBars,
  OverviewLineChart,
  SalesBarChart,
  Sparkline,
  TrafficDoughnut,
} from '../components/admin/AdminCharts';
import useAnimatedNumber from '../hooks/useAnimatedNumber';
import { getAdminDashboard, readError } from '../services/api';
import { formatNaira } from '../utils/money';

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom range' },
];

function formatChange(value) {
  const number = Number(value) || 0;
  const abs = Math.abs(number).toFixed(1).replace(/\.0$/, '');
  return `${number >= 0 ? '↑' : '↓'} ${abs}%`;
}

function timeAgo(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) {
    return 'Just now';
  }
  if (mins < 60) {
    return `${mins} min${mins === 1 ? '' : 's'} ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function activityIcon(type) {
  if (type === 'order_confirmed') return '✓';
  if (type === 'whatsapp_enquiry') return 'W';
  if (type === 'review_pending' || type === 'review_approved') return '★';
  if (type === 'add_to_cart') return '+';
  if (type === 'product_created') return 'P';
  if (type === 'testimonial_published') return 'T';
  return '•';
}

function MetricCard({ card }) {
  const animated = useAnimatedNumber(card.value, { enabled: card.format !== 'money' });
  const display =
    card.format === 'money'
      ? formatNaira(card.value)
      : Math.round(animated).toLocaleString('en-NG');

  return (
    <article className="admin-kpi-card admin-motion-card">
      <div className="admin-kpi-top">
        <span>{card.label}</span>
        <strong>{display}</strong>
      </div>
      <div className="admin-kpi-foot">
        {card.changeAvailable ? (
          <em className={card.change >= 0 ? 'is-up' : 'is-down'}>{formatChange(card.change)}</em>
        ) : (
          <em className="is-muted">Not yet available</em>
        )}
        <Sparkline values={card.spark} color={card.color} />
      </div>
    </article>
  );
}

export default function AdminDashboardPage({ analyticsOnly = false }) {
  const { adminKey } = useOutletContext();
  const [range, setRange] = useState('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const query = useMemo(() => {
    if (range === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return { days: Number(range) || 30 };
  }, [range, customFrom, customTo]);

  useEffect(() => {
    if (!adminKey) {
      return undefined;
    }
    if (range === 'custom' && (!customFrom || !customTo)) {
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');
    setError('');

    getAdminDashboard(adminKey, query)
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(readError(err, 'Could not load dashboard analytics.'));
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adminKey, query, range, customFrom, customTo]);

  const unread = Number(data?.notifications?.unread) || 0;

  const cards = [
    {
      key: 'visitors',
      label: 'Total Visitors',
      value: data?.cards?.visitors?.value ?? 0,
      change: data?.cards?.visitors?.change,
      changeAvailable: Boolean(data?.cards?.visitors?.changeAvailable),
      spark: data?.cards?.visitors?.spark || [],
      color: '#F1D58A',
      format: 'number',
    },
    {
      key: 'cart',
      label: 'Add to Cart',
      value: data?.cards?.addToCart?.value ?? 0,
      change: data?.cards?.addToCart?.change,
      changeAvailable: Boolean(data?.cards?.addToCart?.changeAvailable),
      spark: data?.cards?.addToCart?.spark || [],
      color: '#F1D58A',
      format: 'number',
    },
    {
      key: 'whatsapp',
      label: 'Buy on WhatsApp',
      value: data?.cards?.whatsappEnquiries?.value ?? 0,
      change: data?.cards?.whatsappEnquiries?.change,
      changeAvailable: Boolean(data?.cards?.whatsappEnquiries?.changeAvailable),
      spark: data?.cards?.whatsappEnquiries?.spark || [],
      color: '#F1D58A',
      format: 'number',
    },
    {
      key: 'orders',
      label: 'Confirmed Orders',
      value: data?.cards?.confirmedOrders?.value ?? 0,
      change: data?.cards?.confirmedOrders?.change,
      changeAvailable: Boolean(data?.cards?.confirmedOrders?.changeAvailable),
      spark: data?.cards?.confirmedOrders?.spark || [],
      color: '#F1D58A',
      format: 'number',
    },
    {
      key: 'sales',
      label: 'Confirmed Sales Value',
      value: data?.cards?.confirmedSales?.value ?? 0,
      change: data?.cards?.confirmedSales?.change,
      changeAvailable: Boolean(data?.cards?.confirmedSales?.changeAvailable),
      spark: data?.cards?.confirmedSales?.spark || [],
      color: '#F1D58A',
      format: 'money',
    },
  ];

  return (
    <div className={`admin-dashboard admin-dashboard-motion${status === 'ready' ? ' is-ready' : ''}`}>
      <div className="admin-dashboard-head admin-motion-item">
        <div>
          <h1>{analyticsOnly ? 'Analytics' : 'Admin Dashboard'}</h1>
          <p>Welcome back, Admin! Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <div className="admin-head-actions">
          <button
            type="button"
            className={`admin-bell${unread > 0 ? ' has-unread' : ''}`}
            aria-label={unread > 0 ? `${unread} pending reviews` : 'Notifications'}
            title={unread > 0 ? `${unread} review(s) awaiting approval` : 'No unread notifications'}
          >
            <span aria-hidden="true">🔔</span>
            {unread > 0 ? <b>{unread > 99 ? '99+' : unread}</b> : null}
          </button>
          <label className="admin-range">
            <span className="sr-only">Date range</span>
            <select value={range} onChange={(event) => setRange(event.target.value)}>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {range === 'custom' ? (
        <div className="admin-custom-range admin-motion-item">
          <label>
            From
            <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
          </label>
        </div>
      ) : null}

      {status === 'error' ? <p className="admin-error">{error}</p> : null}
      {status === 'loading' && !data ? <p className="admin-loading">Loading dashboard metrics…</p> : null}

      <section className="admin-kpi-grid" aria-label="Performance summary">
        {cards.map((card, index) => (
          <div key={card.key} className="admin-motion-item" style={{ '--motion-delay': `${index * 45}ms` }}>
            <MetricCard card={card} />
          </div>
        ))}
      </section>

      <section className="admin-analytics-grid">
        <article className="admin-panel admin-panel-wide admin-motion-item" style={{ '--motion-delay': '180ms' }}>
          <div className="admin-panel-head">
            <h2>Overview Analytics</h2>
            <span>{RANGE_OPTIONS.find((option) => option.value === range)?.label || 'Selected range'}</span>
          </div>
          <OverviewLineChart series={data?.overview || []} />
        </article>
        <article className="admin-panel admin-motion-item" style={{ '--motion-delay': '220ms' }}>
          <div className="admin-panel-head">
            <h2>Traffic Sources</h2>
          </div>
          <TrafficDoughnut traffic={data?.traffic} />
        </article>
      </section>

      <section className="admin-mid-grid">
        <article className="admin-panel admin-motion-item" style={{ '--motion-delay': '260ms' }}>
          <div className="admin-panel-head">
            <h2>Top Products</h2>
            <Link to="/admin/products">View All</Link>
          </div>
          {(data?.topProducts || []).length === 0 ? (
            <p className="admin-chart-empty">
              No confirmed product sales yet. Confirm WhatsApp enquiries in Orders to populate this
              list.
            </p>
          ) : (
            <ul className="admin-top-products">
              {data.topProducts.map((product) => (
                <li key={`${product.productId}-${product.name}`}>
                  <img src={product.image || '/images/prod-classic-beret.jpg'} alt="" />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.quantity} sold</span>
                    <div className="admin-progress-track">
                      <span style={{ width: `${Math.min(100, product.share)}%` }} />
                    </div>
                  </div>
                  <em>{product.share}%</em>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-panel admin-motion-item" style={{ '--motion-delay': '300ms' }}>
          <div className="admin-panel-head">
            <h2>Sales Summary</h2>
          </div>
          <p className="admin-sales-total">
            <strong>{formatNaira(data?.salesSummary?.value || 0)}</strong>
            <span>Confirmed sales</span>
            {data?.salesSummary?.changeAvailable ? (
              <em className={(data.salesSummary.change || 0) >= 0 ? 'is-up' : 'is-down'}>
                {formatChange(data.salesSummary.change || 0)}
              </em>
            ) : (
              <em className="is-muted">Not yet available</em>
            )}
          </p>
          <SalesBarChart series={data?.salesSummary?.series || []} />
        </article>

        <article className="admin-panel admin-motion-item" style={{ '--motion-delay': '340ms' }}>
          <div className="admin-panel-head">
            <h2>Customer Engagement</h2>
          </div>
          <EngagementBars engagement={data?.engagement} />
        </article>
      </section>

      {!analyticsOnly ? (
        <section className="admin-bottom-grid">
          <article className="admin-panel admin-motion-item" style={{ '--motion-delay': '380ms' }}>
            <div className="admin-panel-head">
              <h2>Recent Activity</h2>
            </div>
            {(data?.recentActivity || []).length === 0 ? (
              <p className="admin-chart-empty">
                No recent activity yet. Store activity will appear here as customers interact with
                your website.
              </p>
            ) : (
              <ul className="admin-activity-list">
                {data.recentActivity.map((item) => (
                  <li key={item.id}>
                    <span className="admin-activity-icon" aria-hidden="true">
                      {activityIcon(item.type)}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <em>{timeAgo(item.at)}</em>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-panel admin-motion-item" style={{ '--motion-delay': '420ms' }}>
            <div className="admin-panel-head">
              <h2>Quick Actions</h2>
            </div>
            <div className="admin-quick-actions">
              <Link to="/admin/products">Add New Product</Link>
              <Link to="/admin/reviews">Manage Reviews</Link>
              <Link to="/admin/reviews">Upload Testimonial</Link>
              <Link to="/admin/orders">View Orders</Link>
            </div>
          </article>

          <article className="admin-promo-banner admin-motion-item" style={{ '--motion-delay': '460ms' }}>
            <div>
              <p className="eyebrow">Surprise Fashion Sphere</p>
              <h2>Grow Your Fashion Business</h2>
              <p>Track, Manage and Thrive with Surprise Fashion Sphere.</p>
              <Link className="button button-wine button-rect" to="/">
                Visit Store →
              </Link>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
