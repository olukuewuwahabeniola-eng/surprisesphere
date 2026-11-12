import { AppError } from './AppError.js';

function asTrimmedString(value, { max = 500, allowEmpty = true } = {}) {
  if (value == null) {
    return '';
  }
  const text = String(value).trim();
  if (!allowEmpty && !text) {
    return '';
  }
  if (text.length > max) {
    throw new AppError(`Text is too long (max ${max} characters).`, 400);
  }
  return text;
}

function asNumber(value, label, { required = false, min = 0, allowNull = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(`${label} is required.`, 400);
    }
    return allowNull ? null : undefined;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new AppError(`${label} must be a number.`, 400);
  }
  if (number < min) {
    throw new AppError(`${label} cannot be less than ${min}.`, 400);
  }
  return number;
}

function asBoolean(value, label) {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  throw new AppError(`${label} must be true or false.`, 400);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

export function normalizeImages(input, productName = '') {
  if (input === undefined) {
    return undefined;
  }

  if (!Array.isArray(input) || input.length === 0) {
    throw new AppError('At least one product image URL is required.', 400);
  }

  const images = input
    .map((entry) => {
      if (typeof entry === 'string') {
        const url = asTrimmedString(entry, { max: 2000, allowEmpty: false });
        if (!url) {
          return null;
        }
        return { url, alt: productName || '' };
      }

      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const url = asTrimmedString(entry.url || entry.src || '', { max: 2000, allowEmpty: false });
      if (!url) {
        return null;
      }

      return {
        url,
        alt: asTrimmedString(entry.alt || productName || '', { max: 200 }),
      };
    })
    .filter(Boolean);

  if (images.length === 0) {
    throw new AppError('At least one product image URL is required.', 400);
  }

  return images;
}

export function normalizeOptionList(input, label) {
  if (input === undefined) {
    return undefined;
  }

  if (!Array.isArray(input)) {
    throw new AppError(`${label} must be an array.`, 400);
  }

  return input
    .map((entry) => {
      if (entry == null) {
        return null;
      }

      if (typeof entry === 'string' || typeof entry === 'number') {
        const value = String(entry).trim();
        return value || null;
      }

      if (typeof entry !== 'object') {
        return null;
      }

      const optionLabel = asTrimmedString(entry.label || entry.name || entry.value || '', {
        max: 80,
        allowEmpty: false,
      });
      if (!optionLabel) {
        return null;
      }

      const mapped = { label: optionLabel };
      if (hasOwn(entry, 'price') && entry.price !== '' && entry.price != null) {
        mapped.price = asNumber(entry.price, `${label} price`, { min: 0 });
      }
      if (hasOwn(entry, 'stock') && entry.stock !== '' && entry.stock != null) {
        mapped.stock = asNumber(entry.stock, `${label} stock`, { min: 0 });
      }
      if (entry.image) {
        mapped.image = asTrimmedString(entry.image, { max: 2000 });
      }
      return mapped;
    })
    .filter(Boolean);
}

export function normalizeVariants(input) {
  if (input === undefined) {
    return undefined;
  }

  if (!Array.isArray(input)) {
    throw new AppError('variants must be an array.', 400);
  }

  return input
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const size = asTrimmedString(entry.size || '', { max: 40 });
      const colour = asTrimmedString(entry.colour || entry.color || '', { max: 40 });
      const mapped = { size, colour };

      if (hasOwn(entry, 'price') && entry.price !== '' && entry.price != null) {
        mapped.price = asNumber(entry.price, 'Variant price', { min: 0 });
      }
      if (hasOwn(entry, 'stock') && entry.stock !== '' && entry.stock != null) {
        mapped.stock = asNumber(entry.stock, 'Variant stock', { min: 0 });
      }
      if (entry.image) {
        mapped.image = asTrimmedString(entry.image, { max: 2000 });
      }

      if (!mapped.size && !mapped.colour && mapped.price == null) {
        return null;
      }

      return mapped;
    })
    .filter(Boolean);
}

/**
 * Build a sanitized create payload. Does not include category ObjectId —
 * the service attaches category fields after resolving the category.
 */
export function sanitizeProductCreateInput(body = {}) {
  const name = asTrimmedString(body.name, { max: 160, allowEmpty: false });
  if (!name) {
    throw new AppError('Product name is required.', 400);
  }

  const price = asNumber(body.price, 'Price', { required: true, min: 0 });
  const images = normalizeImages(body.images ?? (body.image ? [body.image] : undefined), name);
  if (!images) {
    throw new AppError('At least one product image URL is required.', 400);
  }

  const categoryRef = body.categoryId || body.category || body.categorySlug || '';
  if (!String(categoryRef || '').trim()) {
    throw new AppError('Category is required.', 400);
  }

  const payload = {
    name,
    description: asTrimmedString(body.description || body.detail || '', { max: 4000 }),
    price,
    images,
    sizes: normalizeOptionList(body.sizes ?? [], 'sizes') || [],
    colours: normalizeOptionList(body.colours ?? body.colors ?? [], 'colours') || [],
    variants: normalizeVariants(body.variants ?? []) || [],
    stock: asNumber(body.stock, 'Stock', { min: 0 }) ?? 0,
    bestSeller: asBoolean(body.bestSeller, 'bestSeller') ?? false,
    newArrival: asBoolean(body.newArrival, 'newArrival') ?? false,
    featured: asBoolean(body.featured, 'featured') ?? false,
    active: asBoolean(body.active, 'active') ?? true,
    categoryRef: String(categoryRef).trim(),
  };

  if (body.slug) {
    payload.slug = asTrimmedString(body.slug, { max: 180, allowEmpty: false });
  }

  if (body.listedAt) {
    const listedAt = new Date(body.listedAt);
    if (Number.isNaN(listedAt.getTime())) {
      throw new AppError('listedAt must be a valid date.', 400);
    }
    payload.listedAt = listedAt;
  }

  return payload;
}

/**
 * Build a partial update object. Only fields present on the body are included,
 * so omitted fields are left unchanged in MongoDB.
 */
export function sanitizeProductUpdateInput(body = {}) {
  const patch = {};

  if (hasOwn(body, 'name')) {
    const name = asTrimmedString(body.name, { max: 160, allowEmpty: false });
    if (!name) {
      throw new AppError('Product name cannot be empty.', 400);
    }
    patch.name = name;
  }

  if (hasOwn(body, 'description') || hasOwn(body, 'detail')) {
    patch.description = asTrimmedString(body.description ?? body.detail ?? '', { max: 4000 });
  }

  if (hasOwn(body, 'price')) {
    patch.price = asNumber(body.price, 'Price', { required: true, min: 0 });
  }

  if (hasOwn(body, 'images') || hasOwn(body, 'image')) {
    const nameHint = hasOwn(body, 'name') ? String(body.name || '') : '';
    patch.images = normalizeImages(body.images ?? (body.image ? [body.image] : undefined), nameHint);
  }

  if (hasOwn(body, 'sizes')) {
    patch.sizes = normalizeOptionList(body.sizes, 'sizes') || [];
  }

  if (hasOwn(body, 'colours') || hasOwn(body, 'colors')) {
    patch.colours = normalizeOptionList(body.colours ?? body.colors, 'colours') || [];
  }

  if (hasOwn(body, 'variants')) {
    patch.variants = normalizeVariants(body.variants) || [];
  }

  if (hasOwn(body, 'stock')) {
    patch.stock = asNumber(body.stock, 'Stock', { required: true, min: 0 });
  }

  if (hasOwn(body, 'bestSeller')) {
    patch.bestSeller = asBoolean(body.bestSeller, 'bestSeller');
  }

  if (hasOwn(body, 'newArrival')) {
    patch.newArrival = asBoolean(body.newArrival, 'newArrival');
  }

  if (hasOwn(body, 'featured')) {
    patch.featured = asBoolean(body.featured, 'featured');
  }

  if (hasOwn(body, 'active')) {
    patch.active = asBoolean(body.active, 'active');
  }

  if (hasOwn(body, 'slug')) {
    const slug = asTrimmedString(body.slug, { max: 180, allowEmpty: false });
    if (!slug) {
      throw new AppError('Slug cannot be empty.', 400);
    }
    patch.slug = slug;
  }

  if (hasOwn(body, 'listedAt')) {
    if (body.listedAt === null || body.listedAt === '') {
      patch.listedAt = new Date();
    } else {
      const listedAt = new Date(body.listedAt);
      if (Number.isNaN(listedAt.getTime())) {
        throw new AppError('listedAt must be a valid date.', 400);
      }
      patch.listedAt = listedAt;
    }
  }

  if (hasOwn(body, 'category') || hasOwn(body, 'categoryId') || hasOwn(body, 'categorySlug')) {
    const categoryRef = body.categoryId || body.category || body.categorySlug || '';
    if (!String(categoryRef || '').trim()) {
      throw new AppError('Category cannot be empty.', 400);
    }
    patch.categoryRef = String(categoryRef).trim();
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError('No product fields were provided to update.', 400);
  }

  return patch;
}

export function parseAdminProductQuery(query = {}) {
  const sortKey = String(query.sort || 'newest').toLowerCase();
  const sortMap = {
    newest: { listedAt: -1, createdAt: -1 },
    oldest: { listedAt: 1, createdAt: 1 },
    'price-asc': { price: 1, listedAt: -1 },
    'price-desc': { price: -1, listedAt: -1 },
    name: { name: 1 },
  };

  if (!sortMap[sortKey]) {
    throw new AppError('Sort must be newest, oldest, price-asc, price-desc or name.', 400);
  }

  const filters = {};

  const status = String(query.status || query.active || 'all').toLowerCase();
  if (status === 'active' || status === 'true' || status === 'published') {
    filters.active = true;
  } else if (status === 'inactive' || status === 'false' || status === 'draft') {
    filters.active = false;
  } else if (status !== 'all' && status !== '') {
    throw new AppError('status must be all, active or inactive.', 400);
  }

  if (query.category) {
    filters.categorySlug = String(query.category).trim().toLowerCase();
  }

  if (query.bestSeller === 'true' || query.bestSeller === true) {
    filters.bestSeller = true;
  }
  if (query.bestSeller === 'false' || query.bestSeller === false) {
    filters.bestSeller = false;
  }

  if (query.newArrival === 'true' || query.newArrival === true) {
    filters.newArrival = true;
  }
  if (query.newArrival === 'false' || query.newArrival === false) {
    filters.newArrival = false;
  }

  if (query.featured === 'true' || query.featured === true) {
    filters.featured = true;
  }
  if (query.featured === 'false' || query.featured === false) {
    filters.featured = false;
  }

  if (query.q || query.search) {
    const term = String(query.q || query.search).trim();
    if (term.length < 2) {
      throw new AppError('Search text must be at least 2 characters.', 400);
    }
    if (term.length > 80) {
      throw new AppError('Search text is too long.', 400);
    }
    filters.$or = [
      { name: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { categoryLabel: { $regex: term, $options: 'i' } },
      { slug: { $regex: term, $options: 'i' } },
    ];
  }

  return {
    filters,
    sort: sortMap[sortKey],
    sortKey,
  };
}
