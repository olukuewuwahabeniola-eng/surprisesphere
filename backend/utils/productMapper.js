export function mapProduct(doc) {
  if (!doc) {
    return null;
  }

  const product = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const images = Array.isArray(product.images) ? product.images : [];
  const primary = images[0] || { url: '', alt: product.name || '' };

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
    sizes: product.sizes || [],
    colours: product.colours || [],
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

  return {
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
}
