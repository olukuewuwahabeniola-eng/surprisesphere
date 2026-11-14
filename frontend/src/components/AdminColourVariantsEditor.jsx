import { useEffect, useMemo, useRef, useState } from 'react';
import { uploadAdminImages, readError } from '../services/api';
import { blankColourVariant } from '../utils/adminProductDraft';
import { validateImageFiles } from '../utils/imageUpload';
import { colourSwatchHex } from '../utils/productOptions';
import AdminColourPalette from './AdminColourPalette';
import AdminSizeSelector from './AdminSizeSelector';

export default function AdminColourVariantsEditor({
  colours = [],
  sharedSizes = [],
  adminKey,
  productName = '',
  disabled = false,
  onChange,
  onSharedSizesChange,
}) {
  const [uploadingId, setUploadingId] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [localPreviews, setLocalPreviews] = useState({});

  const coloursRef = useRef(colours);
  const sharedSizesRef = useRef(sharedSizes);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    coloursRef.current = colours;
  }, [colours]);

  useEffect(() => {
    sharedSizesRef.current = sharedSizes;
  }, [sharedSizes]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(
    () => () => {
      Object.values(localPreviews).forEach((urls) => {
        (urls || []).forEach((url) => URL.revokeObjectURL(url));
      });
    },
    // Revoke only on unmount; live map is cleared per upload finish.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const selectedForPalette = useMemo(
    () =>
      colours
        .filter((colour) => String(colour.label || '').trim())
        .map((colour) => ({
          label: colour.label,
          hex: colour.hex || colourSwatchHex(colour.label),
        })),
    [colours],
  );

  function commitColours(next) {
    coloursRef.current = next;
    onChangeRef.current?.(next);
  }

  function syncColoursFromSelection(nextSelected) {
    const current = coloursRef.current;
    const byLabel = new Map(
      current.map((colour) => [String(colour.label || '').trim().toLowerCase(), colour]),
    );
    const next = nextSelected.map((entry) => {
      const key = entry.label.toLowerCase();
      const existing = byLabel.get(key);
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
        sizes: [...sharedSizesRef.current],
      });
    });
    commitColours(next.length ? next : []);
    if (next.length) {
      setExpandedId(next[next.length - 1].id);
    }
  }

  function toggleColour(colour) {
    const key = colour.label.toLowerCase();
    const exists = selectedForPalette.some((entry) => entry.label.toLowerCase() === key);
    if (exists) {
      syncColoursFromSelection(selectedForPalette.filter((entry) => entry.label.toLowerCase() !== key));
      return;
    }
    syncColoursFromSelection([...selectedForPalette, colour]);
  }

  function addCustomColour(colour) {
    toggleColour(colour);
  }

  function patchColourById(colourId, patch) {
    const current = coloursRef.current;
    const index = current.findIndex((colour) => colour.id === colourId);
    if (index < 0) {
      return null;
    }
    const next = current.map((colour, colourIndex) =>
      colourIndex === index ? { ...colour, ...patch } : colour,
    );
    commitColours(next);
    return next[index];
  }

  function updateColour(index, patch) {
    const current = coloursRef.current;
    const target = current[index];
    if (!target) return;
    patchColourById(target.id, patch);
  }

  function applySharedSizesToAll() {
    commitColours(
      coloursRef.current.map((colour) => ({
        ...colour,
        sizes: [...sharedSizesRef.current],
      })),
    );
  }

  function clearLocalPreview(colourId) {
    setLocalPreviews((current) => {
      const urls = current[colourId] || [];
      urls.forEach((url) => URL.revokeObjectURL(url));
      if (!(colourId in current)) return current;
      const next = { ...current };
      delete next[colourId];
      return next;
    });
  }

  async function handleUpload(colourId, fileList) {
    const check = validateImageFiles(fileList);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    if (!adminKey) {
      setError('Authentication failed. Unlock admin with a valid admin key, then try again.');
      return;
    }

    const colour = coloursRef.current.find((entry) => entry.id === colourId);
    if (!colour) {
      setError('That colour variant is no longer available. Select the colour again.');
      return;
    }

    const files = check.files;
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    clearLocalPreview(colourId);
    setLocalPreviews((current) => ({ ...current, [colourId]: previewUrls }));
    setExpandedId(colourId);
    setError('');
    setUploadingId(colourId);
    setProgress(0);

    try {
      const urls = [];
      for (let start = 0; start < files.length; start += 8) {
        const chunk = files.slice(start, start + 8);
        const result = await uploadAdminImages(adminKey, chunk, {
          onUploadProgress: (event) => {
            if (!event.total) return;
            const base = (start / files.length) * 100;
            const portion = (event.loaded / event.total) * (chunk.length / files.length) * 100;
            setProgress(Math.min(99, Math.round(base + portion)));
          },
        });
        (result.images || []).forEach((image) => {
          if (image?.url) urls.push(image.url);
        });
      }

      if (!urls.length) {
        throw new Error('The server did not return any image URLs.');
      }

      const latest = coloursRef.current.find((entry) => entry.id === colourId);
      if (!latest) {
        setError('Upload finished, but that colour was removed before images could be saved. Add the colour again and retry.');
        return;
      }

      const merged = [...(latest.images || []), ...urls];
      patchColourById(colourId, {
        images: merged,
        mainIndex: latest.images?.length ? latest.mainIndex : 0,
      });
      setProgress(100);
    } catch (err) {
      setError(readError(err, 'Could not upload colour images.'));
    } finally {
      clearLocalPreview(colourId);
      setUploadingId('');
      window.setTimeout(() => setProgress(0), 600);
    }
  }

  function removeImage(colourIndex, imageIndex) {
    const colour = coloursRef.current[colourIndex];
    if (!colour) return;
    const images = (colour.images || []).filter((_, index) => index !== imageIndex);
    const mainIndex =
      images.length === 0
        ? 0
        : Math.min(
            colour.mainIndex >= imageIndex ? Math.max(0, colour.mainIndex - 1) : colour.mainIndex,
            images.length - 1,
          );
    patchColourById(colour.id, { images, mainIndex });
  }

  return (
    <div className="admin-colour-editor">
      <div className="admin-colour-editor-head">
        <div>
          <h3>Colour variants</h3>
          <p>
            Group every colour under this one product. Each colour keeps its own pictures, sizes,
            stock and availability.
          </p>
        </div>
      </div>

      {error ? (
        <p className="form-note admin-error" role="alert">
          {error}
        </p>
      ) : null}

      <AdminColourPalette
        selected={selectedForPalette}
        disabled={disabled || Boolean(uploadingId)}
        onToggle={toggleColour}
        onAddCustom={addCustomColour}
      />

      <AdminSizeSelector
        selected={sharedSizes}
        disabled={disabled}
        title="Shared sizes"
        help="Optional. Select sizes once, then apply them to every colour — or set sizes per colour below."
        onChange={onSharedSizesChange}
        onApplyToAll={applySharedSizesToAll}
        showApplyToAll={colours.length > 0}
      />

      <div className="admin-colour-list">
        {colours.length === 0 ? (
          <p className="admin-muted">Select colours above to create variant image sections.</p>
        ) : null}

        {colours.map((colour, index) => {
          const swatch = colourSwatchHex(colour.label, colour.hex);
          const isUploading = uploadingId && uploadingId === colour.id;
          const isOpen = expandedId === colour.id || (!expandedId && index === 0);
          const pending = localPreviews[colour.id] || [];
          return (
            <article
              key={colour.id || index}
              className={`admin-colour-card${isOpen ? ' is-open' : ''}${colour.available === false ? ' is-unavailable' : ''}`}
            >
              <div className="admin-colour-card-top">
                <button
                  type="button"
                  className="admin-colour-title admin-batch-toggle"
                  onClick={() => setExpandedId(isOpen ? '' : colour.id)}
                >
                  <span className="admin-swatch" style={{ background: swatch }} aria-hidden="true" />
                  <strong>{colour.label || `Colour ${index + 1}`}</strong>
                  <span className="admin-muted">
                    {colour.images?.length || 0} image{(colour.images?.length || 0) === 1 ? '' : 's'}
                    {colour.available === false ? ' · Unavailable' : ''}
                  </span>
                  <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                <button
                  type="button"
                  className="text-button admin-danger"
                  onClick={() =>
                    commitColours(coloursRef.current.filter((entry) => entry.id !== colour.id))
                  }
                  disabled={disabled || Boolean(uploadingId)}
                >
                  Remove colour
                </button>
              </div>

              {isOpen ? (
                <>
                  <div className="admin-colour-fields">
                    <label className="admin-field">
                      <span>Stock for this colour</span>
                      <input
                        type="number"
                        min="0"
                        value={colour.stock}
                        onChange={(event) => updateColour(index, { stock: event.target.value })}
                        placeholder="Optional"
                        disabled={disabled || colour.available === false}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Price override (₦)</span>
                      <input
                        type="number"
                        min="0"
                        value={colour.price}
                        onChange={(event) => updateColour(index, { price: event.target.value })}
                        placeholder="Leave blank to use product price"
                        disabled={disabled}
                      />
                    </label>
                    <label className="admin-check admin-colour-available">
                      <input
                        type="checkbox"
                        checked={colour.available !== false}
                        onChange={(event) =>
                          updateColour(index, { available: event.target.checked })
                        }
                        disabled={disabled}
                      />
                      Colour available for purchase
                    </label>
                  </div>

                  <AdminSizeSelector
                    selected={Array.isArray(colour.sizes) ? colour.sizes : []}
                    disabled={disabled}
                    title={`Sizes for ${colour.label || 'this colour'}`}
                    help="Pick sizes available in this colour. Leave empty if this product has no sizes."
                    onChange={(sizes) => updateColour(index, { sizes })}
                  />

                  <div className="admin-colour-images">
                    <div className="admin-colour-images-head">
                      <p>
                        Images for {colour.label || 'this colour'}
                        {productName ? ` · ${productName}` : ''}
                      </p>
                      <label className="button button-wine button-rect admin-file-button">
                        {isUploading ? `Uploading… ${progress}%` : 'Upload images'}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                          multiple
                          hidden
                          disabled={disabled || Boolean(uploadingId)}
                          onChange={(event) => {
                            handleUpload(colour.id, event.target.files);
                            event.target.value = '';
                          }}
                        />
                      </label>
                    </div>

                    {isUploading ? (
                      <div className="admin-progress admin-progress-dark" aria-hidden="true">
                        <div className="admin-progress-bar" style={{ width: `${progress}%` }} />
                      </div>
                    ) : null}

                    {pending.length ? (
                      <ul className="admin-image-grid admin-image-grid-pending" aria-label="Upload preview">
                        {pending.map((url) => (
                          <li key={url}>
                            <img src={url} alt="" />
                            <p className="admin-muted">Uploading…</p>
                          </li>
                        ))}
                      </ul>
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
                                onClick={() => updateColour(index, { mainIndex: imageIndex })}
                                disabled={disabled || Boolean(uploadingId)}
                              >
                                {colour.mainIndex === imageIndex ? 'Main image' : 'Set main'}
                              </button>
                              <button
                                type="button"
                                className="text-button admin-danger"
                                onClick={() => removeImage(index, imageIndex)}
                                disabled={disabled || Boolean(uploadingId)}
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : !pending.length ? (
                      <p className="admin-muted">No images yet for this colour.</p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
