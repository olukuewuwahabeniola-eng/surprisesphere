import { useMemo, useState } from 'react';
import { createAdminProduct, readError } from '../services/api';
import {
  blankProductDraft,
  draftToProductPayload,
  validateProductDraft,
} from '../utils/adminProductDraft';
import { formatNaira } from '../utils/money';
import AdminColourVariantsEditor from './AdminColourVariantsEditor';

const STEPS = ['category', 'workspace', 'review', 'results'];

export default function AdminProductBatchUpload({
  categories = [],
  adminKey,
  onClose,
  onCompleted,
}) {
  const activeCategories = useMemo(
    () => (categories || []).filter((category) => category.active !== false),
    [categories],
  );

  const [step, setStep] = useState('category');
  const [categoryId, setCategoryId] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [validationIssues, setValidationIssues] = useState([]);
  const [results, setResults] = useState([]);
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0, label: '' });

  const selectedCategory = activeCategories.find((category) => category.id === categoryId);

  function startWorkspace(nextCategoryId) {
    const category = activeCategories.find((entry) => entry.id === nextCategoryId);
    if (!category) {
      setError('Choose a category to continue.');
      return;
    }
    setCategoryId(nextCategoryId);
    setDrafts([
      blankProductDraft({
        category: category.id,
        categoryLabel: category.name,
        expanded: true,
      }),
    ]);
    setError('');
    setValidationIssues([]);
    setStep('workspace');
  }

  function updateDraft(clientId, patch) {
    setDrafts((current) =>
      current.map((draft) => (draft.clientId === clientId ? { ...draft, ...patch } : draft)),
    );
  }

  function addProduct() {
    if (!selectedCategory) return;
    setDrafts((current) => [
      ...current.map((draft) => ({ ...draft, expanded: false })),
      blankProductDraft({
        category: selectedCategory.id,
        categoryLabel: selectedCategory.name,
        expanded: true,
      }),
    ]);
  }

  function removeProduct(clientId) {
    setDrafts((current) => {
      const next = current.filter((draft) => draft.clientId !== clientId);
      return next.length
        ? next
        : [
            blankProductDraft({
              category: selectedCategory?.id || categoryId,
              categoryLabel: selectedCategory?.name || '',
              expanded: true,
            }),
          ];
    });
  }

  function goToReview() {
    const issues = [];
    drafts.forEach((draft, index) => {
      const errors = validateProductDraft(draft);
      errors.forEach((message) => {
        issues.push({
          clientId: draft.clientId,
          index: index + 1,
          name: draft.name || 'Untitled',
          message,
        });
      });
    });
    if (issues.length) {
      setValidationIssues(issues);
      setError(`Fix ${issues.length} issue${issues.length === 1 ? '' : 's'} before submitting.`);
      const firstId = issues[0]?.clientId;
      if (firstId) {
        setDrafts((current) =>
          current.map((draft) => ({ ...draft, expanded: draft.clientId === firstId })),
        );
      }
      return;
    }
    setValidationIssues([]);
    setError('');
    setStep('review');
  }

  async function submitBatch() {
    setBusy(true);
    setError('');
    const pending = drafts.filter((draft) => !draft.createdProductId);
    const outcome = [];
    setSubmitProgress({ current: 0, total: pending.length, label: 'Starting…' });

    for (const draft of drafts) {
      if (draft.createdProductId) {
        outcome.push({
          clientId: draft.clientId,
          name: draft.name,
          ok: true,
          message: 'Already uploaded in this session.',
          skipped: true,
        });
        continue;
      }

      const position = outcome.filter((entry) => !entry.skipped).length + 1;
      setSubmitProgress({
        current: position,
        total: pending.length,
        label: draft.name || `Product ${position}`,
      });
      updateDraft(draft.clientId, { uploadStatus: 'uploading', uploadError: '' });

      try {
        const payload = draftToProductPayload(draft);
        const result = await createAdminProduct(adminKey, payload);
        const createdId = result?.product?.id || '';
        updateDraft(draft.clientId, {
          uploadStatus: 'success',
          createdProductId: createdId,
          uploadError: '',
        });
        outcome.push({
          clientId: draft.clientId,
          name: draft.name,
          ok: true,
          message: result?.message || 'Uploaded.',
          productId: createdId,
        });
      } catch (err) {
        const message = readError(err, 'Upload failed.');
        updateDraft(draft.clientId, { uploadStatus: 'error', uploadError: message });
        outcome.push({
          clientId: draft.clientId,
          name: draft.name,
          ok: false,
          message,
        });
      }
    }

    setResults(outcome);
    setBusy(false);
    setSubmitProgress({ current: 0, total: 0, label: '' });
    setStep('results');
    if (outcome.some((entry) => entry.ok && !entry.skipped)) {
      onCompleted?.();
    }
  }

  async function retryFailed() {
    const failed = drafts.filter((draft) => !draft.createdProductId);
    setDrafts(
      failed.map((draft) => ({
        ...draft,
        uploadStatus: 'idle',
        uploadError: '',
        expanded: true,
      })),
    );
    setResults([]);
    setStep('review');
  }

  const readyCount = drafts.filter((draft) => validateProductDraft(draft).length === 0).length;
  const successCount = results.filter((entry) => entry.ok).length;
  const failedCount = results.filter((entry) => !entry.ok).length;
  const progressPercent =
    submitProgress.total > 0
      ? Math.round((Math.max(submitProgress.current - 1, 0) / submitProgress.total) * 100)
      : 0;

  return (
    <section className="admin-panel admin-batch-upload" aria-label="Upload products">
      <div className="admin-panel-head">
        <div>
          <h2>Upload Products</h2>
          <p className="admin-muted">
            Prepare multiple different products in one session — each with its own pictures,
            colours, sizes and stock — then submit together.
          </p>
        </div>
        <button type="button" className="button button-wine button-rect" onClick={onClose} disabled={busy}>
          Back to products
        </button>
      </div>

      <ol className="admin-batch-steps" aria-label="Upload steps">
        {STEPS.map((entry) => (
          <li key={entry} className={step === entry ? 'is-active' : ''}>
            {entry === 'category' && '1. Category'}
            {entry === 'workspace' && '2. Products'}
            {entry === 'review' && '3. Review'}
            {entry === 'results' && '4. Results'}
          </li>
        ))}
      </ol>

      {error ? (
        <p className="form-note admin-error" role="alert">
          {error}
        </p>
      ) : null}

      {validationIssues.length > 0 && step === 'workspace' ? (
        <ul className="admin-batch-issues" aria-label="Validation issues">
          {validationIssues.map((issue) => (
            <li key={`${issue.clientId}-${issue.message}`}>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setDrafts((current) =>
                    current.map((draft) => ({
                      ...draft,
                      expanded: draft.clientId === issue.clientId,
                    })),
                  )
                }
              >
                Product {issue.index} ({issue.name}): {issue.message}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {step === 'category' ? (
        <div className="admin-batch-category">
          <h3>What would you like to upload?</h3>
          <p>Choose a category from your catalogue. New categories added in Admin → Categories appear here automatically.</p>
          {activeCategories.length === 0 ? (
            <p className="admin-empty">No active categories yet. Create one in Categories first.</p>
          ) : (
            <div className="admin-category-pick-grid">
              {activeCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`admin-category-pick${categoryId === category.id ? ' is-selected' : ''}`}
                  onClick={() => startWorkspace(category.id)}
                >
                  {category.image ? <img src={category.image} alt="" /> : <span className="admin-category-fallback" />}
                  <strong>{category.name}</strong>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {step === 'workspace' ? (
        <div className="admin-batch-workspace">
          <div className="admin-batch-workspace-head">
            <div>
              <p className="eyebrow">{selectedCategory?.name || 'Category'}</p>
              <h3>Product Upload Workspace</h3>
              <p>
                {drafts.length} product{drafts.length === 1 ? '' : 's'} in this session · {readyCount}{' '}
                ready to submit
              </p>
            </div>
            <div className="admin-batch-workspace-actions">
              <button type="button" className="button button-wine button-rect" onClick={addProduct}>
                Add New Product
              </button>
              <button type="button" className="button button-wine button-rect" onClick={() => setStep('category')}>
                Change category
              </button>
            </div>
          </div>

          <div className="admin-batch-product-list">
            {drafts.map((draft, index) => {
              const draftErrors = validateProductDraft(draft);
              const previewImage =
                draft.colours?.find((colour) => colour.images?.length)?.images?.[0] || '';
              return (
                <article
                  key={draft.clientId}
                  className={`admin-batch-product${draft.expanded ? ' is-open' : ''}`}
                >
                  <header className="admin-batch-product-head">
                    <button
                      type="button"
                      className="admin-batch-toggle"
                      onClick={() => updateDraft(draft.clientId, { expanded: !draft.expanded })}
                    >
                      <span className="admin-batch-toggle-main">
                        {previewImage ? (
                          <img src={previewImage} alt="" className="admin-batch-thumb" />
                        ) : (
                          <span className="admin-batch-thumb is-empty" aria-hidden="true" />
                        )}
                        <span>
                          Product {index + 1}
                          {draft.name ? `: ${draft.name}` : ''}
                          {draftErrors.length ? (
                            <span className="admin-batch-ready is-warn"> Needs attention</span>
                          ) : (
                            <span className="admin-batch-ready is-ok"> Ready</span>
                          )}
                        </span>
                      </span>
                      <span aria-hidden="true">{draft.expanded ? '−' : '+'}</span>
                    </button>
                    <button
                      type="button"
                      className="text-button admin-danger"
                      onClick={() => removeProduct(draft.clientId)}
                    >
                      Remove
                    </button>
                  </header>

                  {draft.expanded ? (
                    <div className="admin-batch-product-body">
                      <div className="admin-batch-fields">
                        <label className="admin-field">
                          <span>
                            Product name <abbr title="required">*</abbr>
                          </span>
                          <input
                            value={draft.name}
                            onChange={(event) => updateDraft(draft.clientId, { name: event.target.value })}
                            placeholder="e.g. Classic Ladies Handbag"
                          />
                        </label>
                        <label className="admin-field">
                          <span>
                            Price (₦) <abbr title="required">*</abbr>
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={draft.price}
                            onChange={(event) => updateDraft(draft.clientId, { price: event.target.value })}
                            placeholder="35000"
                          />
                        </label>
                        <label className="admin-field">
                          <span>Category</span>
                          <input value={draft.categoryLabel || selectedCategory?.name || ''} disabled readOnly />
                        </label>
                        <label className="admin-field">
                          <span>Overall stock fallback</span>
                          <input
                            type="number"
                            min="0"
                            value={draft.stock}
                            onChange={(event) => updateDraft(draft.clientId, { stock: event.target.value })}
                          />
                        </label>
                        <label className="admin-field admin-batch-full">
                          <span>Description</span>
                          <textarea
                            rows={4}
                            value={draft.description}
                            onChange={(event) =>
                              updateDraft(draft.clientId, { description: event.target.value })
                            }
                            placeholder="Fit, material, styling notes…"
                          />
                        </label>
                      </div>

                      <div className="admin-check-row">
                        <label className="admin-check">
                          <input
                            type="checkbox"
                            checked={draft.bestSeller}
                            onChange={(event) =>
                              updateDraft(draft.clientId, { bestSeller: event.target.checked })
                            }
                          />
                          Best Seller
                        </label>
                        <label className="admin-check">
                          <input
                            type="checkbox"
                            checked={draft.newArrival}
                            onChange={(event) =>
                              updateDraft(draft.clientId, { newArrival: event.target.checked })
                            }
                          />
                          New Arrival
                        </label>
                        <label className="admin-check">
                          <input
                            type="checkbox"
                            checked={draft.featured}
                            onChange={(event) =>
                              updateDraft(draft.clientId, { featured: event.target.checked })
                            }
                          />
                          Featured
                        </label>
                        <label className="admin-check">
                          <input
                            type="checkbox"
                            checked={draft.active}
                            onChange={(event) =>
                              updateDraft(draft.clientId, { active: event.target.checked })
                            }
                          />
                          Publish immediately
                        </label>
                      </div>

                      <AdminColourVariantsEditor
                        colours={draft.colours}
                        sharedSizes={draft.sizes || []}
                        adminKey={adminKey}
                        productName={draft.name}
                        onChange={(colours) => updateDraft(draft.clientId, { colours })}
                        onSharedSizesChange={(sizes) => updateDraft(draft.clientId, { sizes })}
                      />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="admin-form-actions">
            <button type="button" className="button button-wine button-rect" onClick={addProduct}>
              Add New Product
            </button>
            <button type="button" className="button button-wine button-rect" onClick={goToReview}>
              Review before submit
            </button>
          </div>
        </div>
      ) : null}

      {step === 'review' ? (
        <div className="admin-batch-review">
          <h3>Review {drafts.length} product{drafts.length === 1 ? '' : 's'}</h3>
          <p>Confirm names, prices and colour images before uploading the batch.</p>

          {busy ? (
            <div className="admin-batch-progress-panel" aria-live="polite">
              <p>
                Uploading {Math.min(submitProgress.current, submitProgress.total)} of{' '}
                {submitProgress.total}
                {submitProgress.label ? ` · ${submitProgress.label}` : ''}
              </p>
              <div className="admin-progress admin-progress-dark">
                <div
                  className="admin-progress-bar"
                  style={{
                    width: `${busy && submitProgress.current >= submitProgress.total ? 100 : progressPercent}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          <ul className="admin-batch-review-list">
            {drafts.map((draft, index) => {
              const colourLabels = (draft.colours || [])
                .filter((colour) => colour.label)
                .map((colour) => colour.label);
              const imageCount = (draft.colours || []).reduce(
                (sum, colour) => sum + (colour.images?.length || 0),
                0,
              );
              const preview =
                draft.colours?.find((colour) => colour.images?.length)?.images?.[0] || '';
              return (
                <li key={draft.clientId}>
                  <div className="admin-batch-review-item">
                    {preview ? (
                      <img src={preview} alt="" className="admin-batch-thumb" />
                    ) : (
                      <span className="admin-batch-thumb is-empty" aria-hidden="true" />
                    )}
                    <div>
                      <strong>
                        {index + 1}. {draft.name}
                      </strong>
                      <p className="admin-muted">
                        {formatNaira(Number(draft.price) || 0)} · {colourLabels.join(', ') || 'No colours'}{' '}
                        · {imageCount} image{imageCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  {draft.createdProductId ? (
                    <span className="admin-status is-on">Already saved</span>
                  ) : draft.uploadStatus === 'uploading' ? (
                    <span className="admin-status">Uploading…</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div className="admin-form-actions">
            <button
              type="button"
              className="button button-wine button-rect"
              onClick={() => setStep('workspace')}
              disabled={busy}
            >
              Back to editing
            </button>
            <button
              type="button"
              className="button button-wine button-rect"
              onClick={submitBatch}
              disabled={busy}
            >
              {busy
                ? `Uploading ${submitProgress.current}/${submitProgress.total}…`
                : `Submit ${drafts.length} product${drafts.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'results' ? (
        <div className="admin-batch-results">
          <h3>Upload results</h3>
          <p className="admin-batch-summary">
            {successCount} succeeded · {failedCount} failed · {results.length} total
          </p>
          <ul className="admin-batch-review-list">
            {results.map((entry) => (
              <li key={entry.clientId}>
                <div>
                  <strong>{entry.name}</strong>
                  <p className="admin-muted">{entry.message}</p>
                </div>
                <span className={entry.ok ? 'admin-status is-on' : 'admin-status'}>
                  {entry.ok ? 'Success' : 'Failed'}
                </span>
              </li>
            ))}
          </ul>
          <div className="admin-form-actions">
            {results.some((entry) => !entry.ok) ? (
              <button type="button" className="button button-wine button-rect" onClick={retryFailed}>
                Retry failed products
              </button>
            ) : null}
            <button type="button" className="button button-wine button-rect" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
