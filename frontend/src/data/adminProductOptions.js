export const COLOUR_PALETTE_GROUPS = [
  {
    id: 'neutrals',
    label: 'Neutrals',
    colours: [
      { label: 'Black', hex: '#111111' },
      { label: 'White', hex: '#FFFFFF' },
      { label: 'Off-white', hex: '#F7F4EF' },
      { label: 'Ivory', hex: '#FFFFF0' },
      { label: 'Cream', hex: '#F5E6C8' },
      { label: 'Beige', hex: '#D8C3A5' },
      { label: 'Nude', hex: '#E0C3A8' },
      { label: 'Taupe', hex: '#B8A99A' },
      { label: 'Grey', hex: '#8A8A8A' },
      { label: 'Charcoal', hex: '#36454F' },
      { label: 'Silver', hex: '#C0C0C0' },
      { label: 'Gold', hex: '#F1D58A' },
    ],
  },
  {
    id: 'browns',
    label: 'Browns & earthy tones',
    colours: [
      { label: 'Chocolate brown', hex: '#3D1C02' },
      { label: 'Coffee brown', hex: '#4B2E19' },
      { label: 'Brown', hex: '#6B3F2A' },
      { label: 'Tan', hex: '#C4A484' },
      { label: 'Camel', hex: '#C19A6B' },
      { label: 'Mocha', hex: '#967969' },
      { label: 'Caramel', hex: '#AF6E4D' },
      { label: 'Cognac', hex: '#9A463D' },
      { label: 'Espresso', hex: '#3C1F0F' },
      { label: 'Khaki', hex: '#C3B091' },
      { label: 'Olive', hex: '#708238' },
      { label: 'Sand', hex: '#C2B280' },
    ],
  },
  {
    id: 'reds',
    label: 'Reds & pinks',
    colours: [
      { label: 'Red', hex: '#B42318' },
      { label: 'Wine', hex: '#722F37' },
      { label: 'Burgundy', hex: '#6D1F2C' },
      { label: 'Maroon', hex: '#800000' },
      { label: 'Cherry red', hex: '#D2042D' },
      { label: 'Rose', hex: '#E8A0BF' },
      { label: 'Dusty rose', hex: '#D4A5A5' },
      { label: 'Baby pink', hex: '#F4C2C2' },
      { label: 'Blush pink', hex: '#DE5D83' },
      { label: 'Hot pink', hex: '#FF69B4' },
      { label: 'Fuchsia', hex: '#FF00FF' },
      { label: 'Coral', hex: '#FF7F50' },
    ],
  },
  {
    id: 'oranges',
    label: 'Oranges & yellows',
    colours: [
      { label: 'Orange', hex: '#D97706' },
      { label: 'Burnt orange', hex: '#CC5500' },
      { label: 'Rust', hex: '#B7410E' },
      { label: 'Terracotta', hex: '#E2725B' },
      { label: 'Peach', hex: '#FFCBA4' },
      { label: 'Mustard', hex: '#E1AD01' },
      { label: 'Yellow', hex: '#E4C15C' },
      { label: 'Lemon', hex: '#FFF44F' },
      { label: 'Champagne', hex: '#F7E7CE' },
    ],
  },
  {
    id: 'greens',
    label: 'Greens',
    colours: [
      { label: 'Emerald', hex: '#50C878' },
      { label: 'Forest green', hex: '#228B22' },
      { label: 'Dark green', hex: '#013220' },
      { label: 'Mint', hex: '#98FF98' },
      { label: 'Sage', hex: '#9DC183' },
      { label: 'Pistachio', hex: '#93C572' },
      { label: 'Lime', hex: '#BFFF00' },
      { label: 'Teal', hex: '#008080' },
      { label: 'Sea green', hex: '#2E8B57' },
    ],
  },
  {
    id: 'blues',
    label: 'Blues',
    colours: [
      { label: 'Navy blue', hex: '#1B2A4A' },
      { label: 'Royal blue', hex: '#4169E1' },
      { label: 'Sky blue', hex: '#87CEEB' },
      { label: 'Baby blue', hex: '#89CFF0' },
      { label: 'Light blue', hex: '#ADD8E6' },
      { label: 'Denim blue', hex: '#1560BD' },
      { label: 'Cobalt blue', hex: '#0047AB' },
      { label: 'Turquoise', hex: '#40E0D0' },
      { label: 'Midnight blue', hex: '#191970' },
    ],
  },
  {
    id: 'purples',
    label: 'Purples',
    colours: [
      { label: 'Purple', hex: '#6B3FA0' },
      { label: 'Lavender', hex: '#E6E6FA' },
      { label: 'Lilac', hex: '#C8A2C8' },
      { label: 'Violet', hex: '#8F00FF' },
      { label: 'Plum', hex: '#8E4585' },
      { label: 'Mauve', hex: '#E0B0FF' },
      { label: 'Orchid', hex: '#DA70D6' },
    ],
  },
];

export const ALL_PALETTE_COLOURS = COLOUR_PALETTE_GROUPS.flatMap((group) => group.colours);

export const NUMERIC_SIZES = Array.from({ length: 28 }, (_, index) => String(20 + index));

export const EXTRA_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  'One Size',
  'Free Size',
  'Small',
  'Medium',
  'Large',
];

export const DEFAULT_SIZE_OPTIONS = [...NUMERIC_SIZES, ...EXTRA_SIZES];

export function findPaletteColour(label) {
  const key = String(label || '')
    .trim()
    .toLowerCase();
  return ALL_PALETTE_COLOURS.find((colour) => colour.label.toLowerCase() === key) || null;
}
