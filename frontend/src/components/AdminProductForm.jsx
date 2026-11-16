import { useState } from 'react';
import AdminColourVariantsEditor from './AdminColourVariantsEditor';
import AdminProductPlacement from './AdminProductPlacement';
import {
  draftToProductPayload,
  productToColourDrafts,
  validateProductDraft,
} from '../utils/adminProductDraft';

export function blankProductForm() {
  return {
    name: '',
    description: '',
    price: '',
    category: '',
    sizes: [],
    colourVariants: [],
    variants: [],
    stock: '0',
    bestSeller: false,
    newArrival: false,
    featured: false,
    active: true,
  };
}

export function productToForm(product) {
  const sizes =
    Array.isArray(product?.sizes) && product.sizes.length
      ? product.sizes.map((entry) => (typeof entry === 'string' ? entry : entry.label || '')).filter(Boolean)
      : [];

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
    sizes,
    colourVariants: productToColourDrafts(product),
    variants,
    stock: product?.stock != null ? String(product.stock) : '0',
    bestSeller: Boolean(product?.bestSeller),
    newArrival: Boolean(product?.newArrival),
    featured: Boolean(product?.featured),
    active: product?.active !== false,
  };
}

export function formToPayload(form) {
  const payload = draftToProductPayload({
    name: form.name,
    description: form.description,
    price: form.price,
    category: form.category,
    sizes: form.sizes,
    colours: form.colourVariants,
    stock: form.stock,
    bestSeller: form.bestSeller,
    newArrival: form.newArrival,
    featured: form.featured,
    active: form.active,
  });

  const matrix = (form.variants || [])
    .map((entry) => ({
      size: String(entry.size || '').trim(),
      colour: String(entry.colour || '').trim(),
      price: entry.price === '' || entry.price == null ? undefined : Number(entry.price),
      stock: entry.stock === '' || entry.stock == null ? undefined : Number(entry.stock),
      image: String(entry.image || '').trim(),
    }))
    .filter((entry) => entry.size || entry.colour || entry.price != null);

  if (matrix.length) {
    payload.variants = [...(payload.variants || []), ...matrix];
  }

  return payload;
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
  const [error, setError] = useState('');

  function setField(key, value) {
    onChange({ ...form, [key]: value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      const issues = validateProductDraft({
        name: form.name,
        price: form.price,
        category: form.category,
        colours: form.colourVariants,
      });
      if (issues.length) {
        setError(issues.join(' '));
        return;
      }
      onSubmit(formToPayload(form));
    } catch (err) {
      setError(err?.message || 'Could not prepare the product for saving.');
    }
  }

  return (
    <form className="admin-product-form" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>
            Product name <abbr title="required">*</abbr>
          </span>
          <input
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
            required
            maxLength={160}
          />
        </label>

        <label className="admin-field">
          <span>
            Price (₦) <abbr title="required">*</abbr>
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(event) => setField('price', event.target.value)}
            required
          />
        </label>

        <label className="admin-field">
          <span>
            Category <abbr title="required">*</abbr>
          </span>
          <select
            value={form.category}
            onChange={(event) => setField('category', event.target.value)}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id || category.slug} value={category.slug || category.id}>
                {category.name}
                {category.active === false ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span>Overall stock fallback</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(event) => setField('stock', event.target.value)}
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Description</span>
        <textarea
          rows={4}
          value={form.description}
          onChange={(event) => setField('description', event.target.value)}
          maxLength={4000}
        />
      </label>

      <AdminProductPlacement
        bestSeller={form.bestSeller}
        newArrival={form.newArrival}
        disabled={busy}
        onChange={(patch) => onChange({ ...form, ...patch })}
      />

      <AdminColourVariantsEditor
        colours={form.colourVariants || []}
        sharedSizes={form.sizes || []}
        adminKey={adminKey}
        productName={form.name}
        disabled={busy}
        onChange={(colourVariants) => setField('colourVariants', colourVariants)}
        onSharedSizesChange={(sizes) => setField('sizes', sizes)}
      />

      <div className="admin-flag-row">
        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => setField('featured', event.target.checked)}
          />
          Featured elsewhere
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

      {error ? (
        <p className="form-note admin-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="admin-form-actions">
        <button type="submit" className="button button-wine button-rect" disabled={busy}>
          {busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create product'}
        </button>
        <button type="button" className="button button-wine button-rect" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
