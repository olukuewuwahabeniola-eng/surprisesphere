import { useRef, useState } from 'react';
import { readError, uploadAdminImages } from '../services/api';

function emptyVariant() {
  return { size: '', colour: '', price: '', stock: '', image: '' };
}

export function blankProductForm() {
  return {
    name: '',
    description: '',
    price: '',
    category: '',
    images: [''],
    sizes: [''],
    colours: [''],
    variants: [],
    stock: '0',
    bestSeller: false,
    newArrival: false,
    featured: false,
    active: true,
  };
}

export function productToForm(product) {
  const images =
    Array.isArray(product?.images) && product.images.length
      ? product.images.map((entry) => entry.url || entry || '')
      : [product?.image || ''];

  const sizes =
    Array.isArray(product?.sizes) && product.sizes.length
      ? product.sizes.map((entry) => (typeof entry === 'string' ? entry : entry.label || ''))
      : [''];

  const colours =
    Array.isArray(product?.colours) && product.colours.length
      ? product.colours.map((entry) => (typeof entry === 'string' ? entry : entry.label || ''))
      : [''];

  const variants = Array.isArray(product?.variants)
    ? product.variants.map((entry) => ({
        size: entry.size || '',
        colour: entry.colour || '',
        price: entry.price != null ? String(entry.price) : '',
        stock: entry.stock != null ? String(entry.stock) : '',
        image: entry.image || '',
      }))
    : [];

  return {
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price != null ? String(product.price) : '',
    category: product?.categoryId || product?.category || '',
    images: images.length ? images : [''],
    sizes: sizes.length ? sizes : [''],
    colours: colours.length ? colours : [''],
    variants,
    stock: product?.stock != null ? String(product.stock) : '0',
    bestSeller: Boolean(product?.bestSeller),
    newArrival: Boolean(product?.newArrival),
    featured: Boolean(product?.featured),
    active: product?.active !== false,
  };
}

export function formToPayload(form) {
  const images = form.images.map((url) => String(url || '').trim()).filter(Boolean);
  const sizes = form.sizes.map((value) => String(value || '').trim()).filter(Boolean);
  const colours = form.colours.map((value) => String(value || '').trim()).filter(Boolean);
  const variants = form.variants
    .map((entry) => ({
      size: String(entry.size || '').trim(),
      colour: String(entry.colour || '').trim(),
      price: entry.price === '' ? undefined : Number(entry.price),
      stock: entry.stock === '' ? undefined : Number(entry.stock),
      image: String(entry.image || '').trim(),
    }))
    .filter((entry) => entry.size || entry.colour || entry.price != null);

  return {
    name: String(form.name || '').trim(),
    description: String(form.description || '').trim(),
    price: Number(form.price),
    category: form.category,
    images: images.map((url) => ({ url, alt: String(form.name || '').trim() })),
    sizes,
    colours,
    variants,
    stock: Number(form.stock || 0),
    bestSeller: Boolean(form.bestSeller),
    newArrival: Boolean(form.newArrival),
    featured: Boolean(form.featured),
    active: Boolean(form.active),
  };
}

function updateList(list, index, value) {
  return list.map((entry, entryIndex) => (entryIndex === index ? value : entry));
}

export default function AdminProductForm({
  form,
  categories = [],
  adminKey = '',
  busy = false,
  mode = 'create',
  onChange,
  onSubmit,
  onCancel,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  function setField(key, value) {
    onChange({ ...form, [key]: value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(formToPayload(form));
  }

  function moveImage(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.images.length) {
      return;
    }
    const next = [...form.images];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setField('images', next.length ? next : ['']);
  }

  async function handleFileSelect(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) {
      return;
    }

    if (!adminKey) {
      setUploadError('Enter your admin key before uploading images.');
      return;
    }

    const invalid = files.find((file) => {
      const type = String(file.type || '').toLowerCase();
      return !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type);
    });
    if (invalid) {
      setUploadError('Only JPG, JPEG, PNG and WebP images are allowed.');
      return;
    }

    const tooLarge = files.find((file) => file.size > 5 * 1024 * 1024);
    if (tooLarge) {
      setUploadError('Each image must be 5MB or smaller.');
      return;
    }

    if (files.length > 8) {
      setUploadError('You can upload up to 8 images at a time.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const result = await uploadAdminImages(adminKey, files, {
        onUploadProgress(progressEvent) {
          if (!progressEvent.total) {
            return;
          }
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(percent);
        },
      });

      const uploadedUrls = (result.images || []).map((image) => image.url).filter(Boolean);
      const existing = form.images.map((url) => String(url || '').trim()).filter(Boolean);
      setField('images', [...existing, ...uploadedUrls]);
      setUploadProgress(100);
    } catch (error) {
      setUploadError(readError(error, 'Image upload failed. Please try again.'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="admin-product-form" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <label>
          Product name
          <input
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
            required
            maxLength={160}
          />
        </label>

        <label>
          Price (₦)
          <input
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(event) => setField('price', event.target.value)}
            required
          />
        </label>

        <label>
          Category
          <select
            value={form.category}
            onChange={(event) => setField('category', event.target.value)}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.active === false ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Stock
          <input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(event) => setField('stock', event.target.value)}
            required
          />
        </label>
      </div>

      <label>
        Description
        <textarea
          rows={4}
          value={form.description}
          onChange={(event) => setField('description', event.target.value)}
          maxLength={4000}
        />
      </label>

      <fieldset className="admin-fieldset">
        <legend>Product images</legend>
        <p className="admin-help">
          Upload JPG, PNG or WebP files (up to 8 at a time, 5MB each), or paste an existing image URL.
          The first image is the main shop thumbnail.
        </p>

        <div className="admin-upload-bar">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            hidden
            onChange={handleFileSelect}
          />
          <button
            type="button"
            className="button button-wine button-rect"
            disabled={busy || uploading || !adminKey}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? `Uploading… ${uploadProgress}%` : 'Upload images'}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy || uploading}
            onClick={() => setField('images', [...form.images.filter(Boolean), ''])}
          >
            + Add image URL
          </button>
        </div>

        {uploading && (
          <div className="admin-progress" aria-live="polite">
            <div className="admin-progress-bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {uploadError && (
          <p className="form-note admin-error" role="alert">
            {uploadError}
          </p>
        )}

        <div className="admin-image-list">
          {form.images.map((url, index) => (
            <div className="admin-image-card" key={`image-${index}`}>
              <div className="admin-image-preview-wrap">
                {url ? (
                  <img className="admin-image-preview" src={url} alt={`Product image ${index + 1}`} />
                ) : (
                  <div className="admin-image-placeholder">No preview</div>
                )}
                {index === 0 && url ? <span className="admin-pill">Main</span> : null}
              </div>
              <input
                value={url}
                onChange={(event) => setField('images', updateList(form.images, index, event.target.value))}
                placeholder="/images/prod-handbag.jpg or https://..."
              />
              <div className="admin-image-actions">
                <button
                  type="button"
                  className="button button-cream button-rect"
                  disabled={index === 0 || uploading}
                  onClick={() => moveImage(index, -1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="button button-cream button-rect"
                  disabled={index === form.images.length - 1 || uploading}
                  onClick={() => moveImage(index, 1)}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="button button-cream button-rect"
                  disabled={uploading}
                  onClick={() =>
                    setField(
                      'images',
                      form.images.length > 1 ? form.images.filter((_, i) => i !== index) : [''],
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="admin-form-grid">
        <fieldset className="admin-fieldset">
          <legend>Sizes</legend>
          {form.sizes.map((size, index) => (
            <div className="admin-repeat-row" key={`size-${index}`}>
              <input
                value={size}
                onChange={(event) => setField('sizes', updateList(form.sizes, index, event.target.value))}
                placeholder="e.g. 38 or One Size"
              />
              <button
                type="button"
                className="button button-cream button-rect"
                onClick={() =>
                  setField(
                    'sizes',
                    form.sizes.length > 1 ? form.sizes.filter((_, i) => i !== index) : [''],
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="text-button" onClick={() => setField('sizes', [...form.sizes, ''])}>
            + Add size
          </button>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Colours</legend>
          {form.colours.map((colour, index) => (
            <div className="admin-repeat-row" key={`colour-${index}`}>
              <input
                value={colour}
                onChange={(event) =>
                  setField('colours', updateList(form.colours, index, event.target.value))
                }
                placeholder="e.g. Black"
              />
              <button
                type="button"
                className="button button-cream button-rect"
                onClick={() =>
                  setField(
                    'colours',
                    form.colours.length > 1 ? form.colours.filter((_, i) => i !== index) : [''],
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-button"
            onClick={() => setField('colours', [...form.colours, ''])}
          >
            + Add colour
          </button>
        </fieldset>
      </div>

      <fieldset className="admin-fieldset">
        <legend>Variations (optional)</legend>
        <p className="admin-help">Use this for size/colour prices and stock that differ from the base product.</p>
        {form.variants.map((variant, index) => (
          <div className="admin-variant-row" key={`variant-${index}`}>
            <input
              value={variant.size}
              onChange={(event) =>
                setField(
                  'variants',
                  form.variants.map((entry, i) =>
                    i === index ? { ...entry, size: event.target.value } : entry,
                  ),
                )
              }
              placeholder="Size"
            />
            <input
              value={variant.colour}
              onChange={(event) =>
                setField(
                  'variants',
                  form.variants.map((entry, i) =>
                    i === index ? { ...entry, colour: event.target.value } : entry,
                  ),
                )
              }
              placeholder="Colour"
            />
            <input
              type="number"
              min="0"
              value={variant.price}
              onChange={(event) =>
                setField(
                  'variants',
                  form.variants.map((entry, i) =>
                    i === index ? { ...entry, price: event.target.value } : entry,
                  ),
                )
              }
              placeholder="Price ₦"
            />
            <input
              type="number"
              min="0"
              value={variant.stock}
              onChange={(event) =>
                setField(
                  'variants',
                  form.variants.map((entry, i) =>
                    i === index ? { ...entry, stock: event.target.value } : entry,
                  ),
                )
              }
              placeholder="Stock"
            />
            <input
              value={variant.image}
              onChange={(event) =>
                setField(
                  'variants',
                  form.variants.map((entry, i) =>
                    i === index ? { ...entry, image: event.target.value } : entry,
                  ),
                )
              }
              placeholder="Image URL (optional)"
            />
            <button
              type="button"
              className="button button-cream button-rect"
              onClick={() => setField('variants', form.variants.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-button"
          onClick={() => setField('variants', [...form.variants, emptyVariant()])}
        >
          + Add variation
        </button>
      </fieldset>

      <div className="admin-flag-row">
        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.bestSeller}
            onChange={(event) => setField('bestSeller', event.target.checked)}
          />
          Best Seller
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.newArrival}
            onChange={(event) => setField('newArrival', event.target.checked)}
          />
          New Arrival
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => setField('featured', event.target.checked)}
          />
          Featured
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setField('active', event.target.checked)}
          />
          Published
        </label>
      </div>

      <div className="admin-form-actions">
        <button type="submit" className="button button-wine" disabled={busy}>
          {busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create product'}
        </button>
        <button type="button" className="button button-cream" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
