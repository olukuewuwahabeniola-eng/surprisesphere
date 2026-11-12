import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { getStoredAdminKey, setStoredAdminKey } from '../utils/adminAuth';

const PAGE_SIZE = 12;

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'unpublished', label: 'Unpublished' },
];

const RATING_OPTIONS = [
  { value: '', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
];

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
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
  const [adminKey, setAdminKey] = useState(() => getStoredAdminKey());
  const [keyDraft, setKeyDraft] = useState(() => getStoredAdminKey());
  const [authorized, setAuthorized] = useState(Boolean(getStoredAdminKey()));
  const [tab, setTab] = useState('ratings');

  const [products, setProducts] = useState([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Customer ratings tab
  const [reviews, setReviews] = useState([]);
  const [reviewPagination, setReviewPagination] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('idle');
  const [productFilter, setProductFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reviewPage, setReviewPage] = useState(1);
  const [inspectId, setInspectId] = useState('');

  // WhatsApp photos tab
  const [photos, setPhotos] = useState([]);
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
    () =>
      [...products].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
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
      setAuthorized(false);
      setReviewStatus('idle');
      return;
    }

    setReviewStatus('loading');
    setError('');
    try {
      const params = {
        page: reviewPage,
        pageSize: PAGE_SIZE,
      };
      if (productFilter) {
        params.product = productFilter;
      }
      if (ratingFilter) {
        params.rating = ratingFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      const [reviewData] = await Promise.all([
        listAdminReviews(adminKey, params),
        loadProducts(adminKey).catch(() => {}),
      ]);

      setReviews(reviewData.reviews || []);
      setReviewPagination(reviewData.pagination || null);
      setAuthorized(true);
      setReviewStatus('ready');
    } catch (err) {
      setError(readError(err, 'Could not load customer reviews.'));
      setReviewStatus('error');
      if (err?.response?.status === 401) {
        setAuthorized(false);
      }
    }
  }, [adminKey, reviewPage, productFilter, ratingFilter, statusFilter, loadProducts]);

  const loadPhotos = useCallback(async () => {
    if (!adminKey) {
      setAuthorized(false);
      setPhotoStatus('idle');
      return;
    }

    setPhotoStatus('loading');
    setError('');
    try {
      const params = {
        page: photoPage,
        pageSize: PAGE_SIZE,
      };
      if (photoPlacementFilter) {
        params.placement = photoPlacementFilter;
      }
      if (photoPublishedFilter === 'published') {
        params.published = true;
      } else if (photoPublishedFilter === 'unpublished') {
        params.published = false;
      }

      const [photoData] = await Promise.all([
        listAdminReviewPhotos(adminKey, params),
        loadProducts(adminKey).catch(() => {}),
      ]);

      setPhotos(photoData.photos || []);
      setPhotoPagination(photoData.pagination || null);
      setEditingCaptions(
        Object.fromEntries((photoData.photos || []).map((photo) => [photo.id, photo.caption || ''])),
      );
      setAuthorized(true);
      setPhotoStatus('ready');
    } catch (err) {
      setError(readError(err, 'Could not load WhatsApp picture reviews.'));
      setPhotoStatus('error');
      if (err?.response?.status === 401) {
        setAuthorized(false);
      }
    }
  }, [adminKey, photoPage, photoPlacementFilter, photoPublishedFilter, loadProducts]);

  useEffect(() => {
    if (tab === 'ratings') {
      loadReviews();
    }
  }, [tab, loadReviews]);

  useEffect(() => {
    if (tab === 'photos') {
      loadPhotos();
    }
  }, [tab, loadPhotos]);

  useEffect(
    () => () => {
      localPreviews.forEach((url) => URL.revokeObjectURL(url));
    },
    [localPreviews],
  );

  function unlockAdmin(event) {
    event.preventDefault();
    const nextKey = String(keyDraft || '').trim();
    setStoredAdminKey(nextKey);
    setAdminKey(nextKey);
    setReviewPage(1);
    setPhotoPage(1);
    setNote('');
    setError('');
  }

  async function runReviewAction(review, action) {
    if (action === 'delete') {
      const confirmed = window.confirm(
        `Permanently delete the review from ${review.displayName}? This cannot be undone.`,
      );
      if (!confirmed) {
        return;
      }
    }

    setBusy(true);
    setError('');
    setNote('');
    try {
      let result;
      if (action === 'approve') {
        result = await approveAdminReview(adminKey, review.id);
      } else if (action === 'reject') {
        result = await rejectAdminReview(adminKey, review.id);
      } else if (action === 'block') {
        result = await blockAdminReview(adminKey, review.id);
      } else if (action === 'unpublish') {
        result = await unpublishAdminReview(adminKey, review.id);
      } else if (action === 'restore') {
        result = await restoreAdminReview(adminKey, review.id);
      } else if (action === 'delete') {
        result = await deleteAdminReview(adminKey, review.id);
      }
      setNote(result?.message || 'Review updated.');
      if (inspectId === review.id && action === 'delete') {
        setInspectId('');
      }
      await loadReviews();
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            if (!progressEvent.total) {
              return;
            }
            setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          },
        },
      );
      setNote(result.message || 'Review pictures uploaded.');
      setUploadCaption('');
      clearSelectedFiles();
      await loadPhotos();
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
      if (!confirmed) {
        return;
      }
    }

    setBusy(true);
    setError('');
    setNote('');
    try {
      let result;
      if (action === 'publish') {
        result = await publishAdminReviewPhoto(adminKey, photo.id);
      } else if (action === 'unpublish') {
        result = await unpublishAdminReviewPhoto(adminKey, photo.id);
      } else if (action === 'delete') {
        result = await deleteAdminReviewPhoto(adminKey, photo.id);
      }
      setNote(result?.message || 'Testimonial updated.');
      await loadPhotos();
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
    if (index < 0) {
      return;
    }
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= photos.length) {
      return;
    }

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

  const inspected = reviews.find((review) => review.id === inspectId) || null;

  return (
    <article className="plain-page admin-page admin-reviews-page">
      <div className="container">
        <div className="admin-products-head">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Reviews &amp; Testimonials</h1>
            <p>
              Moderate customer star ratings and manage WhatsApp review screenshots for Surprise
              Fashion Sphere.
            </p>
          </div>
          <div className="admin-products-nav">
            <Link className="text-button" to="/admin">
              ← Store settings
            </Link>
            <Link className="text-button" to="/admin/products">
              Products
            </Link>
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
              {authorized ? 'Update key' : 'Unlock reviews'}
            </button>
          </form>
          <p className="admin-help">
            The key stays in this browser only and is sent as a request header. Customers cannot
            upload WhatsApp screenshots from the public shop.
          </p>
        </section>

        {!authorized ? (
          <p className="form-note" role="status">
            Enter a valid admin key to manage reviews and testimonials.
          </p>
        ) : (
          <>
            <div className="admin-tabs" role="tablist" aria-label="Review sections">
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
                WhatsApp Picture Reviews
              </button>
            </div>

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

            {tab === 'ratings' && (
              <section aria-label="Customer ratings moderation">
                <section className="admin-toolbar" aria-label="Review filters">
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
                    Rating
                    <select
                      value={ratingFilter}
                      onChange={(event) => {
                        setReviewPage(1);
                        setRatingFilter(event.target.value);
                      }}
                    >
                      {RATING_OPTIONS.map((option) => (
                        <option key={option.value || 'all'} value={option.value}>
                          {option.label}
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
                </section>

                {reviewStatus === 'loading' && <p className="admin-state">Loading reviews…</p>}

                {reviewStatus === 'ready' && reviews.length === 0 && (
                  <div className="admin-empty">
                    <h2>No reviews found</h2>
                    <p>Try another filter, or wait for customers to submit ratings.</p>
                  </div>
                )}

                {reviews.length > 0 && (
                  <div className="admin-review-list">
                    {reviews.map((review) => {
                      const actions = reviewActionsFor(review.status);
                      const isOpen = inspectId === review.id;
                      return (
                        <article
                          key={review.id}
                          className={`admin-review-card status-${review.status}${isOpen ? ' is-open' : ''}`}
                        >
                          <div className="admin-review-top">
                            <div>
                              <p className="admin-review-name">{review.displayName}</p>
                              <p className="admin-muted">
                                {review.product?.name || 'Unknown product'}
                              </p>
                            </div>
                            <span className={`admin-status-chip status-${review.status}`}>
                              {statusLabel(review.status)}
                            </span>
                          </div>

                          <div className="admin-review-meta">
                            <span className="admin-stars" aria-label={`${review.rating} out of 5`}>
                              {stars(review.rating)}
                            </span>
                            <span className="admin-muted">{formatDate(review.submittedAt)}</span>
                          </div>

                          <p className="admin-review-excerpt">
                            {review.body
                              ? review.body.length > 140
                                ? `${review.body.slice(0, 140)}…`
                                : review.body
                              : 'No written review.'}
                          </p>

                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="text-button"
                              onClick={() => setInspectId(isOpen ? '' : review.id)}
                            >
                              {isOpen ? 'Hide details' : 'Inspect'}
                            </button>
                            {actions.includes('approve') && (
                              <button
                                type="button"
                                className="text-button"
                                disabled={busy}
                                onClick={() => runReviewAction(review, 'approve')}
                              >
                                Approve
                              </button>
                            )}
                            {actions.includes('reject') && (
                              <button
                                type="button"
                                className="text-button"
                                disabled={busy}
                                onClick={() => runReviewAction(review, 'reject')}
                              >
                                Reject
                              </button>
                            )}
                            {actions.includes('unpublish') && (
                              <button
                                type="button"
                                className="text-button"
                                disabled={busy}
                                onClick={() => runReviewAction(review, 'unpublish')}
                              >
                                Unpublish
                              </button>
                            )}
                            {actions.includes('restore') && (
                              <button
                                type="button"
                                className="text-button"
                                disabled={busy}
                                onClick={() => runReviewAction(review, 'restore')}
                              >
                                Restore
                              </button>
                            )}
                            {actions.includes('block') && (
                              <button
                                type="button"
                                className="text-button"
                                disabled={busy}
                                onClick={() => runReviewAction(review, 'block')}
                              >
                                Block
                              </button>
                            )}
                            {actions.includes('delete') && (
                              <button
                                type="button"
                                className="text-button admin-danger"
                                disabled={busy}
                                onClick={() => runReviewAction(review, 'delete')}
                              >
                                Delete
                              </button>
                            )}
                          </div>

                          {isOpen && (
                            <div className="admin-review-inspect">
                              <h3>Review details</h3>
                              <dl className="admin-review-dl">
                                <div>
                                  <dt>Customer</dt>
                                  <dd>{review.displayName}</dd>
                                </div>
                                <div>
                                  <dt>Product</dt>
                                  <dd>{review.product?.name || '—'} ({review.product?.slug || '—'})</dd>
                                </div>
                                <div>
                                  <dt>Rating</dt>
                                  <dd>
                                    {stars(review.rating)} ({review.rating}/5)
                                  </dd>
                                </div>
                                <div>
                                  <dt>Submitted</dt>
                                  <dd>{formatDate(review.submittedAt)}</dd>
                                </div>
                                <div>
                                  <dt>Moderated</dt>
                                  <dd>{formatDate(review.moderatedAt)}</dd>
                                </div>
                                <div>
                                  <dt>Status</dt>
                                  <dd>{statusLabel(review.status)}</dd>
                                </div>
                              </dl>
                              <p className="admin-review-body">
                                {review.body || 'No written review was provided.'}
                              </p>
                              {review.status === 'pending' && (
                                <div className="admin-form-actions">
                                  <button
                                    type="button"
                                    className="button button-wine button-rect"
                                    disabled={busy}
                                    onClick={() => runReviewAction(review, 'approve')}
                                  >
                                    Approve &amp; publish
                                  </button>
                                  <button
                                    type="button"
                                    className="button button-cream button-rect"
                                    disabled={busy}
                                    onClick={() => runReviewAction(review, 'reject')}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}

                {reviewPagination && reviewPagination.totalPages > 1 && (
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
                      Page {reviewPagination.page} of {reviewPagination.totalPages} ·{' '}
                      {reviewPagination.total} reviews
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
                )}

                {inspected && (
                  <p className="sr-only" aria-live="polite">
                    Inspecting review from {inspected.displayName}
                  </p>
                )}
              </section>
            )}

            {tab === 'photos' && (
              <section aria-label="WhatsApp picture reviews">
                <section className="admin-panel" aria-label="Upload WhatsApp review pictures">
                  <div className="admin-panel-head">
                    <h2>Upload WhatsApp screenshots</h2>
                  </div>
                  <p className="admin-help">
                    Admin only. These pictures are testimonials and do not change product star
                    ratings.
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

                    {localPreviews.length > 0 && (
                      <div className="admin-image-list admin-photo-preview-list">
                        {localPreviews.map((url, index) => (
                          <div key={url} className="admin-image-card">
                            <div className="admin-image-preview-wrap">
                              <img className="admin-image-preview" src={url} alt="" />
                              <span className="admin-pill">Preview {index + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

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
                        <select
                          value={uploadProductId}
                          onChange={(event) => setUploadProductId(event.target.value)}
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
                          value={uploadPlacement}
                          onChange={(event) => setUploadPlacement(event.target.value)}
                        >
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

                    {uploading && (
                      <div className="admin-upload-bar" aria-live="polite">
                        <div className="admin-progress">
                          <div
                            className="admin-progress-bar"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span>Uploading… {uploadProgress}%</span>
                      </div>
                    )}

                    <div className="admin-form-actions">
                      <button
                        type="submit"
                        className="button button-wine button-rect"
                        disabled={busy || uploading || selectedFiles.length === 0}
                      >
                        {uploading ? 'Uploading…' : 'Upload pictures'}
                      </button>
                      {selectedFiles.length > 0 && (
                        <button
                          type="button"
                          className="button button-cream button-rect"
                          onClick={clearSelectedFiles}
                          disabled={uploading}
                        >
                          Clear selection
                        </button>
                      )}
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

                {photoStatus === 'loading' && <p className="admin-state">Loading testimonials…</p>}

                {photoStatus === 'ready' && photos.length === 0 && (
                  <div className="admin-empty">
                    <h2>No picture reviews yet</h2>
                    <p>Upload WhatsApp screenshots above to start building testimonials.</p>
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="admin-photo-list">
                    {photos.map((photo, index) => (
                      <article key={photo.id} className="admin-photo-card">
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
                                updatePhotoField(photo, {
                                  productId: event.target.value || null,
                                })
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
                              onChange={(event) =>
                                updatePhotoField(photo, { placement: event.target.value })
                              }
                              disabled={busy}
                            >
                              <option value="homepage">Homepage</option>
                              <option value="product">Product page</option>
                            </select>
                          </label>

                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="text-button"
                              disabled={busy}
                              onClick={() => savePhotoMeta(photo)}
                            >
                              Save caption
                            </button>
                            <button
                              type="button"
                              className="text-button"
                              disabled={busy || index === 0}
                              onClick={() => movePhoto(photo, 'up')}
                            >
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
                              <button
                                type="button"
                                className="text-button"
                                disabled={busy}
                                onClick={() => handlePhotoAction(photo, 'unpublish')}
                              >
                                Unpublish
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="text-button"
                                disabled={busy}
                                onClick={() => handlePhotoAction(photo, 'publish')}
                              >
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
                )}

                {photoPagination && photoPagination.totalPages > 1 && (
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
                      Page {photoPagination.page} of {photoPagination.totalPages} ·{' '}
                      {photoPagination.total} pictures
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
                )}
              </section>
            )}
          </>
        )}
      </div>
    </article>
  );
}
