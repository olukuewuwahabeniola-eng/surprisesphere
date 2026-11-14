import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  createAdminCategory,
  deleteAdminCategory,
  listAdminCategories,
  readError,
  reorderAdminCategories,
  updateAdminCategory,
  uploadAdminImages,
} from '../services/api';
import { getStoredAdminKey } from '../utils/adminAuth';

const PAGE_SIZE = 50;

function blankForm() {
  return {
    name: '',
    description: '',
    imageUrl: '',
    sortOrder: '0',
    active: true,
  };
}

function categoryToForm(category) {
  return {
    name: category?.name || '',
    description: category?.description || '',
    imageUrl: category?.image || '',
    sortOrder: category?.sortOrder != null ? String(category.sortOrder) : '0',
    active: category?.active !== false,
  };
}

export default function AdminCategoriesPage() {
  const outlet = useOutletContext() || {};
  const adminKey = outlet.adminKey || getStoredAdminKey();

  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({ total: 0, published: 0, hidden: 0 });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(blankForm());
  const [formErrors, setFormErrors] = useState({});
  const [localPreview, setLocalPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [dragId, setDragId] = useState('');
  const [dropId, setDropId] = useState('');

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        const orderDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a.name || '').localeCompare(String(b.name || ''));
      }),
    [categories],
  );

  const canReorder = statusFilter === 'all' && !search;

  const loadCategories = useCallback(async () => {
    if (!adminKey) {
      setStatus('idle');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const params = {
        page: 1,
        pageSize: PAGE_SIZE,
        sort: 'sortOrder',
        status: statusFilter,
      };
      if (search) params.q = search;

      const data = await listAdminCategories(adminKey, params);
      setCategories(data.categories || []);
      if (data.counts) setCounts(data.counts);
      setStatus('ready');
    } catch (err) {
      setError(readError(err, 'Could not load categories.'));
      setStatus('error');
    }
  }, [adminKey, statusFilter, search]);

  const refreshCounts = useCallback(async () => {
    if (!adminKey) return;
    try {
      const data = await listAdminCategories(adminKey, {
        page: 1,
        pageSize: 1,
        status: 'all',
        sort: 'sortOrder',
      });
      if (data.counts) setCounts(data.counts);
    } catch {
      // Keep previous summary cards.
    }
  }, [adminKey]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  function applySearch(event) {
    event.preventDefault();
    setSearch(String(searchInput || '').trim());
  }

  function openCreate() {
    setFormMode('create');
    setEditingId('');
    setForm(blankForm());
    setFormErrors({});
    setFormOpen(true);
    setNote('');
    setError('');
    clearLocalPreview();
  }

  function openEdit(category) {
    setFormMode('edit');
    setEditingId(category.id);
    setForm(categoryToForm(category));
    setFormErrors({});
    setFormOpen(true);
    setNote('');
    setError('');
    clearLocalPreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId('');
    setForm(blankForm());
    setFormErrors({});
    clearLocalPreview();
  }

  function clearLocalPreview() {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateForm() {
    const next = {};
    if (!String(form.name || '').trim()) {
      next.name = 'Category name is required.';
    }
    const order = Number(form.sortOrder);
    if (form.sortOrder === '' || !Number.isFinite(order)) {
      next.sortOrder = 'Display order must be a number.';
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleImagePick(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Each image must be 5MB or smaller.');
      return;
    }

    clearLocalPreview();
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    setUploadProgress(0);
    setError('');
    try {
      const result = await uploadAdminImages(adminKey, [file], {
        onUploadProgress(progressEvent) {
          if (!progressEvent.total) return;
          setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        },
      });
      const url = result.images?.[0]?.url || '';
      if (!url) throw new Error('Upload did not return an image URL.');
      setField('imageUrl', url);
      setNote('Category image uploaded.');
    } catch (err) {
      setError(readError(err, 'Could not upload category image.'));
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setField('imageUrl', '');
    clearLocalPreview();
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!validateForm()) return;

    setBusy(true);
    setError('');
    setNote('');
    const payload = {
      name: String(form.name || '').trim(),
      description: String(form.description || '').trim(),
      image: form.imageUrl
        ? { url: form.imageUrl, alt: String(form.name || '').trim() }
        : { url: '', alt: String(form.name || '').trim() },
      sortOrder: Number(form.sortOrder || 0),
      active: Boolean(form.active),
    };

    try {
      let result;
      if (formMode === 'edit' && editingId) {
        result = await updateAdminCategory(adminKey, editingId, payload);
        setNote(`Updated “${result.category?.name || payload.name}”.`);
      } else {
        result = await createAdminCategory(adminKey, payload);
        setNote(`Created “${result.category?.name || payload.name}”.`);
      }
      closeForm();
      await Promise.all([loadCategories(), refreshCounts()]);
    } catch (err) {
      setError(readError(err, 'Could not save category.'));
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(category) {
    setBusy(true);
    setError('');
    setNote('');
    try {
      const nextActive = category.active === false;
      const result = await updateAdminCategory(adminKey, category.id, { active: nextActive });
      setNote(
        nextActive
          ? `Published “${result.category?.name || category.name}”.`
          : `Hidden “${result.category?.name || category.name}”.`,
      );
      await Promise.all([loadCategories(), refreshCounts()]);
    } catch (err) {
      setError(readError(err, 'Could not update category visibility.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(category) {
    const productCount = Number(category.productCount || 0);
    if (productCount > 0) {
      setError(
        `Cannot delete “${category.name}” while ${productCount} product${
          productCount === 1 ? '' : 's'
        } still belong to it. Reassign those products first.`,
      );
      setNote('');
      return;
    }

    const confirmed = window.confirm(
      `Delete category “${category.name}”? This cannot be undone.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError('');
    setNote('');
    try {
      const result = await deleteAdminCategory(adminKey, category.id);
      setNote(result.message || `Deleted “${category.name}”.`);
      if (editingId === category.id) closeForm();
      await Promise.all([loadCategories(), refreshCounts()]);
    } catch (err) {
      setError(readError(err, 'Could not delete category.'));
    } finally {
      setBusy(false);
    }
  }

  function onDragStart(event, categoryId) {
    if (!canReorder || busy) {
      event.preventDefault();
      return;
    }
    setDragId(categoryId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', categoryId);
  }

  function onDragOver(event, categoryId) {
    if (!canReorder || !dragId || dragId === categoryId) return;
    event.preventDefault();
    setDropId(categoryId);
  }

  function onDragEnd() {
    setDragId('');
    setDropId('');
  }

  async function onDrop(event, targetId) {
    event.preventDefault();
    if (!canReorder || !dragId || dragId === targetId) {
      onDragEnd();
      return;
    }

    const current = sortedCategories.map((entry) => entry.id);
    const from = current.indexOf(dragId);
    const to = current.indexOf(targetId);
    if (from < 0 || to < 0) {
      onDragEnd();
      return;
    }

    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    setCategories((existing) =>
      existing.map((entry) => {
        const index = next.indexOf(entry.id);
        return index >= 0 ? { ...entry, sortOrder: index } : entry;
      }),
    );
    onDragEnd();

    setBusy(true);
    setError('');
    setNote('');
    try {
      const result = await reorderAdminCategories(adminKey, next);
      setCategories(result.categories || []);
      setNote(result.message || 'Category order updated.');
    } catch (err) {
      setError(readError(err, 'Could not reorder categories.'));
      await loadCategories();
    } finally {
      setBusy(false);
    }
  }

  const previewSrc = localPreview || form.imageUrl || '';
  const summaryCards = [
    { label: 'Total Categories', value: counts.total, tone: 'wine', icon: 'folder' },
    { label: 'Published Categories', value: counts.published, tone: 'green', icon: 'check' },
    { label: 'Hidden Categories', value: counts.hidden, tone: 'terra', icon: 'hidden' },
  ];

  return (
    <div className="admin-dashboard admin-dashboard-motion is-ready admin-categories-dash">
      <div className="admin-dashboard-head admin-motion-item">
        <div>
          <h1>Categories</h1>
          <p>Manage your store categories and how they appear to customers.</p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="button button-terra button-rect" onClick={openCreate}>
            + Add New Category
          </button>
        </div>
      </div>

      <section className="admin-kpi-grid admin-categories-summary" aria-label="Category summary">
        {summaryCards.map((card, index) => (
          <article
            key={card.label}
            className={`admin-kpi-card admin-motion-card admin-motion-item tone-${card.tone}`}
            style={{ '--motion-delay': `${index * 40}ms` }}
          >
            <div className="admin-kpi-top admin-kpi-top-row">
              <div>
                <span>{card.label}</span>
                <strong>{Number(card.value || 0).toLocaleString('en-NG')}</strong>
              </div>
              <span className={`admin-kpi-icon icon-${card.icon}`} aria-hidden="true" />
            </div>
          </article>
        ))}
      </section>

      {note ? (
        <p className="review-success admin-motion-item" role="status">
          {note}
        </p>
      ) : null}
      {error ? (
        <p className="admin-error admin-motion-item" role="alert">
          {error}
        </p>
      ) : null}

      {formOpen ? (
        <section
          className="admin-panel admin-motion-item admin-category-form-panel"
          aria-label={formMode === 'edit' ? 'Edit category' : 'Add category'}
        >
          <div className="admin-panel-head">
            <h2>{formMode === 'edit' ? 'Edit category' : 'Add new category'}</h2>
            <button type="button" className="text-button" onClick={closeForm} disabled={busy}>
              Close
            </button>
          </div>

          <form className="admin-product-form" onSubmit={handleSave}>
            <div className="admin-form-grid">
              <label>
                Category name
                <input
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  maxLength={80}
                  required
                />
                {formErrors.name ? <span className="admin-field-error">{formErrors.name}</span> : null}
              </label>

              <label>
                Display order
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => setField('sortOrder', event.target.value)}
                />
                {formErrors.sortOrder ? (
                  <span className="admin-field-error">{formErrors.sortOrder}</span>
                ) : null}
              </label>
            </div>

            <label>
              Description
              <textarea
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Optional short description for shoppers"
              />
            </label>

            <fieldset className="admin-image-fieldset">
              <legend>Category image</legend>
              <p className="admin-help">
                Upload a JPG, PNG or WebP image (max 5MB) through the protected Cloudinary upload.
              </p>
              <div className="admin-image-list">
                <div className="admin-image-card">
                  <div className="admin-image-preview-wrap">
                    {previewSrc ? (
                      <img className="admin-image-preview" src={previewSrc} alt="" />
                    ) : (
                      <div className="admin-image-placeholder">No preview</div>
                    )}
                  </div>
                  <input
                    value={form.imageUrl}
                    onChange={(event) => setField('imageUrl', event.target.value)}
                    placeholder="Image URL after upload"
                  />
                  <div className="admin-image-actions">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImagePick}
                      disabled={uploading || busy}
                    />
                    {previewSrc ? (
                      <button
                        type="button"
                        className="text-button admin-danger"
                        onClick={removeImage}
                        disabled={uploading || busy}
                      >
                        Remove image
                      </button>
                    ) : null}
                  </div>
                  {uploading ? (
                    <div className="admin-upload-bar" aria-live="polite">
                      <div className="admin-progress">
                        <div className="admin-progress-bar" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <span>Uploading… {uploadProgress}%</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </fieldset>

            <label className="admin-check">
              <input
                type="checkbox"
                checked={Boolean(form.active)}
                onChange={(event) => setField('active', event.target.checked)}
              />
              Published (visible on the public shop)
            </label>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="button button-wine button-rect"
                disabled={busy || uploading}
              >
                {busy ? 'Saving…' : formMode === 'edit' ? 'Save changes' : 'Create category'}
              </button>
              <button
                type="button"
                className="button button-cream button-rect"
                onClick={closeForm}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="admin-panel admin-motion-item" aria-label="Category list">
        <div className="admin-panel-head">
          <h2>Manage Categories</h2>
          <span className="admin-help">
            {canReorder
              ? 'Drag and drop to reorder categories. Order saves automatically.'
              : 'Clear search and set status to All Status to reorder.'}
          </span>
        </div>

        <div className="admin-toolbar admin-categories-toolbar">
          <form className="admin-search" onSubmit={applySearch}>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search categories..."
              aria-label="Search categories"
            />
            <button type="submit" className="button button-wine button-rect">
              Search
            </button>
          </form>

          <label>
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
        </div>

        {status === 'loading' ? (
          <div className="admin-skeleton-stack" aria-live="polite">
            <div className="skeleton admin-skeleton-row" />
            <div className="skeleton admin-skeleton-row" />
            <div className="skeleton admin-skeleton-row" />
          </div>
        ) : null}

        {status === 'ready' && sortedCategories.length === 0 ? (
          <div className="admin-empty">
            <h2>No categories found</h2>
            <p>Try another filter, or add a new category for your catalogue.</p>
            <button type="button" className="button button-wine" onClick={openCreate}>
              Add New Category
            </button>
          </div>
        ) : null}

        {sortedCategories.length > 0 ? (
          <div className="admin-review-table-wrap">
            <table className="admin-review-table admin-category-table">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Description</th>
                  <th scope="col">Status</th>
                  <th scope="col">Order</th>
                  <th scope="col">Products</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((category) => {
                  const published = category.active !== false;
                  const isDragging = dragId === category.id;
                  const isDropTarget = dropId === category.id;
                  return (
                    <tr
                      key={category.id}
                      className={`${published ? 'status-approved' : 'status-unpublished'}${
                        isDragging ? ' is-dragging' : ''
                      }${isDropTarget ? ' is-drop-target' : ''}`}
                      draggable={canReorder && !busy}
                      onDragStart={(event) => onDragStart(event, category.id)}
                      onDragOver={(event) => onDragOver(event, category.id)}
                      onDrop={(event) => onDrop(event, category.id)}
                      onDragEnd={onDragEnd}
                    >
                      <td data-label="Category">
                        <div className="admin-review-product">
                          {category.image ? (
                            <img src={category.image} alt="" />
                          ) : (
                            <span className="admin-thumb-fallback" aria-hidden="true">
                              C
                            </span>
                          )}
                          <div>
                            <strong>{category.name}</strong>
                            <span className="admin-muted">{category.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Description">
                        {category.description
                          ? category.description.length > 90
                            ? `${category.description.slice(0, 90)}…`
                            : category.description
                          : '—'}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`admin-status-chip ${
                            published ? 'status-approved' : 'status-unpublished'
                          }`}
                        >
                          {published ? 'Published' : 'Hidden'}
                        </span>
                      </td>
                      <td data-label="Order">{category.sortOrder ?? 0}</td>
                      <td data-label="Products">{category.productCount ?? 0}</td>
                      <td data-label="Actions">
                        <div className="admin-row-actions admin-category-actions">
                          <button
                            type="button"
                            className="button button-wine button-rect admin-cat-btn"
                            disabled={busy}
                            onClick={() => openEdit(category)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`button button-rect admin-cat-btn ${
                              published ? 'button-terra' : 'button-publish'
                            }`}
                            disabled={busy}
                            onClick={() => togglePublish(category)}
                          >
                            {published ? 'Hide' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            className="button button-rect admin-cat-btn admin-cat-delete"
                            disabled={busy}
                            onClick={() => handleDelete(category)}
                            aria-label={`Delete ${category.name}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
