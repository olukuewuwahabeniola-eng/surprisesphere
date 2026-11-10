/**
 * Stage 1 catalogue seed.
 * Only products we already show on the homepage live here.
 * Do not invent prices, discounts or reviews.
 *
 * Listing pages have no fixed product quota. Pagination only batches
 * responses for performance. Customers can page through the full match set.
 */

/** Homepage-only curated count. Not a catalogue limit. */
export const HOMEPAGE_CURATED_COUNT = 5;

/** Default batch size for listing pages. Not a total product cap. */
export const DEFAULT_PAGE_SIZE = 24;

/** Max items returned in one API response. Not a store-wide maximum. */
export const MAX_PAGE_SIZE = 48;

export const categoryDefinitions = [
  {
    slug: 'bags',
    name: 'Bags',
    group: 'bags',
    description: 'Handbags and everyday bags.',
  },
  {
    slug: 'totes',
    name: 'Tote Bags',
    group: 'bags',
    description: 'Open totes and carry-all bags.',
  },
  {
    slug: 'shoes',
    name: 'Shoes',
    group: 'footwear',
    description: 'Footwear for work, weekends and owambe.',
  },
  {
    slug: 'sneakers',
    name: 'Sneakers',
    group: 'footwear',
    description: 'Casual sneakers and sport-inspired pairs.',
  },
  {
    slug: 'slides',
    name: 'Slides & Slippers',
    group: 'footwear',
    description: 'Slides, slippers and easy everyday pairs.',
  },
  {
    slug: 'heels',
    name: 'Sandals & Heels',
    group: 'footwear',
    description: 'Heels, sandals and dress footwear.',
  },
  {
    slug: 'berets',
    name: 'Berets',
    group: 'headwear',
    description: 'Soft and structured berets.',
  },
  {
    slug: 'turbans',
    name: 'Turban Caps',
    group: 'headwear',
    description: 'Ready turban caps.',
  },
  {
    slug: 'headwear',
    name: 'Headwear',
    group: 'headwear',
    description: 'Berets, turban caps and related headwear.',
    isGroup: true,
    includes: ['berets', 'turbans'],
  },
  {
    slug: 'autogele',
    name: 'Autogele',
    group: 'autogele',
    description: 'Ready-to-wear autogele.',
  },
  {
    slug: 'headbands',
    name: 'Headbands',
    group: 'headbands',
    description: 'Headbands for everyday wear.',
  },
  {
    slug: 'clothing',
    name: 'Clothing',
    group: 'clothing',
    description: 'Clothing and wears.',
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    group: 'accessories',
    description: 'Fashion accessories.',
  },
];

const products = [
  {
    id: 'classy-handbag',
    name: 'Classy Handbag',
    price: 25000,
    category: 'bags',
    categoryLabel: 'Bags',
    image: '/images/prod-handbag.jpg',
    alt: 'Warm orange woven handbag',
    detail: 'Structured handbag with a top handle and woven body',
    bestSeller: true,
    newArrival: false,
    featured: true,
    active: true,
    listedAt: '2026-09-12',
    sizes: [],
    colours: [],
  },
  {
    id: 'canvas-tote',
    name: 'Canvas Tote Bag',
    price: 12000,
    category: 'totes',
    categoryLabel: 'Tote Bags',
    image: '/images/cat-tote.jpg',
    alt: 'Canvas tote bag',
    detail: 'Open canvas tote for everyday carry',
    bestSeller: true,
    newArrival: false,
    featured: false,
    active: true,
    listedAt: '2026-09-18',
    sizes: [],
    colours: [],
  },
  {
    id: 'comfort-slides',
    name: 'Comfort Slides',
    price: 15000,
    category: 'slides',
    categoryLabel: 'Slides & Slippers',
    image: '/images/prod-slides.jpg',
    alt: 'Grey two-strap slides on a cream rug',
    detail: 'Two-strap slides with a soft footbed',
    bestSeller: true,
    newArrival: false,
    featured: false,
    active: true,
    listedAt: '2026-09-22',
    sizes: [],
    colours: [],
  },
  {
    id: 'soft-beret',
    name: 'Soft Beret',
    price: 6000,
    category: 'berets',
    categoryLabel: 'Berets',
    image: '/images/cat-beret.jpg',
    alt: 'Soft beret',
    detail: 'Soft beret for everyday headwear',
    bestSeller: true,
    newArrival: false,
    featured: false,
    active: true,
    listedAt: '2026-09-28',
    sizes: [],
    colours: [],
  },
  {
    id: 'turban-cap',
    name: 'Turban Cap',
    price: 7000,
    category: 'turbans',
    categoryLabel: 'Turban Caps',
    image: '/images/cat-turban.jpg',
    alt: 'Brown satin turban',
    detail: 'Ready satin turban',
    bestSeller: true,
    newArrival: false,
    featured: false,
    active: true,
    listedAt: '2026-10-02',
    sizes: [],
    colours: [],
  },
  {
    id: 'autogele',
    name: 'Autogele',
    price: 10000,
    category: 'autogele',
    categoryLabel: 'Autogele',
    image: '/images/cat-gele.jpg',
    alt: 'Autogele headwrap',
    detail: 'Ready-to-wear autogele',
    bestSeller: false,
    newArrival: true,
    featured: true,
    active: true,
    listedAt: '2026-10-20',
    sizes: [],
    colours: [],
  },
  {
    id: 'satin-headband',
    name: 'Knotted Headband',
    price: 4000,
    category: 'headbands',
    categoryLabel: 'Headbands',
    image: '/images/cat-headband.jpg',
    alt: 'Pale pink knotted headband',
    detail: 'Soft knotted headband',
    bestSeller: false,
    newArrival: true,
    featured: false,
    active: true,
    listedAt: '2026-10-24',
    sizes: [],
    colours: [],
  },
  {
    id: 'block-heels',
    name: 'Block Heels',
    price: 28000,
    category: 'heels',
    categoryLabel: 'Sandals & Heels',
    image: '/images/prod-block-heels.jpg',
    alt: 'Tan leather slingback shoes with a block heel',
    detail: 'Leather slingbacks with a covered block heel',
    bestSeller: false,
    newArrival: true,
    featured: true,
    active: true,
    listedAt: '2026-10-28',
    sizes: [],
    colours: [],
  },
  {
    id: 'mini-bag',
    name: 'Mini Bag',
    price: 18000,
    category: 'bags',
    categoryLabel: 'Bags',
    image: '/images/prod-minibag.jpg',
    alt: 'Pink mini bag with a silver chain strap',
    detail: 'Compact shoulder bag with a chain strap',
    bestSeller: false,
    newArrival: true,
    featured: false,
    active: true,
    listedAt: '2026-11-01',
    sizes: [],
    colours: [],
  },
  {
    id: 'classic-beret',
    name: 'Classic Beret',
    price: 8000,
    category: 'berets',
    categoryLabel: 'Berets',
    image: '/images/prod-classic-beret.jpg',
    alt: 'Black beret worn with a coat',
    detail: 'Black beret',
    bestSeller: false,
    newArrival: true,
    featured: false,
    active: true,
    listedAt: '2026-11-05',
    sizes: [],
    colours: [],
  },
];

function publicProduct(product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    categoryLabel: product.categoryLabel,
    image: product.image,
    alt: product.alt,
    detail: product.detail,
    bestSeller: product.bestSeller,
    newArrival: product.newArrival,
    featured: Boolean(product.featured),
    active: product.active !== false,
    listedAt: product.listedAt,
    sizes: product.sizes,
    colours: product.colours,
  };
}

function activeProducts() {
  return products.filter((product) => product.active !== false);
}

function readPage(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  let pageSize = Number.parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE;
  if (!Number.isFinite(pageSize) || pageSize < 1) {
    pageSize = DEFAULT_PAGE_SIZE;
  }
  pageSize = Math.min(pageSize, MAX_PAGE_SIZE);
  return { page, pageSize };
}

function paginate(items, query = {}) {
  const { page, pageSize } = readPage(query);
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    products: pageItems,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
      // Explicit: there is no store-wide maximum beyond the matching collection.
      hasFixedQuota: false,
    },
  };
}

export function getCategory(slug) {
  return categoryDefinitions.find((category) => category.slug === slug) || null;
}

export function listCategories() {
  return categoryDefinitions.map((category) => ({
    slug: category.slug,
    name: category.name,
    group: category.group,
    description: category.description,
    isGroup: Boolean(category.isGroup),
  }));
}

function categoryMatches(product, slug) {
  const category = getCategory(slug);
  if (!category) {
    return false;
  }

  if (category.isGroup && Array.isArray(category.includes)) {
    return category.includes.includes(product.category);
  }

  if (slug === 'shoes') {
    return product.category === 'shoes' || ['slides', 'heels', 'sneakers'].includes(product.category);
  }

  return product.category === slug;
}

function applyFilters(items, query = {}) {
  let next = items.filter((product) => product.active !== false);
  const sortKey = String(query.sort || 'newest').toLowerCase();

  if (!['newest', 'price-asc', 'price-desc'].includes(sortKey)) {
    const error = new Error('Sort must be newest, price-asc or price-desc.');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  if (query.category) {
    next = next.filter((product) => categoryMatches(product, query.category));
  }

  if (query.q) {
    const term = String(query.q).trim().toLowerCase();
    if (term.length < 2) {
      const error = new Error('Search text must be at least 2 characters.');
      error.statusCode = 400;
      throw error;
    }
    next = next.filter((product) => {
      const haystack = `${product.name} ${product.detail || ''} ${product.categoryLabel || ''} ${product.category || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }

  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (query.minPrice !== undefined && query.minPrice !== '' && (!Number.isFinite(minPrice) || minPrice < 0)) {
    const error = new Error('minPrice must be a number that is 0 or greater.');
    error.statusCode = 400;
    throw error;
  }
  if (query.maxPrice !== undefined && query.maxPrice !== '' && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
    const error = new Error('maxPrice must be a number that is 0 or greater.');
    error.statusCode = 400;
    throw error;
  }
  if (Number.isFinite(minPrice) && minPrice >= 0) {
    next = next.filter((product) => product.price >= minPrice);
  }
  if (Number.isFinite(maxPrice) && maxPrice >= 0) {
    next = next.filter((product) => product.price <= maxPrice);
  }

  if (query.size) {
    const size = String(query.size).toLowerCase();
    next = next.filter((product) =>
      product.sizes.some((entry) => String(entry).toLowerCase() === size),
    );
  }

  if (query.colour) {
    const colour = String(query.colour).toLowerCase();
    next = next.filter((product) =>
      product.colours.some((entry) => String(entry).toLowerCase() === colour),
    );
  }

  switch (sortKey) {
    case 'price-asc':
      next.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      next.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
    default:
      next.sort((a, b) => String(b.listedAt).localeCompare(String(a.listedAt)));
      break;
  }

  return next.map(publicProduct);
}

function listCollection(items, query = {}) {
  return paginate(applyFilters(items, query), query);
}

export function getBestSellers(query = {}) {
  return listCollection(
    activeProducts().filter((product) => product.bestSeller),
    query,
  );
}

export function getNewArrivals(query = {}) {
  return listCollection(
    activeProducts().filter((product) => product.newArrival),
    query,
  );
}

export function getFeaturedProducts(query = {}) {
  return listCollection(
    activeProducts().filter((product) => product.featured),
    query,
  );
}

export function getProductByIdOrSlug(idOrSlug) {
  const key = String(idOrSlug || '').trim().toLowerCase();
  const product = activeProducts().find(
    (entry) => entry.id === key || String(entry.name).toLowerCase().replace(/\s+/g, '-') === key,
  );
  return product ? publicProduct(product) : null;
}

export function getAllProducts(query = {}) {
  return listCollection(activeProducts(), query);
}

export function getProductsByCategory(slug, query = {}) {
  const category = getCategory(slug);
  if (!category) {
    return null;
  }

  const matched = activeProducts().filter((product) => categoryMatches(product, slug));
  const listed = listCollection(matched, { ...query, category: undefined });

  return {
    category: {
      slug: category.slug,
      name: category.name,
      group: category.group,
      description: category.description,
      isGroup: Boolean(category.isGroup),
    },
    ...listed,
  };
}

export function getHomepageCatalog() {
  const homepageCategories = [
    {
      id: 'bags',
      name: 'Bags',
      image: '/images/prod-handbag.jpg',
      alt: 'Structured woven handbag',
    },
    {
      id: 'totes',
      name: 'Tote Bags',
      image: '/images/cat-tote.jpg',
      alt: 'Canvas tote bag',
    },
    {
      id: 'shoes',
      name: 'Shoes',
      image: '/images/cat-shoes.jpg',
      alt: 'Floral high heels',
    },
    {
      id: 'berets',
      name: 'Berets',
      image: '/images/cat-beret.jpg',
      alt: 'Soft beret',
    },
    {
      id: 'turbans',
      name: 'Turban Caps',
      image: '/images/cat-turban.jpg',
      alt: 'Brown satin turban',
    },
    {
      id: 'autogele',
      name: 'Autogele',
      image: '/images/cat-gele.jpg',
      alt: 'Gold autogele tied in a large bow',
    },
    {
      id: 'headbands',
      name: 'Headbands',
      image: '/images/cat-headband.jpg',
      alt: 'Pale pink knotted headband',
    },
  ];

  return {
    announcement: 'Fast & Reliable Delivery Across Nigeria  |  Shop with Confidence',
    heroSlides: [
      {
        id: 'step-out',
        title: 'Step Out\nin Style',
        subtitle: 'Quality, Affordable Bags, Shoes, Headwear & More',
        cta: 'Shop Now',
        href: '/best-sellers',
        image: '/images/hero-1.jpg',
        alt: 'Woman in a burgundy coat carrying shopping bags',
      },
      {
        id: 'bags',
        title: 'Carry it\nwith you',
        subtitle: 'Handbags, totes and small bags for the day and the evening',
        cta: 'Shop Bags',
        href: '/shop/bags',
        image: '/images/prod-handbag.jpg',
        alt: 'Warm orange woven handbag with a top handle',
      },
      {
        id: 'shoes',
        title: 'Shoes that\nkeep up',
        subtitle: 'Heels, slides and everyday pairs for work, owambe and weekends',
        cta: 'Shop Footwear',
        href: '/shop/shoes',
        image: '/images/cat-shoes.jpg',
        alt: 'Floral pointed-toe heels on a pale blue set',
      },
      {
        id: 'clothing',
        title: 'Dress for\nthe moment',
        subtitle: 'Clothing and accessories, alongside bags, shoes and headwear',
        cta: 'View the Edit',
        href: '/shop/clothing',
        image: '/images/prod-dress.jpg',
        alt: 'Woman in a red gown standing outdoors',
      },
    ],
    categories: homepageCategories,
    // Curated homepage preview only. Full collections have no fixed quota.
    bestSellers: getBestSellers({
      sort: 'newest',
      page: 1,
      pageSize: HOMEPAGE_CURATED_COUNT,
    }).products,
    newArrivals: getNewArrivals({
      sort: 'newest',
      page: 1,
      pageSize: HOMEPAGE_CURATED_COUNT,
    }).products,
    promos: [
      {
        id: 'everyone',
        title: 'Quality Fashion for Everyone',
        kicker: 'Bags  ·  Shoes  ·  Headwear & More',
        cta: 'Shop Collection',
        href: '/best-sellers',
        image: '/images/banner-1.jpg',
        alt: 'Rail of knitwear and dresses in a shop window',
        tone: 'wine',
      },
      {
        id: 'feel-great',
        title: 'Look Good, Feel Great',
        kicker: 'Fashion that fits your lifestyle.',
        cta: 'Shop Now',
        href: '/new-arrivals',
        image: '/images/prod-dress.jpg',
        alt: 'Red evening dress in motion',
        tone: 'cream',
      },
    ],
  };
}
