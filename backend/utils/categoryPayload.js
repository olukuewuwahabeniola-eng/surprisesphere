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

function asNumber(value, label, { required = false, min = undefined } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(`${label} is required.`, 400);
    }
    return undefined;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new AppError(`${label} must be a number.`, 400);
  }
  if (min !== undefined && number < min) {
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

export function normalizeCategoryImage(input, categoryName = '') {
  if (input === undefined) {
    return undefined;
  }

  if (input === null || input === '') {
    return { url: '', alt: categoryName || '' };
  }

  if (typeof input === 'string') {
    return {
      url: asTrimmedString(input, { max: 2000 }),
      alt: categoryName || '',
    };
  }

  if (typeof input !== 'object') {
    throw new AppError('Category image must be a URL string or an object with url/alt.', 400);
  }

  return {
    url: asTrimmedString(input.url || input.src || '', { max: 2000 }),
    alt: asTrimmedString(input.alt || categoryName || '', { max: 200 }),
  };
}

export function sanitizeCategoryCreateInput(body = {}) {
  const name = asTrimmedString(body.name, { max: 80, allowEmpty: false });
  if (!name) {
    throw new AppError('Category name is required.', 400);
  }

  const payload = {
    name,
    description: asTrimmedString(body.description || '', { max: 1000 }),
    image: normalizeCategoryImage(body.image ?? body.imageUrl, name) || { url: '', alt: name },
    group: asTrimmedString(body.group || '', { max: 80 }).toLowerCase(),
    featured: asBoolean(body.featured, 'featured') ?? false,
    active: asBoolean(body.active, 'active') ?? true,
    sortOrder: asNumber(body.sortOrder, 'sortOrder') ?? 0,
  };

  if (body.slug) {
    payload.slug = asTrimmedString(body.slug, { max: 100, allowEmpty: false });
  }

  return payload;
}

export function sanitizeCategoryUpdateInput(body = {}) {
  const patch = {};

  if (hasOwn(body, 'name')) {
    const name = asTrimmedString(body.name, { max: 80, allowEmpty: false });
    if (!name) {
      throw new AppError('Category name cannot be empty.', 400);
    }
    patch.name = name;
  }

  if (hasOwn(body, 'description')) {
    patch.description = asTrimmedString(body.description ?? '', { max: 1000 });
  }

  if (hasOwn(body, 'image') || hasOwn(body, 'imageUrl')) {
    const nameHint = hasOwn(body, 'name') ? String(body.name || '') : '';
    patch.image = normalizeCategoryImage(body.image ?? body.imageUrl, nameHint);
  }

  if (hasOwn(body, 'group')) {
    patch.group = asTrimmedString(body.group ?? '', { max: 80 }).toLowerCase();
  }

  if (hasOwn(body, 'featured')) {
    patch.featured = asBoolean(body.featured, 'featured');
  }

  if (hasOwn(body, 'active')) {
    patch.active = asBoolean(body.active, 'active');
  }

  if (hasOwn(body, 'sortOrder')) {
    patch.sortOrder = asNumber(body.sortOrder, 'sortOrder', { required: true });
  }

  if (hasOwn(body, 'slug')) {
    const slug = asTrimmedString(body.slug, { max: 100, allowEmpty: false });
    if (!slug) {
      throw new AppError('Slug cannot be empty.', 400);
    }
    patch.slug = slug;
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError('No category fields were provided to update.', 400);
  }

  return patch;
}

export function sanitizeCategoryReorderInput(body = {}) {
  const ids = body.ids || body.orderedIds || body.order;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('Provide an ordered array of category ids as "ids".', 400);
  }

  const cleaned = ids
    .map((entry) => {
      if (typeof entry === 'string' || typeof entry === 'number') {
        return String(entry).trim();
      }
      if (entry && typeof entry === 'object') {
        return String(entry.id || entry._id || '').trim();
      }
      return '';
    })
    .filter(Boolean);

  if (cleaned.length === 0) {
    throw new AppError('Provide an ordered array of category ids as "ids".', 400);
  }

  return cleaned;
}

export function parseAdminCategoryQuery(query = {}) {
  const sortKey = String(query.sort || 'sortOrder').toLowerCase();
  const sortMap = {
    sortorder: { sortOrder: 1, name: 1 },
    name: { name: 1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
  };

  const normalizedSort = sortKey === 'sort-order' ? 'sortorder' : sortKey;
  if (!sortMap[normalizedSort]) {
    throw new AppError('Sort must be sortOrder, name, newest or oldest.', 400);
  }

  const filters = {};
  const status = String(query.status || query.active || 'all').toLowerCase();
  if (status === 'active' || status === 'true' || status === 'published') {
    filters.active = true;
  } else if (
    status === 'inactive' ||
    status === 'false' ||
    status === 'draft' ||
    status === 'hidden'
  ) {
    filters.active = false;
  } else if (status !== 'all' && status !== '') {
    throw new AppError('status must be all, active, inactive, published or hidden.', 400);
  }

  if (query.featured === 'true' || query.featured === true) {
    filters.featured = true;
  }
  if (query.featured === 'false' || query.featured === false) {
    filters.featured = false;
  }

  if (query.group) {
    filters.group = String(query.group).trim().toLowerCase();
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
      { slug: { $regex: term, $options: 'i' } },
      { group: { $regex: term, $options: 'i' } },
    ];
  }

  return {
    filters,
    sort: sortMap[normalizedSort],
    sortKey: normalizedSort === 'sortorder' ? 'sortOrder' : normalizedSort,
  };
}
