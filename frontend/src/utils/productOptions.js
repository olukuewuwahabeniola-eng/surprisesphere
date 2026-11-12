function asLabel(entry) {
  if (entry == null) {
    return '';
  }
  if (typeof entry === 'string' || typeof entry === 'number') {
    return String(entry).trim();
  }
  return String(entry.label || entry.name || entry.value || '').trim();
}

function asPrice(entry) {
  if (entry == null || typeof entry === 'string' || typeof entry === 'number') {
    return null;
  }
  const value = Number(entry.price);
  return Number.isFinite(value) ? value : null;
}

function uniqueLabels(entries) {
  const seen = new Set();
  const labels = [];
  entries.forEach((entry) => {
    const label = asLabel(entry);
    if (!label) {
      return;
    }
    const key = label.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    labels.push(label);
  });
  return labels;
}

export function normalizeOptionEntries(entries = []) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      const label = asLabel(entry);
      if (!label) {
        return null;
      }
      return {
        label,
        price: asPrice(entry),
        image: typeof entry === 'object' && entry ? entry.image || '' : '',
        stock: typeof entry === 'object' && entry && entry.stock != null ? Number(entry.stock) : null,
      };
    })
    .filter(Boolean);
}

export function getProductVariants(product) {
  return (Array.isArray(product?.variants) ? product.variants : [])
    .map((variant) => ({
      size: asLabel(variant.size),
      colour: asLabel(variant.colour || variant.color),
      price: Number.isFinite(Number(variant.price)) ? Number(variant.price) : null,
      stock: variant.stock == null ? null : Number(variant.stock),
      image: variant.image || '',
    }))
    .filter((variant) => variant.size || variant.colour || variant.price != null);
}

function variantInStock(variant) {
  return variant.stock == null || variant.stock > 0;
}

export function getAvailableSizes(product) {
  const variants = getProductVariants(product).filter(variantInStock);
  if (variants.length) {
    return uniqueLabels(variants.map((variant) => variant.size).filter(Boolean));
  }
  return uniqueLabels(normalizeOptionEntries(product?.sizes).map((entry) => entry.label));
}

export function getAvailableColours(product, selectedSize = '') {
  const variants = getProductVariants(product).filter(variantInStock);
  if (variants.length) {
    const scoped = selectedSize
      ? variants.filter((variant) => !variant.size || variant.size === selectedSize)
      : variants;
    const colours = uniqueLabels(scoped.map((variant) => variant.colour).filter(Boolean));
    if (colours.length) {
      return colours;
    }
  }
  return uniqueLabels(normalizeOptionEntries(product?.colours).map((entry) => entry.label));
}

export function resolveProductSelection(product, { size = '', colour = '' } = {}) {
  const basePrice = Number(product?.price) || 0;
  const variants = getProductVariants(product).filter(variantInStock);
  const sizeOptions = normalizeOptionEntries(product?.sizes);
  const colourOptions = normalizeOptionEntries(product?.colours);

  if (variants.length) {
    const exact = variants.find(
      (variant) =>
        (!size || variant.size === size || !variant.size) &&
        (!colour || variant.colour === colour || !variant.colour) &&
        (!size || !variant.size || variant.size === size) &&
        (!colour || !variant.colour || variant.colour === colour),
    );

    const matched =
      variants.find((variant) => variant.size === size && variant.colour === colour) ||
      variants.find((variant) => size && variant.size === size && (!colour || !variant.colour)) ||
      variants.find((variant) => colour && variant.colour === colour && (!size || !variant.size)) ||
      exact;

    if (matched) {
      return {
        size: matched.size || size || '',
        colour: matched.colour || colour || '',
        price: matched.price != null ? matched.price : basePrice,
        image: matched.image || product.image || '',
      };
    }
  }

  const sizeOption = sizeOptions.find((entry) => entry.label === size);
  const colourOption = colourOptions.find((entry) => entry.label === colour);
  const priced =
    sizeOption?.price != null
      ? sizeOption.price
      : colourOption?.price != null
        ? colourOption.price
        : basePrice;

  return {
    size: size || '',
    colour: colour || '',
    price: priced,
    image: colourOption?.image || sizeOption?.image || product.image || '',
  };
}
