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

function asImageList(entry) {
  if (!entry || typeof entry !== 'object') {
    return [];
  }
  const fromArray = Array.isArray(entry.images)
    ? entry.images
        .map((image) => {
          if (typeof image === 'string') {
            return image.trim();
          }
          return String(image?.url || image?.src || '').trim();
        })
        .filter(Boolean)
    : [];
  if (fromArray.length) {
    return fromArray;
  }
  const single = String(entry.image || '').trim();
  return single ? [single] : [];
}

function sameLabel(a, b) {
  return String(a || '')
    .trim()
    .toLowerCase() ===
    String(b || '')
      .trim()
      .toLowerCase();
}

const COLOUR_HEX = {
  black: '#111111',
  white: '#f5f5f5',
  cream: '#f5e6c8',
  beige: '#d8c3a5',
  brown: '#6b3f2a',
  tan: '#c4a484',
  wine: '#722f37',
  burgundy: '#6d1f2c',
  red: '#b42318',
  pink: '#e8a0bf',
  nude: '#e0c3a8',
  grey: '#8a8a8a',
  gray: '#8a8a8a',
  blue: '#2f5d8a',
  navy: '#1b2a4a',
  green: '#3f6b4f',
  gold: '#f1d58a',
  silver: '#c0c0c0',
  orange: '#d97706',
  purple: '#6b3fa0',
  yellow: '#e4c15c',
};

export function colourSwatchHex(label, explicitHex = '') {
  const provided = String(explicitHex || '').trim();
  if (provided) {
    return provided;
  }
  const key = String(label || '')
    .trim()
    .toLowerCase();
  if (COLOUR_HEX[key]) {
    return COLOUR_HEX[key];
  }
  const match = Object.keys(COLOUR_HEX).find((name) => key.includes(name));
  return match ? COLOUR_HEX[match] : '#cfcfcf';
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
      const images = asImageList(entry);
      const available =
        typeof entry === 'object' && entry
          ? entry.available !== false && entry.inStock !== false && entry.unavailable !== true
          : true;
      const stock =
        typeof entry === 'object' && entry && entry.stock != null && entry.stock !== ''
          ? Number(entry.stock)
          : null;
      return {
        label,
        price: asPrice(entry),
        image: images[0] || (typeof entry === 'object' && entry ? entry.image || '' : ''),
        images,
        hex: typeof entry === 'object' && entry ? entry.hex || entry.swatch || '' : '',
        sizes:
          typeof entry === 'object' && entry && Array.isArray(entry.sizes)
            ? entry.sizes.map((size) => String(size || '').trim()).filter(Boolean)
            : [],
        stock: Number.isFinite(stock) ? stock : null,
        available: available && (stock == null || !Number.isFinite(stock) || stock > 0),
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
      stock: variant.stock == null || variant.stock === '' ? null : Number(variant.stock),
      image: variant.image || '',
      available: variant.available !== false,
    }))
    .filter((variant) => variant.size || variant.colour || variant.price != null);
}

function variantInStock(variant) {
  if (variant.available === false) {
    return false;
  }
  return variant.stock == null || !Number.isFinite(variant.stock) || variant.stock > 0;
}

export function getColourOptions(product) {
  const fromOptions = normalizeOptionEntries(product?.colourOptions || product?.colours);
  if (fromOptions.length) {
    return fromOptions;
  }
  return getAvailableColours(product, '', { includeUnavailable: true }).map((label) => ({
    label,
    price: null,
    image: '',
    images: [],
    hex: '',
    stock: null,
    available: true,
    sizes: [],
  }));
}

export function getAvailableSizes(product, selectedColour = '') {
  const variants = getProductVariants(product).filter(variantInStock);
  if (variants.length) {
    const scoped = selectedColour
      ? variants.filter((variant) => !variant.colour || sameLabel(variant.colour, selectedColour))
      : variants;
    const fromVariants = uniqueLabels(scoped.map((variant) => variant.size).filter(Boolean));
    if (fromVariants.length) {
      return fromVariants;
    }
  }

  if (selectedColour) {
    const colourOption = getColourOptions(product).find((entry) =>
      sameLabel(entry.label, selectedColour),
    );
    if (colourOption && colourOption.available === false) {
      return [];
    }
    if (Array.isArray(colourOption?.sizes) && colourOption.sizes.length) {
      return uniqueLabels(colourOption.sizes);
    }
  }

  return uniqueLabels(
    normalizeOptionEntries(product?.sizes || product?.sizeOptions).map((entry) => entry.label),
  );
}

export function getAvailableColours(product, selectedSize = '', { includeUnavailable = false } = {}) {
  const colourOptions = normalizeOptionEntries(product?.colourOptions || product?.colours);
  const variants = getProductVariants(product).filter(variantInStock);

  if (variants.length) {
    const scoped = selectedSize
      ? variants.filter((variant) => !variant.size || sameLabel(variant.size, selectedSize))
      : variants;
    const colours = uniqueLabels(scoped.map((variant) => variant.colour).filter(Boolean));
    if (colours.length) {
      if (includeUnavailable || !colourOptions.length) {
        return colours;
      }
      return colours.filter((label) => {
        const option = colourOptions.find((entry) => sameLabel(entry.label, label));
        return !option || option.available !== false;
      });
    }
  }

  const labels = uniqueLabels(colourOptions.map((entry) => entry.label));
  if (includeUnavailable) {
    return labels;
  }
  return labels.filter((label) => {
    const option = colourOptions.find((entry) => sameLabel(entry.label, label));
    return !option || option.available !== false;
  });
}

export function getImagesForColour(product, colour = '') {
  if (!product) {
    return [];
  }
  const colourOptions = getColourOptions(product);
  const match = colourOptions.find((entry) => sameLabel(entry.label, colour));
  if (match?.images?.length) {
    return match.images;
  }
  if (match?.image) {
    return [match.image];
  }

  const variants = getProductVariants(product).filter(
    (variant) => variant.colour && sameLabel(variant.colour, colour) && variant.image,
  );
  if (variants.length) {
    return [...new Set(variants.map((variant) => variant.image).filter(Boolean))];
  }

  // Only fall back to the full product gallery when no colour was chosen.
  if (!String(colour || '').trim()) {
    const gallery = Array.isArray(product.images)
      ? product.images.map((entry) => (typeof entry === 'string' ? entry : entry?.url)).filter(Boolean)
      : [];
    if (gallery.length) {
      return gallery;
    }
    return product.image ? [product.image] : [];
  }

  return product.image ? [product.image] : [];
}

export function getSelectionStock(product, { size = '', colour = '' } = {}) {
  if (!product) {
    return null;
  }

  const variants = getProductVariants(product);
  if (variants.length) {
    const matched =
      variants.find(
        (variant) =>
          (!size || sameLabel(variant.size, size)) &&
          (!colour || sameLabel(variant.colour, colour)),
      ) ||
      variants.find((variant) => size && sameLabel(variant.size, size) && (!colour || !variant.colour)) ||
      variants.find((variant) => colour && sameLabel(variant.colour, colour) && (!size || !variant.size));

    if (matched) {
      if (matched.available === false) {
        return 0;
      }
      if (matched.stock != null && Number.isFinite(matched.stock)) {
        return matched.stock;
      }
    }
  }

  if (colour) {
    const colourOption = getColourOptions(product).find((entry) => sameLabel(entry.label, colour));
    if (colourOption) {
      if (colourOption.available === false) {
        return 0;
      }
      if (colourOption.stock != null && Number.isFinite(colourOption.stock)) {
        return colourOption.stock;
      }
    }
  }

  const productStock = Number(product.stock);
  return Number.isFinite(productStock) ? productStock : null;
}

export function isSelectionPurchasable(product, selection = {}) {
  const stock = getSelectionStock(product, selection);
  if (stock == null) {
    return true;
  }
  return stock > 0;
}

export function resolveProductSelection(product, { size = '', colour = '' } = {}) {
  if (!product) {
    return { size: size || '', colour: colour || '', price: 0, image: '', images: [], stock: null, available: false };
  }
  const basePrice = Number(product?.price) || 0;
  const variants = getProductVariants(product);
  const sizeOptions = normalizeOptionEntries(product?.sizes || product?.sizeOptions);
  const colourOptions = getColourOptions(product);
  const colourImages = getImagesForColour(product, colour);
  const stock = getSelectionStock(product, { size, colour });
  const available = stock == null ? true : stock > 0;

  const inStockVariants = variants.filter(variantInStock);
  if (inStockVariants.length) {
    const matched =
      inStockVariants.find(
        (variant) => sameLabel(variant.size, size) && sameLabel(variant.colour, colour),
      ) ||
      inStockVariants.find(
        (variant) => size && sameLabel(variant.size, size) && (!colour || !variant.colour),
      ) ||
      inStockVariants.find(
        (variant) => colour && sameLabel(variant.colour, colour) && (!size || !variant.size),
      );

    if (matched) {
      const images = colourImages.length
        ? colourImages
        : matched.image
          ? [matched.image]
          : product.image
            ? [product.image]
            : [];
      return {
        size: matched.size || size || '',
        colour: matched.colour || colour || '',
        price: matched.price != null ? matched.price : basePrice,
        image: matched.image || images[0] || product.image || '',
        images,
        stock: matched.stock != null ? matched.stock : stock,
        available: variantInStock(matched),
      };
    }
  }

  const sizeOption = sizeOptions.find((entry) => sameLabel(entry.label, size));
  const colourOption = colourOptions.find((entry) => sameLabel(entry.label, colour));
  const priced =
    sizeOption?.price != null
      ? sizeOption.price
      : colourOption?.price != null
        ? colourOption.price
        : basePrice;

  const images = colourImages.length
    ? colourImages
    : product.images?.map((entry) => (typeof entry === 'string' ? entry : entry?.url)).filter(Boolean) ||
      (product.image ? [product.image] : []);

  return {
    size: size || '',
    colour: colour || '',
    price: priced,
    image: colourOption?.image || images[0] || sizeOption?.image || product.image || '',
    images,
    stock,
    available: available && colourOption?.available !== false,
  };
}
