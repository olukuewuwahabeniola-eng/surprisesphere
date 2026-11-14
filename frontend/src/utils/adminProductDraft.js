let draftSeq = 0;

export function nextDraftId(prefix = 'draft') {
  draftSeq += 1;
  return `${prefix}-${Date.now()}-${draftSeq}`;
}

export function blankColourVariant(overrides = {}) {
  return {
    id: nextDraftId('colour'),
    label: '',
    hex: '',
    stock: '',
    price: '',
    available: true,
    images: [],
    mainIndex: 0,
    sizes: [],
    ...overrides,
  };
}

export function blankProductDraft(overrides = {}) {
  return {
    clientId: nextDraftId('product'),
    name: '',
    description: '',
    price: '',
    category: '',
    categoryLabel: '',
    sizes: [],
    colours: [],
    stock: '0',
    bestSeller: false,
    newArrival: false,
    featured: false,
    active: true,
    expanded: true,
    uploadStatus: 'idle',
    uploadError: '',
    createdProductId: '',
    ...overrides,
  };
}

export function productToColourDrafts(product) {
  const options = Array.isArray(product?.colourOptions)
    ? product.colourOptions
    : Array.isArray(product?.colours)
      ? product.colours
      : [];

  const productSizes = Array.isArray(product?.sizes)
    ? product.sizes.map((entry) => (typeof entry === 'string' ? entry : entry?.label || '')).filter(Boolean)
    : [];

  const drafts = options
    .map((entry) => {
      if (typeof entry === 'string') {
        const label = entry.trim();
        if (!label) return null;
        return blankColourVariant({ label, images: [], sizes: [...productSizes], mainIndex: 0 });
      }
      const label = String(entry?.label || entry?.name || '').trim();
      if (!label) return null;
      const images = Array.isArray(entry.images)
        ? entry.images.map((image) => (typeof image === 'string' ? image : image?.url)).filter(Boolean)
        : entry.image
          ? [entry.image]
          : [];
      const sizes = Array.isArray(entry.sizes)
        ? entry.sizes.map((size) => String(size).trim()).filter(Boolean)
        : [...productSizes];
      return blankColourVariant({
        label,
        hex: entry.hex || entry.swatch || '',
        stock: entry.stock != null ? String(entry.stock) : '',
        price: entry.price != null ? String(entry.price) : '',
        available: entry.available !== false && entry.inStock !== false && entry.unavailable !== true,
        images,
        sizes,
        mainIndex: 0,
      });
    })
    .filter(Boolean);

  const gallery = Array.isArray(product?.images)
    ? product.images.map((image) => image?.url || image).filter(Boolean)
    : product?.image
      ? [product.image]
      : [];

  // Infer per-colour sizes from variants when colour options lack sizes.
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  drafts.forEach((draft) => {
    if (draft.sizes?.length) return;
    const fromVariants = variants
      .filter(
        (variant) =>
          String(variant.colour || variant.color || '').trim().toLowerCase() ===
          draft.label.toLowerCase(),
      )
      .map((variant) => String(variant.size || '').trim())
      .filter(Boolean);
    if (fromVariants.length) {
      draft.sizes = [...new Set(fromVariants)];
    }

    if (draft.stock === '' || draft.stock == null) {
      const stocks = variants
        .filter(
          (variant) =>
            String(variant.colour || variant.color || '').trim().toLowerCase() ===
            draft.label.toLowerCase(),
        )
        .map((variant) => Number(variant.stock))
        .filter((value) => Number.isFinite(value));
      if (stocks.length) {
        draft.stock = String(Math.max(...stocks));
      }
    }
  });

  if (drafts.length) {
    const missingImages = drafts.every((draft) => !draft.images.length);
    if (missingImages && gallery.length) {
      drafts[0] = { ...drafts[0], images: gallery, mainIndex: 0 };
    }
    return drafts;
  }

  return [];
}

export function validateProductDraft(draft) {
  const errors = [];
  if (!String(draft.name || '').trim()) {
    errors.push('Product name is required.');
  }
  if (!Number.isFinite(Number(draft.price)) || Number(draft.price) < 0) {
    errors.push('Enter a valid price.');
  }
  if (!String(draft.category || '').trim()) {
    errors.push('Category is required.');
  }

  const colours = (draft.colours || []).filter((colour) => String(colour.label || '').trim());
  if (!colours.length) {
    errors.push('Select at least one colour.');
  }

  colours.forEach((colour) => {
    if (!Array.isArray(colour.images) || colour.images.length === 0) {
      errors.push(`Add at least one image for ${colour.label}.`);
    }
    if (colour.stock !== '' && colour.stock != null && (!Number.isFinite(Number(colour.stock)) || Number(colour.stock) < 0)) {
      errors.push(`Enter a valid stock for ${colour.label}.`);
    }
  });

  return errors;
}

export function draftToProductPayload(draft) {
  const colours = (draft.colours || [])
    .map((colour) => {
      const label = String(colour.label || '').trim();
      if (!label) return null;
      const images = (colour.images || [])
        .map((url) => String(url || '').trim())
        .filter(Boolean)
        .map((url) => ({ url, alt: `${String(draft.name || '').trim()} — ${label}` }));
      if (!images.length) return null;

      const mainIndex = Math.min(
        Math.max(0, Number(colour.mainIndex) || 0),
        images.length - 1,
      );
      const ordered = [...images.slice(mainIndex), ...images.slice(0, mainIndex)];
      const sizes = Array.isArray(colour.sizes)
        ? colour.sizes.map((size) => String(size).trim()).filter(Boolean)
        : [];
      const mapped = {
        label,
        images: ordered,
        image: ordered[0].url,
        sizes,
        available: colour.available !== false,
      };
      if (colour.hex) {
        mapped.hex = String(colour.hex).trim();
      }
      if (colour.stock !== '' && colour.stock != null) {
        mapped.stock = Number(colour.stock);
      }
      if (colour.price !== '' && colour.price != null) {
        mapped.price = Number(colour.price);
      }
      return mapped;
    })
    .filter(Boolean);

  const productImages = colours.flatMap((colour) => colour.images);

  const variants = [];
  colours.forEach((colour) => {
    const sizes = colour.sizes?.length ? colour.sizes : [''];
    sizes.forEach((size) => {
      const mapped = {
        colour: colour.label,
        size: size || '',
        image: colour.image,
        available: colour.available !== false,
      };
      if (colour.stock != null) mapped.stock = colour.available === false ? 0 : colour.stock;
      if (colour.price != null) mapped.price = colour.price;
      variants.push(mapped);
    });
  });

  const sizes = [
    ...new Set([
      ...(draft.sizes || []).map((entry) =>
        typeof entry === 'string' ? entry.trim() : String(entry?.label || '').trim(),
      ),
      ...colours.flatMap((colour) => colour.sizes || []),
    ]),
  ].filter(Boolean);

  const colourStockTotal = colours.reduce((sum, colour) => {
    if (colour.available === false) return sum;
    if (colour.stock == null || Number.isNaN(Number(colour.stock))) {
      return sum;
    }
    return sum + Number(colour.stock);
  }, 0);

  return {
    name: String(draft.name || '').trim(),
    description: String(draft.description || '').trim(),
    price: Number(draft.price),
    category: draft.category,
    images: productImages,
    colours,
    sizes,
    variants,
    stock: colourStockTotal > 0 ? colourStockTotal : Number(draft.stock || 0),
    bestSeller: Boolean(draft.bestSeller),
    newArrival: Boolean(draft.newArrival),
    featured: Boolean(draft.featured),
    active: Boolean(draft.active),
  };
}
