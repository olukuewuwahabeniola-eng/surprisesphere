export const navigation = [
  { label: 'Home', href: '/' },
  {
    label: 'Shop',
    href: '/shop',
    children: [
      { label: 'Bags', href: '/shop/bags' },
      { label: 'Tote Bags', href: '/shop/totes' },
      { label: 'Shoes', href: '/shop/shoes' },
      { label: 'Sneakers', href: '/shop/sneakers' },
      { label: 'Slides & Slippers', href: '/shop/slides' },
      { label: 'Sandals & Heels', href: '/shop/heels' },
      { label: 'Clothing', href: '/shop/clothing' },
      { label: 'Accessories', href: '/shop/accessories' },
    ],
  },
  {
    label: 'Bags',
    href: '/shop/bags',
    children: [
      { label: 'Handbags', href: '/shop/bags' },
      { label: 'Tote Bags', href: '/shop/totes' },
    ],
  },
  {
    label: 'Shoes',
    href: '/shop/shoes',
    children: [
      { label: 'Shoes', href: '/shop/shoes' },
      { label: 'Sneakers', href: '/shop/sneakers' },
      { label: 'Slides & Slippers', href: '/shop/slides' },
      { label: 'Sandals & Heels', href: '/shop/heels' },
    ],
  },
  {
    label: 'Headwear',
    href: '/shop/headwear',
    children: [
      { label: 'Berets', href: '/shop/berets' },
      { label: 'Turban Caps', href: '/shop/turbans' },
    ],
  },
  {
    label: 'Autogele',
    href: '/shop/autogele',
    children: [{ label: 'Autogele', href: '/shop/autogele' }],
  },
  {
    label: 'Headbands',
    href: '/shop/headbands',
    children: [{ label: 'Headbands', href: '/shop/headbands' }],
  },
  { label: 'Contact', href: '/contact' },
];
