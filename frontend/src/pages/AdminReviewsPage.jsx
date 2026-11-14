import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  approveAdminReview,
  blockAdminReview,
  deleteAdminReview,
  deleteAdminReviewPhoto,
  listAdminProducts,
  listAdminReviewPhotos,
  listAdminReviews,
  publishAdminReviewPhoto,
  readError,
  rejectAdminReview,
  reorderAdminReviewPhotos,
  restoreAdminReview,
  unpublishAdminReview,
  unpublishAdminReviewPhoto,
  updateAdminReviewPhoto,
  uploadAdminReviewPhotos,
} from '../services/api';
import { getStoredAdminKey } from '../utils/adminAuth';

const PAGE_SIZE = 12;

const STATUS_OPTIONS = [
  { value: '', label: 'All reviews' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'unpublished', label: 'Unpublished' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stars(rating) {
  const value = Number(rating) || 0;
  return `${'★'.repeat(value)}${'☆'.repeat(Math.max(0, 5 - value))}`;
}

function statusLabel(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function reviewActionsFor(status) {
  switch (status) {
    case 'pending':
      return ['approve', 'reject', 'block', 'delete'];
    case 'approved':
      return ['unpublish', 'block', 'delete'];
    case 'rejected':
    case 'blocked':
    case 'unpublished':
      return ['restore', 'delete'];
    default:
      return ['delete'];
  }
}

export default function AdminReviewsPage() {
  const outlet = useOutletContext() || {};
  const adminKey = outlet.adminKey || getStoredAdminKey();

  const [tab, setTab] = useState('ratings');
  const [products, setProducts] = useState([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewCounts, setReviewCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    blocked: 0,
    unpublished: 0,
  });
  const [reviewPagination, setReviewPagination] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('idle');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [reviewPage, setReviewPage] = useState(1);
  const [inspectId, setInspectId] = useState('');

  const [photos, setPhotos] = useState([]);
  const [photoCounts, setPhotoCounts] = useState({ total: 0, published: 0, unpublished: 0 });
  const [photoPagination, setPhotoPagination] = useState(null);
  const [photoStatus, setPhotoStatus] = useState('idle');
  const [photoPage, setPhotoPage] = useState(1);
  const [photoPublishedFilter, setPhotoPublishedFilter] = useState('all');
  const [photoPlacementFilter, setPhotoPlacementFilter] = useState('');
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [localPreviews, setLocalPreviews] = useState([]);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadProductId, setUploadProductId] = useState('');
  const [uploadPlacement, setUploadPlacement] = useState('homepage');
  const [uploadPublished, setUploadPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingCaptions, setEditingCaptions] = useState({});

  const productOptions = useMemo(
    () => [...products].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
    [products],
  );

  const loadProducts = useCallback(async (key) => {
    const data = await listAdminProducts(key, {
      page: 1,
      pageSize: 100,
      status: 'all',
      sort: 'name',
    });
    setProducts(data.products || []);
  }, []);

  const loadReviews = useCallback(async () => {
    if (!adminKey) {
      setReviewStatus('idle');
      return;
    }
    setReviewStatus('loading');
    setError('');
    try {
      const params = { page: reviewPage, pageSize: PAGE_SIZE };
      if (productFilter) params.product = productFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.q = search;

      const [reviewData] = await Promise.all([
        listAdminReviews(adminKey, params),
        loadProducts(adminKey).catch(() => {}),
      ]);

      setReviews(reviewData.reviews || []);
      setReviewPagination(reviewData.pagination || null);
      if (reviewData.counts) {
        setReviewCounts(reviewData.counts);
      }
      setReviewStatus('ready');
    } catch (err) {
      setError(readError(err, 'Could not load customer reviews.'));
      setReviewStatus('error');
    }
  }, [adminKey, reviewPage, productFilter, statusFilter, search, loadProducts]);

  const loadPhotos = useCallback(async () => {
    if (!adminKey) {
      setPhotoStatus('idle');
      return;
    }
    setPhotoStatus('loading');
    setError('');
    try {
      const params = { page: photoPage, pageSize: PAGE_SIZE };
      if (photoPlacementFilter) params.placement = photoPlacementFilter;
      if (photoPublishedFilter === 'published') params.published = true;
      if (photoPublishedFilter === 'unpublished') params.published = false;

      const [photoData] = await Promise.all([
        listAdminReviewPhotos(adminKey, params),
        loadProducts(adminKey).catch(() => {}),
      ]);

      setPhotos(photoData.photos || []);
      setPhotoPagination(photoData.pagination || null);
      if (photoData.counts) {
        setPhotoCounts(photoData.counts);
      }
      setEditingCaptions(
        Object.fromEntries((photoData.photos || []).map((photo) => [photo.id, photo.caption || ''])),
      );
      setPhotoStatus('ready');
    } catch (err) {
      setError(readError(err, 'Could not load WhatsApp picture reviews.'));
      setPhotoStatus('error');
    }
  }, [adminKey, photoPage, photoPlacementFilter, photoPublishedFilter, loadProducts]);

  const refreshSummary = useCallback(async () => {
    if (!adminKey) return;
    try {
      const [reviewsSummary, photosSummary] = await Promise.all([
        listAdminReviews(adminKey, { page: 1, pageSize: 1 }),
        listAdminReviewPhotos(adminKey, { page: 1, pageSize: 1 }),
      ]);
      if (reviewsSummary.counts) setReviewCounts(reviewsSummary.counts);
      if (photosSummary.counts) setPhotoCounts(photosSummary.counts);
    } catch {
      // Keep prior summary cards if refresh fails.
    }
  }, [adminKey]);

  useEffect(() => {
    if (tab === 'ratings') loadReviews();
  }, [tab, loadReviews]);

  useEffect(() => {
    if (tab === 'photos') loadPhotos();
  }, [tab, loadPhotos]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  useEffect(
    () => () => {
      localPreviews.forEach((url) => URL.revokeObjectURL(url));
    },
    [localPreviews],
  );

  async function runReviewAction(review, action) {
    if (action === 'delete') {
      const confirmed = window.confirm(
        `Permanently delete the review from ${review.displayName}? This cannot be undone.`,
      );
      if (!confirmed) return;
    }
    if (action === 'unpublish') {
      const confirmed = window.confirm(
        'Unpublish this approved review? It will leave the public product page and stop counting toward the average rating.',
      );
      if (!confirmed) return;
    }

    setBusy(true);
    setError('');
    setNote('');
    try {
      let result;
      if (action === 'approve') result = await approveAdminReview(adminKey, review.id);
      else if (action === 'reject') result = await rejectAdminReview(adminKey, review.id);
      else if (action === 'block') result = await blockAdminReview(adminKey, review.id);
      else if (action === 'unpublish') result = await unpublishAdminReview(adminKey, review.id);
      else if (action === 'restore') result = await restoreAdminReview(adminKey, review.id);
      else if (action === 'delete') result = await deleteAdminReview(adminKey, review.id);

      setNote(result?.message || 'Review updated.');
      if (inspectId === review.id && action === 'delete') setInspectId('');
      await Promise.all([loadReviews(), refreshSummary()]);
    } catch (err) {
      setError(readError(err, 'Could not update that review.'));
    } finally {
      setBusy(false);
    }
  }

  function onPickFiles(event) {
    const files = Array.from(event.target.files || []);
    localPreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles(files);
    setLocalPreviews(files.map((file) => URL.createObjectURL(file)));
    setUploadProgress(0);
  }

  function clearSelectedFiles() {
    localPreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setLocalPreviews([]);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePreview(index) {
    const nextFiles = selectedFiles.filter((_, i) => i !== index);
    URL.revokeObjectURL(localPreviews[index]);
    setSelectedFiles(nextFiles);
    setLocalPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  }

  async function handlePhotoUpload(event) {
    event.preventDefault();
    if (!selectedFiles.length) {
      setError('Choose one or more WhatsApp review screenshots to upload.');
      return;
    }
    setUploading(true);
    setBusy(true);
    setError('');
    setNote('');
    setUploadProgress(0);
    try {
      const result = await uploadAdminReviewPhotos(
        adminKey,
        {
          files: selectedFiles,
          caption: uploadCaption,
          productId: uploadProductId || undefined,
          placement: uploadPlacement,
          published: uploadPublished,
        },
        {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;
            setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          },
        },
      );
      setNote(result.message || 'Review pictures uploaded.');
      setUploadCaption('');
      clearSelectedFiles();
      await Promise.all([loadPhotos(), refreshSummary()]);
    } catch (err) {
      setError(readError(err, 'Could not upload review pictures.'));
    } finally {
      setUploading(false);
      setBusy(false);
    }
  }

  async function handlePhotoAction(photo, action) {
    if (action === 'delete') {
      const confirmed = window.confirm('Delete this WhatsApp review picture permanently?');
      if (!confirmed) return;
    }
    setBusy(true);
    setError('');
    setNote('');
    try {
      let result;
      if (action === 'publish') result = await publishAdminReviewPhoto(adminKey, photo.id);
      else if (action === 'unpublish') result = await unpublishAdminReviewPhoto(adminKey, photo.id);
      else if (action === 'delete') result = await deleteAdminReviewPhoto(adminKey, photo.id);
      setNote(result?.message || 'Testimonial updated.');
      await Promise.all([loadPhotos(), refreshSummary()]);
    } catch (err) {
      setError(readError(err, 'Could not update that testimonial.'));
    } finally {
      setBusy(false);
    }
  }

  async function savePhotoMeta(photo) {
    setBusy(true);
    setError('');
    setNote('');
    try {
      const result = await updateAdminReviewPhoto(adminKey, photo.id, {
        caption: editingCaptions[photo.id] ?? photo.caption ?? '',
        productId: photo.productId || null,
        placement: photo.placement,
      });
      setNote(result.message || 'Testimonial details saved.');
      await loadPhotos();
    } catch (err) {
      setError(readError(err, 'Could not save testimonial details.'));
    } finally {
      setBusy(false);
    }
  }

  async function movePhoto(photo, direction) {
    const index = photos.findIndex((entry) => entry.id === photo.id);
    if (index < 0) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= photos.length) return;

    const orderedIds = photos.map((entry) => entry.id);
    const [moved] = orderedIds.splice(index, 1);
    orderedIds.splice(target, 0, moved);

    setBusy(true);
    setError('');
    setNote('');
    try {
      const result = await reorderAdminReviewPhotos(adminKey, orderedIds);
      setNote(result.message || 'Testimonials reordered.');
      setPhotos(result.photos || []);
    } catch (err) {
      setError(readError(err, 'Could not reorder testimonials.'));
      await loadPhotos();
    } finally {
      setBusy(false);
    }
  }

  async function updatePhotoField(photo, patch) {
    setBusy(true);
    setError('');
    setNote('');
    try {
      const result = await updateAdminReviewPhoto(adminKey, photo.id, patch);
      setNote(result.message || 'Testimonial updated.');
      await loadPhotos();
    } catch (err) {
      setError(readError(err, 'Could not update that testimonial.'));
    } finally {
      setBusy(false);
    }
  }

  function applySearch(event) {
    event.preventDefault();
    setReviewPage(1);
    setSearch(String(searchInput || '').trim());
  }

  const summaryCards = [
    { label: 'Total customer reviews', value: reviewCounts.total, tone: 'wine' },
    { label: 'Pending reviews', value: reviewCounts.pending, tone: 'terra' },
    { label: 'Approved reviews', value: reviewCounts.approved, tone: 'green' },
    { label: 'Published WhatsApp testimonials', value: photoCounts.published, tone: 'wine' },
  ];

  return (
    <div className="admin-dashboard admin-dashboard-motion is-ready admin-reviews-dash">
      <div className="admin-dashboard-head admin-motion-item">
        <div>
          <h1>Reviews &amp; Testimonials</h1>
          <p>Manage customer feedback and showcase the experiences customers share with your store.</p>
        </div>
      </div>

      <section className="admin-kpi-grid admin-reviews-summary" aria-label="Review summary">
        {summaryCards.map((card, index) => (
          <article
            key={card.label}
            className={`admin-kpi-card admin-motion-card admin-motion-item tone-${card.tone}`}
            style={{ '--motion-delay': `${index * 40}ms` }}
          >
            <div className="admin-kpi-top">
              <span>{card.label}</span>
              <strong>{Number(card.value || 0).toLocaleString('en-NG')}</strong>
            </div>
          </article>
        ))}
      </section>

      <div className="admin-tabs admin-motion-item" role="tablist" aria-label="Review sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'ratings'}
          className={tab === 'ratings' ? 'admin-tab is-active' : 'admin-tab'}
          onClick={() => setTab('ratings')}
        >
          Customer Ratings
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'photos'}
          className={tab === 'photos' ? 'admin-tab is-active' : 'admin-tab'}
          onClick={() => setTab('photos')}
        >
          WhatsApp Picture Testimonials
        </button>
      </div>

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

      {tab === 'ratings' ? (
        <section className="admin-panel admin-motion-item" aria-label="Customer ratings moderation">
          <div className="admin-toolbar admin-reviews-toolbar" aria-label="Review filters">
            <form className="admin-search" onSubmit={applySearch}>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search customer or product"
                aria-label="Search customer or product"
              />
              <button type="submit" className="button button-wine button-rect">
                Search
              </button>
            </form>

            <label>
              Product
              <select
                value={productFilter}
                onChange={(event) => {
                  setReviewPage(1);
                  setProductFilter(event.target.value);
                }}
              >
                <option value="">All products</option>
                {productOptions.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) => {
                  setReviewPage(1);
                  setStatusFilter(event.target.value);
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {reviewStatus === 'loading' ? (
            <div className="admin-skeleton-stack" aria-live="polite">
              <div className="skeleton admin-skeleton-row" />
              <div className="skeleton admin-skeleton-row" />
              <div className="skeleton admin-skeleton-row" />
            </div>
          ) : null}

          {reviewStatus === 'ready' && reviews.length === 0 ? (
            <div className="admin-empty">
              <h2>No reviews found</h2>
              <p>Try another filter, or wait for customers to submit ratings.</p>
            </div>
          ) : null}

          {reviews.length > 0 ? (
            <div className="admin-review-table-wrap">
              <table className="admin-review-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => {
                    const actions = reviewActionsFor(review.status);
                    return (
                      <tr key={review.id} className={`status-${review.status}`}>
                        <td data-label="Customer">
                          <strong>{review.displayName}</strong>
                        </td>
                        <td data-label="Product">
                          <div className="admin-review-product">
                            {review.product?.image ? (
                              <img src={review.product.image} alt="" />
                            ) : (
                              <span className="admin-thumb-fallback" aria-hidden="true">
                                P
                              </span>
                            )}
                            <span>{review.product?.name || 'Unknown product'}</span>
                          </div>
                        </td>
                        <td data-label="Rating">
                          <span className="admin-stars" aria-label={`${review.rating} out of 5`}>
                            {stars(review.rating)}
                          </span>
                        </td>
                        <td data-label="Review">
                          <button
                            type="button"
                            className="text-button admin-review-body-btn"
                            onClick={() => setInspectId(inspectId === review.id ? '' : review.id)}
                          >
                            {review.body
                              ? review.body.length > 80
                                ? `${review.body.slice(0, 80)}…`
                                : review.body
                              : 'No written review'}
                          </button>
                          {inspectId === review.id ? (
                            <p className="admin-review-full">{review.body || 'No written review was provided.'}</p>
                          ) : null}
                        </td>
                        <td data-label="Submitted">{formatDate(review.submittedAt)}</td>
                        <td data-label="Status">
                          <span className={`admin-status-chip status-${review.status}`}>
                            {statusLabel(review.status)}
                          </span>
                        </td>
                        <td data-label="Actions">
                          <div className="admin-row-actions">
                            {actions.includes('approve') ? (
                              <button type="button" className="text-button" disabled={busy} onClick={() => runReviewAction(review, 'approve')}>
                                Approve
                              </button>
                            ) : null}
                            {actions.includes('reject') ? (
                              <button type="button" className="text-button" disabled={busy} onClick={() => runReviewAction(review, 'reject')}>
                                Reject
                              </button>
                            ) : null}
                            {actions.includes('unpublish') ? (
                              <button type="button" className="text-button" disabled={busy} onClick={() => runReviewAction(review, 'unpublish')}>
                                Unpublish
                              </button>
                            ) : null}
                            {actions.includes('restore') ? (
                              <button type="button" className="text-button" disabled={busy} onClick={() => runReviewAction(review, 'restore')}>
                                Restore
                              </button>
                            ) : null}
                            {actions.includes('block') ? (
                              <button type="button" className="text-button" disabled={busy} onClick={() => runReviewAction(review, 'block')}>
                                Block
                              </button>
                            ) : null}
                            {actions.includes('delete') ? (
                              <button type="button" className="text-button admin-danger" disabled={busy} onClick={() => runReviewAction(review, 'delete')}>
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {reviewPagination && reviewPagination.totalPages > 1 ? (
            <div className="admin-pagination">
              <button
                type="button"
                className="button button-cream button-rect"
                disabled={reviewPage <= 1 || busy}
                onClick={() => setReviewPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <p>
                Page {reviewPagination.page} of {reviewPagination.totalPages} · {reviewPagination.total}{' '}
                reviews
              </p>
              <button
                type="button"
                className="button button-cream button-rect"
                disabled={!reviewPagination.hasMore || busy}
                onClick={() => setReviewPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="admin-motion-item" aria-label="WhatsApp picture testimonials">
          <section className="admin-panel" aria-label="Upload WhatsApp review pictures">
            <div className="admin-panel-head">
              <h2>Upload WhatsApp screenshots</h2>
            </div>
            <p className="admin-help">
              Admin only. Redact private WhatsApp phone numbers and personal details, and obtain
              permission before publishing. These pictures are testimonials and do not change product
              star ratings.
            </p>

            <form className="admin-product-form" onSubmit={handlePhotoUpload}>
              <label>
                Images
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={onPickFiles}
                />
              </label>

              {localPreviews.length > 0 ? (
                <div className="admin-image-list admin-photo-preview-list">
                  {localPreviews.map((url, index) => (
                    <div key={url} className="admin-image-card">
                      <div className="admin-image-preview-wrap">
                        <img className="admin-image-preview" src={url} alt="" />
                        <button
                          type="button"
                          className="text-button admin-danger"
                          onClick={() => removePreview(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="admin-form-grid">
                <label>
                  Caption
                  <input
                    value={uploadCaption}
                    onChange={(event) => setUploadCaption(event.target.value)}
                    maxLength={280}
                    placeholder="Optional caption"
                  />
                </label>
                <label>
                  Associated product
                  <select value={uploadProductId} onChange={(event) => setUploadProductId(event.target.value)}>
                    <option value="">General testimonial</option>
                    {productOptions.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Placement
                  <select value={uploadPlacement} onChange={(event) => setUploadPlacement(event.target.value)}>
                    <option value="homepage">Homepage</option>
                    <option value="product">Product page</option>
                  </select>
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={uploadPublished}
                    onChange={(event) => setUploadPublished(event.target.checked)}
                  />
                  Publish immediately
                </label>
              </div>

              {uploading ? (
                <div className="admin-upload-bar" aria-live="polite">
                  <div className="admin-progress">
                    <div className="admin-progress-bar" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span>Uploading… {uploadProgress}%</span>
                </div>
              ) : null}

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="button button-wine button-rect"
                  disabled={busy || uploading || selectedFiles.length === 0}
                >
                  {uploading ? 'Uploading…' : 'Upload pictures'}
                </button>
                {selectedFiles.length > 0 ? (
                  <button
                    type="button"
                    className="button button-cream button-rect"
                    onClick={clearSelectedFiles}
                    disabled={uploading}
                  >
                    Clear selection
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="admin-toolbar" aria-label="Testimonial filters">
            <label>
              Placement
              <select
                value={photoPlacementFilter}
                onChange={(event) => {
                  setPhotoPage(1);
                  setPhotoPlacementFilter(event.target.value);
                }}
              >
                <option value="">All placements</option>
                <option value="homepage">Homepage</option>
                <option value="product">Product page</option>
              </select>
            </label>
            <label>
              Visibility
              <select
                value={photoPublishedFilter}
                onChange={(event) => {
                  setPhotoPage(1);
                  setPhotoPublishedFilter(event.target.value);
                }}
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </label>
          </section>

          {photoStatus === 'loading' ? (
            <div className="admin-skeleton-stack" aria-live="polite">
              <div className="skeleton admin-skeleton-row" />
              <div className="skeleton admin-skeleton-row" />
            </div>
          ) : null}

          {photoStatus === 'ready' && photos.length === 0 ? (
            <div className="admin-empty">
              <h2>No picture reviews yet</h2>
              <p>Upload WhatsApp screenshots above to start building testimonials.</p>
            </div>
          ) : null}

          {photos.length > 0 ? (
            <div className="admin-photo-list">
              {photos.map((photo, index) => (
                <article key={photo.id} className="admin-photo-card admin-motion-card">
                  <div className="admin-photo-media">
                    <img src={photo.url} alt={photo.caption || 'WhatsApp review'} />
                    <span
                      className={
                        photo.published
                          ? 'admin-status-chip status-approved'
                          : 'admin-status-chip status-unpublished'
                      }
                    >
                      {photo.published ? 'Published' : 'Unpublished'}
                    </span>
                    <em className="admin-photo-order">Order {photo.sortOrder ?? index + 1}</em>
                  </div>
                  <div className="admin-photo-body">
                    <label>
                      Caption
                      <input
                        value={editingCaptions[photo.id] ?? ''}
                        onChange={(event) =>
                          setEditingCaptions((current) => ({
                            ...current,
                            [photo.id]: event.target.value,
                          }))
                        }
                        maxLength={280}
                      />
                    </label>
                    <label>
                      Product
                      <select
                        value={photo.productId || ''}
                        onChange={(event) =>
                          updatePhotoField(photo, { productId: event.target.value || null })
                        }
                        disabled={busy}
                      >
                        <option value="">General testimonial</option>
                        {productOptions.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Placement
                      <select
                        value={photo.placement || 'homepage'}
                        onChange={(event) => updatePhotoField(photo, { placement: event.target.value })}
                        disabled={busy}
                      >
                        <option value="homepage">Homepage</option>
                        <option value="product">Product page</option>
                      </select>
                    </label>
                    <div className="admin-row-actions">
                      <button type="button" className="text-button" disabled={busy} onClick={() => savePhotoMeta(photo)}>
                        Save caption
                      </button>
                      <button type="button" className="text-button" disabled={busy || index === 0} onClick={() => movePhoto(photo, 'up')}>
                        Move up
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        disabled={busy || index === photos.length - 1}
                        onClick={() => movePhoto(photo, 'down')}
                      >
                        Move down
                      </button>
                      {photo.published ? (
                        <button type="button" className="text-button" disabled={busy} onClick={() => handlePhotoAction(photo, 'unpublish')}>
                          Unpublish
                        </button>
                      ) : (
                        <button type="button" className="text-button" disabled={busy} onClick={() => handlePhotoAction(photo, 'publish')}>
                          Publish
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-button admin-danger"
                        disabled={busy}
                        onClick={() => handlePhotoAction(photo, 'delete')}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {photoPagination && photoPagination.totalPages > 1 ? (
            <div className="admin-pagination">
              <button
                type="button"
                className="button button-cream button-rect"
                disabled={photoPage <= 1 || busy}
                onClick={() => setPhotoPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <p>
                Page {photoPagination.page} of {photoPagination.totalPages} · {photoPagination.total}{' '}
                pictures
              </p>
              <button
                type="button"
                className="button button-cream button-rect"
                disabled={!photoPagination.hasMore || busy}
                onClick={() => setPhotoPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
