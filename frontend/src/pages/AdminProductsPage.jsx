import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminProductForm, {
  blankProductForm,
  productToForm,
} from '../components/AdminProductForm';
import {
  createAdminProduct,
  deleteAdminProduct,
  listAdminCategories,
  listAdminProducts,
  readError,
  updateAdminProduct,
} from '../services/api';
import { getStoredAdminKey, setStoredAdminKey } from '../utils/adminAuth';
import { formatNaira } from '../utils/money';

const PAGE_SIZE = 12;

export default function AdminProductsPage() {
  const [adminKey, setAdminKey] = useState(() => getStoredAdminKey());
  const [keyDraft, setKeyDraft] = useState(() => getStoredAdminKey());
  const [authorized, setAuthorized] = useState(Boolean(getStoredAdminKey()));

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(blankProductForm());
  const [busy, setBusy] = useState(false);

  const categoryLabelById = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  const loadCatalogue = useCallback(async () => {
    if (!adminKey) {
      setAuthorized(false);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setError('');
    try {
      const [productData, categoryData] = await Promise.all([
        listAdminProducts(adminKey, {
          page,
          pageSize: PAGE_SIZE,
          status: statusFilter,
          category: categoryFilter || undefined,
          q: search || undefined,
          sort: 'newest',
        }),
        listAdminCategories(adminKey, { status: 'all', pageSize: 100, sort: 'name' }),
      ]);

      setProducts(productData.products || []);
      setPagination(productData.pagination || null);
      setCategories(categoryData.categories || []);
      setAuthorized(true);
      setStatus('ready');
    } catch (err) {
      const message = readError(err, 'Could not load admin products.');
      setError(message);
      setStatus('error');
      if (err?.response?.status === 401) {
        setAuthorized(false);
      }
    }
  }, [adminKey, page, statusFilter, categoryFilter, search]);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  function unlockAdmin(event) {
    event.preventDefault();
    const nextKey = String(keyDraft || '').trim();
    setStoredAdminKey(nextKey);
    setAdminKey(nextKey);
    setPage(1);
    setNote('');
  }

  function openCreate() {
    setFormMode('create');
    setEditingId('');
    setForm(blankProductForm());
    setFormOpen(true);
    setNote('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEdit(product) {
    setFormMode('edit');
    setEditingId(product.id);
    setForm(productToForm(product));
    setFormOpen(true);
    setNote('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId('');
    setForm(blankProductForm());
  }

  async function handleSave(payload) {
    setBusy(true);
    setNote('');
    setError('');
    try {
      if (formMode === 'edit' && editingId) {
        await updateAdminProduct(adminKey, editingId, payload);
        setNote('Product updated.');
      } else {
        await createAdminProduct(adminKey, payload);
        setNote('Product created.');
      }
      closeForm();
      await loadCatalogue();
    } catch (err) {
      setError(readError(err, 'Could not save the product.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete “${product.name}”? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setError('');
    setNote('');
    try {
      await deleteAdminProduct(adminKey, product.id);
      setNote(`Deleted “${product.name}”.`);
      if (editingId === product.id) {
        closeForm();
      }
      await loadCatalogue();
    } catch (err) {
      setError(readError(err, 'Could not delete the product.'));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(product) {
    setBusy(true);
    setError('');
    try {
      await updateAdminProduct(adminKey, product.id, { active: !product.active });
      setNote(product.active ? 'Product set to inactive.' : 'Product published.');
      await loadCatalogue();
    } catch (err) {
      setError(readError(err, 'Could not update product status.'));
    } finally {
      setBusy(false);
    }
  }

  function applySearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(String(searchInput || '').trim());
  }

  return (
    <article className="plain-page admin-page admin-products-page">
      <div className="container">
        <div className="admin-products-head">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Product management</h1>
            <p>Create, edit and organise catalogue pieces for Surprise Fashion Sphere.</p>
          </div>
          <div className="admin-products-nav">
            <Link className="text-button" to="/admin">
              ← Store settings
            </Link>
            <Link className="text-button" to="/admin/reviews">
              Reviews
            </Link>
            {authorized && (
              <button type="button" className="button button-wine" onClick={openCreate}>
                Add new product
              </button>
            )}
          </div>
        </div>

        <section className="admin-key-card">
          <form className="admin-key-form" onSubmit={unlockAdmin}>
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
            <button type="submit" className="button button-wine button-rect">
              {authorized ? 'Update key' : 'Unlock products'}
            </button>
          </form>
          <p className="admin-help">
            The key stays in this browser only. It is sent as a request header and is never stored in
            frontend environment files.
          </p>
        </section>

        {!authorized ? (
          <p className="form-note" role="status">
            Enter a valid admin key to manage products.
          </p>
        ) : (
          <>
            {formOpen && (
              <section className="admin-panel" aria-label={formMode === 'edit' ? 'Edit product' : 'Add product'}>
                <div className="admin-panel-head">
                  <h2>{formMode === 'edit' ? 'Edit product' : 'Add new product'}</h2>
                </div>
                <AdminProductForm
                  form={form}
                  categories={categories}
                  adminKey={adminKey}
                  busy={busy}
                  mode={formMode}
                  onChange={setForm}
                  onSubmit={handleSave}
                  onCancel={closeForm}
                />
              </section>
            )}

            <section className="admin-toolbar" aria-label="Product filters">
              <form className="admin-search" onSubmit={applySearch}>
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                />
                <button type="submit" className="button button-wine button-rect">
                  Search
                </button>
              </form>

              <label>
                Category
                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    setPage(1);
                    setCategoryFilter(event.target.value);
                  }}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setPage(1);
                    setStatusFilter(event.target.value);
                  }}
                >
                  <option value="all">All</option>
                  <option value="active">Published</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </section>

            {note && (
              <p className="form-note" role="status">
                {note}
              </p>
            )}
            {error && (
              <p className="form-note admin-error" role="alert">
                {error}
              </p>
            )}

            {status === 'loading' && <p className="admin-state">Loading products…</p>}

            {status === 'ready' && products.length === 0 && (
              <div className="admin-empty">
                <h2>No products found</h2>
                <p>Try a different search, or add a new product to the catalogue.</p>
                <button type="button" className="button button-wine" onClick={openCreate}>
                  Add new product
                </button>
              </div>
            )}

            {products.length > 0 && (
              <div className="admin-product-table-wrap">
                <table className="admin-product-table">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Category</th>
                      <th scope="col">Price</th>
                      <th scope="col">Options</th>
                      <th scope="col">Stock</th>
                      <th scope="col">Flags</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td data-label="Product">
                          <div className="admin-product-cell">
                            <img
                              src={product.image || product.images?.[0]?.url || '/images/logo.jpg'}
                              alt=""
                            />
                            <div>
                              <strong>{product.name}</strong>
                              <span className="admin-muted">{product.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Category">
                          {product.categoryLabel ||
                            categoryLabelById.get(product.categoryId) ||
                            product.category ||
                            '—'}
                        </td>
                        <td data-label="Price">{formatNaira(product.price)}</td>
                        <td data-label="Options">
                          <span className="admin-muted">
                            {[
                              product.sizes?.length ? `Sizes: ${product.sizes.join(', ')}` : '',
                              product.colours?.length ? `Colours: ${product.colours.join(', ')}` : '',
                            ]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </span>
                        </td>
                        <td data-label="Stock">{product.stock ?? 0}</td>
                        <td data-label="Flags">
                          <div className="admin-pill-row">
                            {product.bestSeller && <span className="admin-pill">Best Seller</span>}
                            {product.newArrival && <span className="admin-pill">New Arrival</span>}
                            {!product.bestSeller && !product.newArrival && (
                              <span className="admin-muted">—</span>
                            )}
                          </div>
                        </td>
                        <td data-label="Status">
                          <span className={product.active ? 'admin-status is-on' : 'admin-status'}>
                            {product.active ? 'Published' : 'Inactive'}
                          </span>
                        </td>
                        <td data-label="Actions">
                          <div className="admin-row-actions">
                            <button type="button" className="text-button" onClick={() => openEdit(product)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-button"
                              onClick={() => toggleActive(product)}
                              disabled={busy}
                            >
                              {product.active ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              type="button"
                              className="text-button admin-danger"
                              onClick={() => handleDelete(product)}
                              disabled={busy}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  type="button"
                  className="button button-cream button-rect"
                  disabled={page <= 1 || busy}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>
                <p>
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} products
                </p>
                <button
                  type="button"
                  className="button button-cream button-rect"
                  disabled={!pagination.hasMore || busy}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
