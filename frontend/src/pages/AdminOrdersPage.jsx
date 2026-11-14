import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { listAdminOrders, readError, updateAdminOrder } from '../services/api';
import { formatNaira } from '../utils/money';

export default function AdminOrdersPage() {
  const { adminKey } = useOutletContext();
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    if (!adminKey) {
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const data = await listAdminOrders(adminKey, {
        status: statusFilter || undefined,
        pageSize: 50,
      });
      setOrders(data.orders || []);
      setStatus('ready');
    } catch (err) {
      setError(readError(err, 'Could not load WhatsApp order enquiries.'));
      setStatus('error');
    }
  }, [adminKey, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmOrder(order) {
    const suggested = Number(order.enquiryTotal) || 0;
    const raw = window.prompt(
      'Confirm this WhatsApp enquiry as a sale. Enter the confirmed sales value in naira:',
      String(suggested),
    );
    if (raw == null) {
      return;
    }
    const salesValue = Number(raw);
    if (!Number.isFinite(salesValue) || salesValue < 0) {
      setNote('Enter a valid sales value.');
      return;
    }
    setBusyId(order.id);
    setNote('');
    try {
      await updateAdminOrder(adminKey, order.id, {
        status: 'confirmed',
        salesValue,
      });
      setNote('Order confirmed. Dashboard sales metrics will include this amount.');
      await load();
    } catch (err) {
      setNote(readError(err, 'Could not confirm order.'));
    } finally {
      setBusyId('');
    }
  }

  async function cancelOrder(order) {
    setBusyId(order.id);
    setNote('');
    try {
      await updateAdminOrder(adminKey, order.id, { status: 'cancelled' });
      setNote('Order enquiry cancelled.');
      await load();
    } catch (err) {
      setNote(readError(err, 'Could not cancel order.'));
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="admin-dashboard admin-orders-page">
      <div className="admin-dashboard-head">
        <div>
          <h1>Orders &amp; Enquiries</h1>
          <p>
            WhatsApp order clicks create enquiries here. Only manually confirmed records count as
            sales.
          </p>
        </div>
        <label className="admin-range">
          <span className="sr-only">Status filter</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="enquiry">Enquiries</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>

      {note ? <p className="review-success">{note}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {status === 'loading' ? <p className="admin-loading">Loading enquiries…</p> : null}

      <div className="admin-orders-list">
        {status === 'ready' && orders.length === 0 ? (
          <p className="admin-chart-empty">
            No WhatsApp order enquiries yet. They appear when customers use Order via WhatsApp.
          </p>
        ) : null}
        {orders.map((order) => (
          <article key={order.id} className="admin-order-card">
            <div>
              <p className="eyebrow">{order.status}</p>
              <h2>
                {order.itemCount} item{order.itemCount === 1 ? '' : 's'} · Enquiry{' '}
                {formatNaira(order.enquiryTotal)}
              </h2>
              <p>
                {new Date(order.createdAt).toLocaleString()} · via {order.channel}
              </p>
              <ul>
                {(order.items || []).map((item, index) => (
                  <li key={`${item.productId}-${index}`}>
                    {item.name}
                    {item.size ? ` · ${item.size}` : ''}
                    {item.colour ? ` · ${item.colour}` : ''} × {item.qty} — {formatNaira(item.price)}
                  </li>
                ))}
              </ul>
              {order.status === 'confirmed' ? (
                <p>
                  Confirmed sales value: <strong>{formatNaira(order.salesValue)}</strong>
                </p>
              ) : null}
            </div>
            <div className="admin-order-actions">
              {order.status !== 'confirmed' ? (
                <button
                  type="button"
                  className="button button-wine button-rect"
                  disabled={busyId === order.id}
                  onClick={() => confirmOrder(order)}
                >
                  Confirm as sale
                </button>
              ) : null}
              {order.status !== 'cancelled' ? (
                <button
                  type="button"
                  className="button button-cream button-rect"
                  disabled={busyId === order.id}
                  onClick={() => cancelOrder(order)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
