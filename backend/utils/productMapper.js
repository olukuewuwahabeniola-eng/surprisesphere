function optionLabel(entry) {
  if (entry == null) {
    return '';
  }
  if (typeof entry === 'string' || typeof entry === 'number') {
    return String(entry).trim();
  }
  return String(entry.label || entry.name || entry.value || '').trim();
}

function optionPrice(entry) {
  if (entry == null || typeof entry === 'string' || typeof entry === 'number') {
    return null;
  }
  const value = Number(entry.price);
  return Number.isFinite(value) ? value : null;
}

function mapOptionEntries(entries = []) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      const label = optionLabel(entry);
      if (!label) {
        return null;
      }
      const mapped = { label };
      const price = optionPrice(entry);
      if (price != null) {
        mapped.price = price;
      }
      if (entry && typeof entry === 'object') {
        if (entry.image) {
          mapped.image = entry.image;
        }
        if (entry.stock != null && Number.isFinite(Number(entry.stock))) {
          mapped.stock = Number(entry.stock);
        }
      }
      return mapped;
    })
    .filter(Boolean);
}

function mapVariants(entries = []) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      const size = optionLabel(entry?.size);
      const colour = optionLabel(entry?.colour || entry?.color);
      const price = Number(entry?.price);
      return {
        size,
        colour,
        price: Number.isFinite(price) ? price : null,
        stock: entry?.stock == null ? null : Number(entry.stock),
        image: entry?.image || '',
      };
    })
    .filter((entry) => entry.size || entry.colour || entry.price != null);
}

function uniqueLabels(labels) {
  const seen = new Set();
  const next = [];
  labels.forEach((label) => {
    const value = String(label || '').trim();
    if (!value) {
      return;
    }
    const key = value.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    next.push(value);
  });
  return next;
}

export function mapProduct(doc) {
  if (!doc) {
    return null;
  }

  const product = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const images = Array.isArray(product.images) ? product.images : [];
  const primary = images[0] || { url: '', alt: product.name || '' };
  const variants = mapVariants(product.variants);
  const sizeOptions = mapOptionEntries(product.sizes);
  const colourOptions = mapOptionEntries(product.colours);

  const sizes = uniqueLabels([
    ...sizeOptions.map((entry) => entry.label),
    ...variants.map((entry) => entry.size),
  ]);
  const colours = uniqueLabels([
    ...colourOptions.map((entry) => entry.label),
    ...variants.map((entry) => entry.colour),
  ]);

  return {
    id: String(product._id || product.id),
    slug: product.slug,
    name: product.name,
    description: product.description || product.detail || '',
    detail: product.description || product.detail || '',
    price: product.price,
    category: product.categorySlug || product.category || '',
    categoryId:
      product.category && typeof product.category === 'object'
        ? String(product.category._id || product.category.id || '')
        : product.category
          ? String(product.category)
          : '',
    categoryLabel: product.categoryLabel || '',
    image: primary.url || product.image || '',
    alt: primary.alt || product.alt || product.name || '',
    images: images.map((image) => ({
      url: image.url,
      alt: image.alt || product.name || '',
    })),
    sizes,
    colours,
    sizeOptions,
    colourOptions,
    variants,
    stock: product.stock ?? 0,
    bestSeller: Boolean(product.bestSeller),
    newArrival: Boolean(product.newArrival),
    featured: Boolean(product.featured),
    active: product.active !== false,
    listedAt: product.listedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function mapCategory(doc) {
  if (!doc) {
    return null;
  }

  const category = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  const mapped = {
    id: String(category._id || category.id),
    slug: category.slug,
    name: category.name,
    description: category.description || '',
    group: category.group || '',
    featured: Boolean(category.featured),
    active: category.active !== false,
    image: category.image?.url || category.image || '',
    alt: category.image?.alt || category.alt || category.name || '',
    sortOrder: category.sortOrder || 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };

  if (category.productCount != null) {
    mapped.productCount = Number(category.productCount) || 0;
  }

  return mapped;
}
