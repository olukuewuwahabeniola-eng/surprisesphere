/** Shared homepage defaults — uses the Surprise Fashion Sphere image library. */
export const DEFAULT_HOMEPAGE = {
  announcement: 'Fast & Reliable Delivery Across Nigeria  |  Shop with Confidence',
  heroSlides: [
    {
      id: 'sparkle-mules',
      title: 'BEAUTY,\nREIMAGINED.',
      subtitle:
        'A considered edit of bags, footwear, headwear and more—styled for the woman who arrives with intention.',
      cta: 'Shop Now',
      href: '/best-sellers',
      image: '/images/surprise/sparkle-platform-mules.jpg',
      alt: 'Black crystal platform mules',
      active: true,
      sortOrder: 0,
    },
    {
      id: 'bling-slides',
      title: 'THE PERFECT\nFINISH.',
      subtitle: 'Statement slides and sandals that complete every look—quiet luxury for day, soft drama for evening.',
      cta: 'Shop Now',
      href: '/shop/slides',
      image: '/images/surprise/bling-slides-black-gold.jpg',
      alt: 'Black and gold rhinestone slide sandals',
      active: true,
      sortOrder: 1,
    },
    {
      id: 'jordan-lows',
      title: 'STEP OUT.\nSTAND APART.',
      subtitle: 'Sneakers, slides and everyday pairs made for work, owambe and the weekend in between.',
      cta: 'Shop Now',
      href: '/shop/sneakers',
      image: '/images/surprise/jordan-panda-lows.jpg',
      alt: 'Black and white sneakers with gold charm',
      active: true,
      sortOrder: 2,
    },
    {
      id: 'crystal-wedges',
      title: 'MAKE EVERY\nENTRANCE\nUNFORGETTABLE.',
      subtitle: 'Platform wedges and occasion footwear designed to hold the room—and the moment.',
      cta: 'Shop Now',
      href: '/shop/heels',
      image: '/images/surprise/crystal-wedge-street.jpg',
      alt: 'Black beaded platform wedges',
      active: true,
      sortOrder: 3,
    },
    {
      id: 'puma-flatlay',
      title: 'NEW SEASON\nESSENTIALS.',
      subtitle: 'Fresh colourways and everyday slides, ready for your next outing.',
      cta: 'Shop New Arrivals',
      href: '/new-arrivals',
      image: '/images/surprise/puma-slides-flatlay.jpg',
      alt: 'Colourful slide sandals flat lay',
      active: true,
      sortOrder: 4,
    },
    {
      id: 'platform-colors',
      title: 'COLOUR,\nCONFIDENCE.',
      subtitle: 'Platform thongs in a spectrum of tones—pick your mood, then step in.',
      cta: 'Shop Slides',
      href: '/shop/slides',
      image: '/images/surprise/platform-thong-colors.jpg',
      alt: 'Platform thong sandals in multiple colours',
      active: false,
      sortOrder: 5,
    },
  ],
  promos: [
    {
      id: 'everyone',
      title: 'Quality Fashion for Everyone',
      kicker: 'Bags  ·  Shoes  ·  Headwear & More',
      cta: 'Shop Collection',
      href: '/best-sellers',
      image: '/images/surprise/floral-slides-set.jpg',
      alt: 'Floral slide sandals collection',
      tone: 'wine',
    },
    {
      id: 'feel-great',
      title: 'Look Good, Feel Great',
      kicker: 'Fashion that fits your lifestyle.',
      cta: 'Shop Now',
      href: '/new-arrivals',
      image: '/images/surprise/dune-buckle-slides.jpg',
      alt: 'Tan and black buckle slides',
      tone: 'cream',
    },
  ],
};

export const CATEGORY_IMAGE_MAP = {
  bags: {
    url: '/images/surprise/dune-buckle-slides.jpg',
    alt: 'Tan and black fashion slides',
  },
  totes: {
    url: '/images/surprise/floral-slides-set.jpg',
    alt: 'Colourful floral slides',
  },
  shoes: {
    url: '/images/surprise/sparkle-platform-mules.jpg',
    alt: 'Crystal platform mules',
  },
  sneakers: {
    url: '/images/surprise/jordan-panda-lows.jpg',
    alt: 'Black and white sneakers',
  },
  slides: {
    url: '/images/surprise/puma-slides-flatlay.jpg',
    alt: 'Slide sandals collection',
  },
  heels: {
    url: '/images/surprise/crystal-wedge-logo.jpg',
    alt: 'Crystal platform wedges',
  },
  berets: {
    url: '/images/surprise/crystal-wedge-street.jpg',
    alt: 'Statement black platform wedges',
  },
  turbans: {
    url: '/images/surprise/bling-slides-black-gold.jpg',
    alt: 'Black and gold rhinestone slides',
  },
  headwear: {
    url: '/images/surprise/crystal-wedge-street.jpg',
    alt: 'Statement fashion footwear',
  },
  autogele: {
    url: '/images/surprise/platform-thong-colors.jpg',
    alt: 'Colourful platform sandals',
  },
  headbands: {
    url: '/images/surprise/puma-slides-flatlay.jpg',
    alt: 'Colourful fashion slides',
  },
  clothing: {
    url: '/images/surprise/jordan-panda-lows.jpg',
    alt: 'Street-style sneakers',
  },
  accessories: {
    url: '/images/surprise/bling-slides-black-gold.jpg',
    alt: 'Black and gold statement slides',
  },
};

/** Map old placeholder product image paths to surprise library images (URLs only). */
export const PRODUCT_PLACEHOLDER_IMAGE_MAP = {
  '/images/prod-handbag.jpg': '/images/surprise/dune-buckle-slides.jpg',
  '/images/cat-tote.jpg': '/images/surprise/floral-slides-set.jpg',
  '/images/prod-slides.jpg': '/images/surprise/puma-slides-flatlay.jpg',
  '/images/cat-beret.jpg': '/images/surprise/crystal-wedge-street.jpg',
  '/images/cat-turban.jpg': '/images/surprise/bling-slides-black-gold.jpg',
  '/images/cat-gele.jpg': '/images/surprise/platform-thong-colors.jpg',
  '/images/cat-headband.jpg': '/images/surprise/puma-slides-flatlay.jpg',
  '/images/prod-block-heels.jpg': '/images/surprise/crystal-wedge-logo.jpg',
  '/images/prod-minibag.jpg': '/images/surprise/floral-slides-set.jpg',
  '/images/prod-classic-beret.jpg': '/images/surprise/sparkle-platform-mules.jpg',
  '/images/cat-shoes.jpg': '/images/surprise/jordan-panda-lows.jpg',
  '/images/prod-dress.jpg': '/images/surprise/bling-slides-black-gold.jpg',
  '/images/hero-1.jpg': '/images/surprise/sparkle-platform-mules.jpg',
  '/images/banner-1.jpg': '/images/surprise/floral-slides-set.jpg',
};

export function normalizeHeroSlides(slides = []) {
  return (Array.isArray(slides) ? slides : [])
    .map((slide, index) => ({
      id: String(slide.id || `slide-${index + 1}`),
      title: String(slide.title || '').trim(),
      subtitle: String(slide.subtitle || ''),
      cta: String(slide.cta || 'Shop Now'),
      href: String(slide.href || '/shop'),
      image: String(slide.image || ''),
      alt: String(slide.alt || ''),
      active: slide.active !== false,
      sortOrder: Number.isFinite(Number(slide.sortOrder)) ? Number(slide.sortOrder) : index,
    }))
    .filter((slide) => slide.title && slide.image)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function activeHeroSlides(slides = []) {
  return normalizeHeroSlides(slides).filter((slide) => slide.active);
}
