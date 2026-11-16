/**
 * Curated local fashion library from the project `surpjpg` folder.
 * These are eligible for hero/promo/category placeholders — not product uploads.
 */
export const SURPRISE_IMAGE_LIBRARY = [
  {
    id: 'sparkle-platform-mules',
    file: 'sparkle-platform-mules.jpg',
    url: '/images/surprise/sparkle-platform-mules.jpg',
    alt: 'Black crystal platform mules on feet',
    tags: ['hero', 'heels', 'shoes'],
  },
  {
    id: 'floral-slides-set',
    file: 'floral-slides-set.jpg',
    url: '/images/surprise/floral-slides-set.jpg',
    alt: 'Colourful floral slide sandals in a shipping box',
    tags: ['slides', 'promo', 'new'],
  },
  {
    id: 'puma-slides-flatlay',
    file: 'puma-slides-flatlay.jpg',
    url: '/images/surprise/puma-slides-flatlay.jpg',
    alt: 'Puma slides flat lay with boxes',
    tags: ['slides', 'promo', 'best'],
  },
  {
    id: 'dune-buckle-slides',
    file: 'dune-buckle-slides.jpg',
    url: '/images/surprise/dune-buckle-slides.jpg',
    alt: 'Dune London buckle slides in tan and black',
    tags: ['shoes', 'slides', 'bags'],
  },
  {
    id: 'platform-thong-colors',
    file: 'platform-thong-colors.jpg',
    url: '/images/surprise/platform-thong-colors.jpg',
    alt: 'Platform thong sandals in multiple colours',
    tags: ['slides', 'new', 'promo'],
  },
  {
    id: 'jordan-panda-lows',
    file: 'jordan-panda-lows.jpg',
    url: '/images/surprise/jordan-panda-lows.jpg',
    alt: 'Black and white low-top sneakers with gold charm',
    tags: ['hero', 'sneakers', 'shoes'],
  },
  {
    id: 'crystal-wedge-logo',
    file: 'crystal-wedge-logo.jpg',
    url: '/images/surprise/crystal-wedge-logo.jpg',
    alt: 'Black crystal platform wedges with gold emblem',
    tags: ['hero', 'heels', 'accessories'],
  },
  {
    id: 'crystal-wedge-street',
    file: 'crystal-wedge-street.jpg',
    url: '/images/surprise/crystal-wedge-street.jpg',
    alt: 'Black beaded platform wedges held outdoors',
    tags: ['hero', 'heels', 'best'],
  },
  {
    id: 'bling-slides-black-gold',
    file: 'bling-slides-black-gold.jpg',
    url: '/images/surprise/bling-slides-black-gold.jpg',
    alt: 'Black and gold rhinestone slide sandals',
    tags: ['hero', 'slides', 'accessories'],
  },
];

export function getSurpriseImageById(id) {
  return SURPRISE_IMAGE_LIBRARY.find((entry) => entry.id === id) || null;
}
