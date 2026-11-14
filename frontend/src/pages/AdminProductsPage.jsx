import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import AdminProductBatchUpload from '../components/AdminProductBatchUpload';
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
  const outlet = useOutletContext() || {};
  const [adminKey, setAdminKey] = useState(() => outlet.adminKey || getStoredAdminKey());
  const [keyDraft, setKeyDraft] = useState(() => outlet.adminKey || getStoredAdminKey());
  const [authorized, setAuthorized] = useState(Boolean(outlet.adminKey || getStoredAdminKey()));

  useEffect(() => {
    if (outlet.adminKey) {
      setAdminKey(outlet.adminKey);
      setKeyDraft(outlet.adminKey);
    }
  }, [outlet.adminKey]);

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
  const [stockFilter, setStockFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [mode, setMode] = useState('list'); // list | upload | edit
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
          sort,
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
  }, [adminKey, page, statusFilter, categoryFilter, search, sort]);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  const visibleProducts = useMemo(() => {
    if (stockFilter === 'all') return products;
    if (stockFilter === 'in') return products.filter((product) => Number(product.stock) > 0);
    return products.filter((product) => Number(product.stock) <= 0);
  }, [products, stockFilter]);

  const stats = useMemo(() => {
    const total = pagination?.total ?? products.length;
    const published = products.filter((product) => product.active).length;
    const inactive = products.filter((product) => !product.active).length;
    return { total, published, inactive, pageCount: visibleProducts.length };
  }, [pagination, products, visibleProducts]);

  function unlockAdmin(event) {
    event.preventDefault();
    const nextKey = String(keyDraft || '').trim();
    setStoredAdminKey(nextKey);
    setAdminKey(nextKey);
    setPage(1);
    setNote('');
  }

  function openUpload() {
    setMode('upload');
    setEditingId('');
    setForm(blankProductForm());
    setNote('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEdit(product) {
    setMode('edit');
    setEditingId(product.id);
    setForm(productToForm(product));
    setNote('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeEditor() {
    setMode('list');
    setEditingId('');
    setForm(blankProductForm());
  }

  async function handleSave(payload) {
    setBusy(true);
    setNote('');
    setError('');
    try {
      if (mode === 'edit' && editingId) {
        await updateAdminProduct(adminKey, editingId, payload);
        setNote('Product updated.');
      } else {
        await createAdminProduct(adminKey, payload);
        setNote('Product created.');
      }
      closeEditor();
      await loadCatalogue();
    } catch (err) {
      setError(readError(err, 'Could not save the product.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete “${product.name}”? This removes the product and its colour variants from the catalogue. Order history is kept.`,
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
        closeEditor();
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
            <h1>Products</h1>
            <p>
              Upload, edit and organise catalogue pieces. One design stays one product — colours are
              variants with their own pictures.
            </p>
          </div>
          <div className="admin-products-nav">
            <Link className="text-button" to="/admin">
              ← Dashboard
            </Link>
            <Link className="text-button" to="/admin/categories">
              Categories
            </Link>
            {authorized && mode === 'list' ? (
              <button type="button" className="button button-wine button-rect" onClick={openUpload}>
                Upload Product
              </button>
            ) : null}
          </div>
        </div>

        {!outlet.adminKey ? (
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
          </section>
        ) : null}

        {!authorized ? (
          <p className="form-note" role="status">
            Enter a valid admin key to manage products.
          </p>
        ) : (
          <>
            {mode === 'list' ? (
              <section className="admin-stat-row" aria-label="Product statistics">
                <article className="admin-stat-card">
                  <p>Total products</p>
                  <strong>{stats.total}</strong>
                </article>
                <article className="admin-stat-card">
                  <p>On this page</p>
                  <strong>{stats.pageCount}</strong>
                </article>
                <article className="admin-stat-card">
                  <p>Published (page)</p>
                  <strong>{stats.published}</strong>
                </article>
                <article className="admin-stat-card">
                  <p>Inactive (page)</p>
                  <strong>{stats.inactive}</strong>
                </article>
              </section>
            ) : null}

            {mode === 'upload' ? (
              <AdminProductBatchUpload
                categories={categories}
                adminKey={adminKey}
                onClose={closeEditor}
                onCompleted={loadCatalogue}
              />
            ) : null}

            {mode === 'edit' ? (
              <section className="admin-panel" aria-label="Edit product">
                <div className="admin-panel-head">
                  <h2>Edit product</h2>
                  <button type="button" className="button button-wine button-rect" onClick={closeEditor}>
                    Back to list
                  </button>
                </div>
                <AdminProductForm
                  form={form}
                  categories={categories}
                  adminKey={adminKey}
                  busy={busy}
                  mode="edit"
                  onChange={setForm}
                  onSubmit={handleSave}
                  onCancel={closeEditor}
                />
              </section>
            ) : null}

            {mode === 'list' ? (
              <>
                <section className="admin-toolbar" aria-label="Product filters">
                  <form className="admin-search" onSubmit={applySearch}>
                    <input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search by product name"
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

                  <label>
                    Stock
                    <select
                      value={stockFilter}
                      onChange={(event) => setStockFilter(event.target.value)}
                    >
                      <option value="all">All stock</option>
                      <option value="in">In stock</option>
                      <option value="out">Out of stock</option>
                    </select>
                  </label>

                  <label>
                    Sort
                    <select
                      value={sort}
                      onChange={(event) => {
                        setPage(1);
                        setSort(event.target.value);
                      }}
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="name">Name</option>
                      <option value="price-asc">Price ↑</option>
                      <option value="price-desc">Price ↓</option>
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

                {status === 'ready' && visibleProducts.length === 0 && (
                  <div className="admin-empty">
                    <h2>No products found</h2>
                    <p>Try a different search, or upload new products to the catalogue.</p>
                    <button type="button" className="button button-wine button-rect" onClick={openUpload}>
                      Upload Product
                    </button>
                  </div>
                )}

                {visibleProducts.length > 0 && (
                  <div className="admin-product-table-wrap">
                    <table className="admin-product-table">
                      <thead>
                        <tr>
                          <th scope="col">Product</th>
                          <th scope="col">Category</th>
                          <th scope="col">Price</th>
                          <th scope="col">Colours</th>
                          <th scope="col">Stock</th>
                          <th scope="col">Status</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleProducts.map((product) => (
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
                            <td data-label="Colours">
                              <span className="admin-muted">
                                {product.colours?.length
                                  ? product.colours.join(', ')
                                  : '—'}
                              </span>
                            </td>
                            <td data-label="Stock">{product.stock ?? 0}</td>
                            <td data-label="Status">
                              <span className={product.active ? 'admin-status is-on' : 'admin-status'}>
                                {product.active ? 'Published' : 'Inactive'}
                              </span>
                            </td>
                            <td data-label="Actions">
                              <div className="admin-row-actions">
                                <Link
                                  className="text-button"
                                  to={`/product/${product.slug || product.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View
                                </Link>
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() => openEdit(product)}
                                >
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
                      className="button button-wine button-rect"
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
                      className="button button-wine button-rect"
                      disabled={!pagination.hasMore || busy}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
