import { useMemo, useState } from 'react';
import { createAdminProduct, readError, uploadAdminImages } from '../services/api';
import {
  blankColourVariant,
  blankProductDraft,
  draftToProductPayload,
  validateProductDraft,
} from '../utils/adminProductDraft';
import { validateImageFiles } from '../utils/imageUpload';
import { formatNaira } from '../utils/money';
import { colourSwatchHex } from '../utils/productOptions';
import AdminColourPalette from './AdminColourPalette';
import AdminProductPlacement from './AdminProductPlacement';
import AdminSizeSelector from './AdminSizeSelector';

const STAGES = [
  { id: 'details', label: 'Product Details', hint: 'Name, category and pricing' },
  { id: 'variants', label: 'Variants', hint: 'Colours and optional sizes' },
  { id: 'images', label: 'Images', hint: 'Photos for each colour' },
  { id: 'review', label: 'Review', hint: 'Confirm and save' },
];

function stageIndex(id) {
  return STAGES.findIndex((stage) => stage.id === id);
}

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

  const [stage, setStage] = useState('details');
  const [draft, setDraft] = useState(() => blankProductDraft({ stock: '', expanded: true }));
  const [busy, setBusy] = useState(false);
  const [uploadingColourId, setUploadingColourId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOverId, setDragOverId] = useState('');

  const selectedCategory = activeCategories.find(
    (category) => category.slug === draft.category || category.id === draft.category,
  );
  const previewColour = draft.colours.find((colour) => colour.images?.length) || draft.colours[0];
  const previewImage =
    previewColour?.images?.[previewColour.mainIndex || 0] || previewColour?.images?.[0] || '';
  const totalImages = draft.colours.reduce((sum, colour) => sum + (colour.images?.length || 0), 0);
  const currentStage = stageIndex(stage);

  function patchDraft(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function patchColour(colourId, patch) {
    setDraft((current) => ({
      ...current,
      colours: current.colours.map((colour) =>
        colour.id === colourId ? { ...colour, ...patch } : colour,
      ),
    }));
  }

  function syncColoursFromSelection(nextSelected) {
    setDraft((current) => {
      const byLabel = new Map(
        current.colours.map((colour) => [String(colour.label || '').trim().toLowerCase(), colour]),
      );
      const colours = nextSelected.map((entry) => {
        const existing = byLabel.get(entry.label.toLowerCase());
        if (existing) {
          return {
            ...existing,
            label: entry.label,
            hex: entry.hex || existing.hex || colourSwatchHex(entry.label),
          };
        }
        return blankColourVariant({
          label: entry.label,
          hex: entry.hex || colourSwatchHex(entry.label),
          sizes: [...(current.sizes || [])],
        });
      });
      return { ...current, colours };
    });
  }

  function toggleColour(colour) {
    const key = colour.label.toLowerCase();
    const selected = draft.colours
      .filter((entry) => entry.label)
      .map((entry) => ({ label: entry.label, hex: entry.hex || colourSwatchHex(entry.label) }));
    const exists = selected.some((entry) => entry.label.toLowerCase() === key);
    syncColoursFromSelection(
      exists
        ? selected.filter((entry) => entry.label.toLowerCase() !== key)
        : [...selected, colour],
    );
  }

  function applySharedSizesToAll() {
    setDraft((current) => ({
      ...current,
      colours: current.colours.map((colour) => ({
        ...colour,
        sizes: [...(current.sizes || [])],
      })),
    }));
  }

  async function uploadFilesToColour(colourId, fileList) {
    const check = validateImageFiles(fileList);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    if (!adminKey) {
      setError('Authentication failed. Unlock admin with a valid admin key, then try again.');
      return;
    }

    setError('');
    setUploadingColourId(colourId);
    setUploadProgress(0);
    try {
      const urls = [];
      const files = check.files;
      for (let start = 0; start < files.length; start += 8) {
        const chunk = files.slice(start, start + 8);
        const result = await uploadAdminImages(adminKey, chunk, {
          onUploadProgress: (event) => {
            if (!event.total) return;
            const base = (start / files.length) * 100;
            const portion = (event.loaded / event.total) * (chunk.length / files.length) * 100;
            setUploadProgress(Math.min(99, Math.round(base + portion)));
          },
        });
        (result.images || []).forEach((image) => {
          if (image?.url) urls.push(image.url);
        });
      }
      if (!urls.length) {
        throw new Error('The server did not return any image URLs.');
      }
      setDraft((current) => ({
        ...current,
        colours: current.colours.map((colour) => {
          if (colour.id !== colourId) return colour;
          const images = [...(colour.images || []), ...urls];
          return {
            ...colour,
            images,
            mainIndex: colour.images?.length ? colour.mainIndex : 0,
          };
        }),
      }));
      setUploadProgress(100);
    } catch (err) {
      setError(readError(err, 'Could not upload colour images.'));
    } finally {
      setUploadingColourId('');
      window.setTimeout(() => setUploadProgress(0), 500);
    }
  }

  function validateStage(target = stage) {
    if (target === 'details') {
      if (!String(draft.name || '').trim()) return 'Product name is required.';
      if (!String(draft.category || '').trim()) return 'Choose a category.';
      if (!Number.isFinite(Number(draft.price)) || Number(draft.price) < 0) {
        return 'Enter a valid base price.';
      }
      return '';
    }
    if (target === 'variants') {
      if (!draft.colours.some((colour) => String(colour.label || '').trim())) {
        return 'Select at least one colour.';
      }
      return '';
    }
    if (target === 'images' || target === 'review') {
      const issues = validateProductDraft({
        ...draft,
        category: draft.category || selectedCategory?.id || '',
      });
      return issues[0] || '';
    }
    return '';
  }

  function goNext() {
    const message = validateStage(stage);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    const next = STAGES[Math.min(currentStage + 1, STAGES.length - 1)];
    setStage(next.id);
  }

  function goBack() {
    setError('');
    const prev = STAGES[Math.max(currentStage - 1, 0)];
    setStage(prev.id);
  }

  async function saveProduct({ addAnother = false } = {}) {
    const message = validateStage('review');
    if (message) {
      setError(message);
      setStage('images');
      return;
    }
    if (busy) return;

    setBusy(true);
    setError('');
    try {
      const payload = draftToProductPayload({
        ...draft,
        category: draft.category || selectedCategory?.id,
        categoryLabel: selectedCategory?.name || draft.categoryLabel,
      });
      await createAdminProduct(adminKey, payload);
      onCompleted?.();
      if (addAnother) {
        // Start a fresh product so category/placement never leak across bulk session items.
        setDraft(blankProductDraft({ stock: '', expanded: true }));
        setStage('details');
        setError('');
        return;
      }
      onClose?.();
    } catch (err) {
      setError(readError(err, 'Could not save the product.'));
    } finally {
      setBusy(false);
    }
  }

  const selectedForPalette = draft.colours
    .filter((colour) => colour.label)
    .map((colour) => ({
      label: colour.label,
      hex: colour.hex || colourSwatchHex(colour.label),
    }));

  return (
    <section className="admin-upload-studio" aria-label="Add new product">
      <div className="admin-upload-studio-head">
        <div>
          <p className="eyebrow">Admin · Products</p>
          <h2>Add New Product</h2>
          <p>Create one parent product with colour variants, images, stock and optional sizes.</p>
        </div>
        <button type="button" className="button button-wine button-rect" onClick={onClose} disabled={busy}>
          Back to Products
        </button>
      </div>

      <ol className="admin-upload-steps" aria-label="Upload stages">
        {STAGES.map((entry, index) => (
          <li
            key={entry.id}
            className={`${index === currentStage ? 'is-active' : ''} ${index < currentStage ? 'is-done' : ''}`}
          >
            <button type="button" onClick={() => setStage(entry.id)} disabled={busy}>
              <span className="admin-upload-step-index">{index + 1}</span>
              <span>
                <strong>{entry.label}</strong>
                <small>{entry.hint}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {error ? (
        <p className="form-note admin-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="admin-upload-layout">
        <div className="admin-upload-main">
          {stage === 'details' ? (
            <section className="admin-upload-card">
              <div className="admin-upload-card-head">
                <span className="admin-upload-card-icon" aria-hidden="true">
                  ▢
                </span>
                <div>
                  <h3>1. Product Details</h3>
                  <p>Set the core catalogue information for this design.</p>
                </div>
              </div>

              <div className="admin-upload-fields">
                <label className="admin-field">
                  <span>
                    Product Name <abbr title="required">*</abbr>
                  </span>
                  <input
                    value={draft.name}
                    onChange={(event) => patchDraft({ name: event.target.value })}
                    placeholder="e.g. Elegant Women's Handbag"
                    maxLength={160}
                  />
                </label>

                <label className="admin-field">
                  <span>
                    Category <abbr title="required">*</abbr>
                  </span>
                  <select
                    value={draft.category}
                    onChange={(event) => {
                      const value = event.target.value;
                      const category = activeCategories.find(
                        (entry) => entry.slug === value || entry.id === value,
                      );
                      patchDraft({
                        category: value,
                        categoryLabel: category?.name || '',
                      });
                    }}
                  >
                    <option value="">Select a category</option>
                    {activeCategories.map((category) => (
                      <option key={category.id || category.slug} value={category.slug || category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {activeCategories.length === 0 ? (
                    <span className="admin-char-count">
                      No active categories loaded yet. Check Categories in admin, then reopen Upload.
                    </span>
                  ) : null}
                </label>

                <label className="admin-field admin-batch-full">
                  <span>Product Description</span>
                  <textarea
                    rows={5}
                    value={draft.description}
                    onChange={(event) => patchDraft({ description: event.target.value.slice(0, 1000) })}
                    placeholder="Fabric, finish, styling notes…"
                    maxLength={1000}
                  />
                  <small className="admin-char-count">{String(draft.description || '').length}/1000</small>
                </label>

                <label className="admin-field">
                  <span>
                    Base Price (₦) <abbr title="required">*</abbr>
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={draft.price}
                    onChange={(event) => patchDraft({ price: event.target.value })}
                    placeholder="25000"
                  />
                </label>

                <label className="admin-field">
                  <span>Total Stock fallback</span>
                  <input
                    type="number"
                    min="0"
                    value={draft.stock}
                    onChange={(event) => patchDraft({ stock: event.target.value })}
                    placeholder="Used only if colour stock is empty"
                  />
                </label>
              </div>

              <AdminProductPlacement
                bestSeller={draft.bestSeller}
                newArrival={draft.newArrival}
                disabled={busy}
                onChange={(patch) => patchDraft(patch)}
              />

              <div className="admin-check-row">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={draft.featured}
                    onChange={(event) => patchDraft({ featured: event.target.checked })}
                  />
                  Featured elsewhere
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(event) => patchDraft({ active: event.target.checked })}
                  />
                  Publish immediately
                </label>
              </div>
            </section>
          ) : null}

          {stage === 'variants' ? (
            <section className="admin-upload-card">
              <div className="admin-upload-card-head">
                <span className="admin-upload-card-icon" aria-hidden="true">
                  ◈
                </span>
                <div>
                  <h3>2. Product Variants</h3>
                  <p>Choose colours and optional sizes. Assign sizes per colour when they differ.</p>
                </div>
              </div>

              <AdminColourPalette
                selected={selectedForPalette}
                disabled={busy}
                onToggle={toggleColour}
                onAddCustom={toggleColour}
              />

              <AdminSizeSelector
                selected={draft.sizes || []}
                disabled={busy}
                title="Choose Sizes"
                help="Optional. Select shared sizes, then apply them to every colour — or set sizes per colour below."
                onChange={(sizes) => patchDraft({ sizes })}
                onApplyToAll={applySharedSizesToAll}
                showApplyToAll={draft.colours.length > 0}
              />

              {draft.colours.length ? (
                <div className="admin-variant-size-list">
                  <h4>Size assignment by colour</h4>
                  {draft.colours.map((colour) => (
                    <div key={colour.id} className="admin-variant-size-row">
                      <div className="admin-colour-title">
                        <span
                          className="admin-swatch"
                          style={{ background: colourSwatchHex(colour.label, colour.hex) }}
                          aria-hidden="true"
                        />
                        <strong>{colour.label}</strong>
                      </div>
                      <AdminSizeSelector
                        selected={Array.isArray(colour.sizes) ? colour.sizes : []}
                        disabled={busy}
                        title={`Sizes for ${colour.label}`}
                        help=""
                        chipLimit={6}
                        onChange={(sizes) => patchColour(colour.id, { sizes })}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-muted">Select colours above to manage per-colour sizes.</p>
              )}
            </section>
          ) : null}

          {stage === 'images' ? (
            <section className="admin-upload-card">
              <div className="admin-upload-card-head">
                <span className="admin-upload-card-icon" aria-hidden="true">
                  ▤
                </span>
                <div>
                  <h3>3. Images by Colour</h3>
                  <p>
                    Upload multiple photos inside each colour section. Images stay on that colour only.
                  </p>
                </div>
              </div>

              {!draft.colours.length ? (
                <p className="admin-muted">Go back to Variants and choose at least one colour first.</p>
              ) : (
                <div className="admin-colour-image-grid">
                  {draft.colours.map((colour) => {
                    const isUploading = uploadingColourId === colour.id;
                    return (
                      <article key={colour.id} className="admin-colour-upload-card">
                        <header className="admin-colour-upload-head">
                          <div className="admin-colour-title">
                            <span
                              className="admin-swatch"
                              style={{ background: colourSwatchHex(colour.label, colour.hex) }}
                              aria-hidden="true"
                            />
                            <strong>{colour.label} Variant</strong>
                          </div>
                          <span className="admin-image-count">
                            {colour.images?.length || 0} image
                            {(colour.images?.length || 0) === 1 ? '' : 's'}
                          </span>
                        </header>

                        <label
                          className={`admin-dropzone${dragOverId === colour.id ? ' is-dragover' : ''}${isUploading ? ' is-uploading' : ''}`}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDragOverId(colour.id);
                          }}
                          onDragLeave={() => setDragOverId('')}
                          onDrop={(event) => {
                            event.preventDefault();
                            setDragOverId('');
                            uploadFilesToColour(colour.id, event.dataTransfer.files);
                          }}
                        >
                          <span className="admin-dropzone-title">
                            {isUploading
                              ? `Uploading… ${uploadProgress}%`
                              : `Upload ${colour.label} Photos`}
                          </span>
                          <span className="admin-dropzone-help">
                            Select multiple images, or drag and drop them here.
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            multiple
                            hidden
                            disabled={busy || Boolean(uploadingColourId)}
                            onChange={(event) => {
                              uploadFilesToColour(colour.id, event.target.files);
                              event.target.value = '';
                            }}
                          />
                        </label>

                        {isUploading ? (
                          <div className="admin-progress admin-progress-dark" aria-hidden="true">
                            <div className="admin-progress-bar" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        ) : null}

                        {colour.images?.length ? (
                          <ul className="admin-image-grid">
                            {colour.images.map((url, imageIndex) => (
                              <li key={`${url}-${imageIndex}`}>
                                <img src={url} alt="" />
                                <div className="admin-image-actions">
                                  <button
                                    type="button"
                                    className={`text-button${colour.mainIndex === imageIndex ? ' is-active' : ''}`}
                                    onClick={() => patchColour(colour.id, { mainIndex: imageIndex })}
                                    disabled={busy}
                                  >
                                    {colour.mainIndex === imageIndex ? 'Main image' : 'Set main'}
                                  </button>
                                  <button
                                    type="button"
                                    className="text-button"
                                    disabled={busy || imageIndex === 0}
                                    onClick={() => {
                                      if (imageIndex === 0) return;
                                      const images = [...colour.images];
                                      [images[imageIndex - 1], images[imageIndex]] = [
                                        images[imageIndex],
                                        images[imageIndex - 1],
                                      ];
                                      const mainIndex =
                                        colour.mainIndex === imageIndex
                                          ? imageIndex - 1
                                          : colour.mainIndex === imageIndex - 1
                                            ? imageIndex
                                            : colour.mainIndex;
                                      patchColour(colour.id, { images, mainIndex });
                                    }}
                                  >
                                    Move left
                                  </button>
                                  <button
                                    type="button"
                                    className="text-button admin-danger"
                                    onClick={() => {
                                      const images = colour.images.filter((_, index) => index !== imageIndex);
                                      const mainIndex =
                                        images.length === 0
                                          ? 0
                                          : Math.min(
                                              colour.mainIndex >= imageIndex
                                                ? Math.max(0, colour.mainIndex - 1)
                                                : colour.mainIndex,
                                              images.length - 1,
                                            );
                                      patchColour(colour.id, { images, mainIndex });
                                    }}
                                    disabled={busy}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="admin-muted">No images yet for {colour.label}.</p>
                        )}

                        <div className="admin-colour-fields">
                          <label className="admin-field">
                            <span>Variant Stock</span>
                            <input
                              type="number"
                              min="0"
                              value={colour.stock}
                              onChange={(event) => patchColour(colour.id, { stock: event.target.value })}
                              placeholder="Enter stock"
                              disabled={busy}
                            />
                          </label>
                          <label className="admin-field">
                            <span>Optional price override (₦)</span>
                            <input
                              type="number"
                              min="0"
                              value={colour.price}
                              onChange={(event) => patchColour(colour.id, { price: event.target.value })}
                              placeholder="Leave blank for base price"
                              disabled={busy}
                            />
                          </label>
                          <label className="admin-check admin-colour-available">
                            <input
                              type="checkbox"
                              checked={colour.available !== false}
                              onChange={(event) =>
                                patchColour(colour.id, { available: event.target.checked })
                              }
                              disabled={busy}
                            />
                            Colour available for purchase
                          </label>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {stage === 'review' ? (
            <section className="admin-upload-card">
              <div className="admin-upload-card-head">
                <span className="admin-upload-card-icon" aria-hidden="true">
                  ✓
                </span>
                <div>
                  <h3>4. Review and Save</h3>
                  <p>Confirm everything before creating one parent product with its variants.</p>
                </div>
              </div>

              <dl className="admin-review-summary">
                <div>
                  <dt>Product Name</dt>
                  <dd>{draft.name || '—'}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{selectedCategory?.name || draft.categoryLabel || '—'}</dd>
                </div>
                <div>
                  <dt>Base Price</dt>
                  <dd>{formatNaira(Number(draft.price) || 0)}</dd>
                </div>
                <div>
                  <dt>Homepage placement</dt>
                  <dd>
                    {[
                      draft.bestSeller ? 'Best Sellers' : null,
                      draft.newArrival ? 'New Arrivals' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'None selected'}
                  </dd>
                </div>
                <div>
                  <dt>Colours</dt>
                  <dd>
                    {draft.colours.map((colour) => colour.label).join(', ') || '—'}
                  </dd>
                </div>
                <div>
                  <dt>Sizes</dt>
                  <dd>
                    {[
                      ...new Set([
                        ...(draft.sizes || []),
                        ...draft.colours.flatMap((colour) => colour.sizes || []),
                      ]),
                    ].join(', ') || 'None'}
                  </dd>
                </div>
                <div>
                  <dt>Total Images</dt>
                  <dd>{totalImages}</dd>
                </div>
                <div className="admin-batch-full">
                  <dt>Variant stock</dt>
                  <dd>
                    {draft.colours
                      .map(
                        (colour) =>
                          `${colour.label}: ${colour.stock !== '' && colour.stock != null ? colour.stock : 'fallback'}`,
                      )
                      .join(' · ') || '—'}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          <div className="admin-upload-nav">
            {currentStage > 0 ? (
              <button type="button" className="button button-wine button-rect" onClick={goBack} disabled={busy}>
                Back
              </button>
            ) : (
              <button type="button" className="button button-wine button-rect" onClick={onClose} disabled={busy}>
                Cancel
              </button>
            )}
            {stage !== 'review' ? (
              <button type="button" className="button button-wine button-rect" onClick={goNext} disabled={busy}>
                Continue
              </button>
            ) : (
              <div className="admin-upload-save-actions">
                <button
                  type="button"
                  className="button button-wine button-rect"
                  onClick={() => saveProduct({ addAnother: true })}
                  disabled={busy || Boolean(uploadingColourId)}
                >
                  {busy ? 'Saving…' : 'Save & Add Another'}
                </button>
                <button
                  type="button"
                  className="button button-wine button-rect"
                  onClick={() => saveProduct()}
                  disabled={busy || Boolean(uploadingColourId)}
                >
                  {busy ? 'Saving…' : 'Save Product'}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="admin-upload-preview" aria-label="Live preview">
          <div className="admin-upload-preview-card">
            <p className="eyebrow">Live Preview</p>
            <div className="admin-upload-preview-media">
              {previewImage ? (
                <img src={previewImage} alt="" />
              ) : (
                <div className="admin-upload-preview-empty">Product image preview</div>
              )}
            </div>
            <h3>{draft.name || 'Product name'}</h3>
            <p className="admin-upload-preview-price">
              {formatNaira(Number(previewColour?.price || draft.price) || 0)}
            </p>
            <label className="admin-field">
              <span>Colour</span>
              <select value={previewColour?.label || ''} disabled>
                {(draft.colours.length ? draft.colours : [{ label: 'No colours yet' }]).map((colour) => (
                  <option key={colour.label} value={colour.label}>
                    {colour.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Size</span>
              <select disabled>
                {(previewColour?.sizes?.length
                  ? previewColour.sizes
                  : draft.sizes?.length
                    ? draft.sizes
                    : ['No sizes']
                ).map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="button button-wine button-rect button-block" disabled>
              Add to Cart
            </button>
            <button type="button" className="button button-wine button-rect button-block" disabled>
              WhatsApp Order
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
