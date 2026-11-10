import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Category from '../models/Category.js';
import HomepageContent from '../models/HomepageContent.js';
import Product from '../models/Product.js';
import { categoryDefinitions } from '../utils/catalog.js';
import { HOMEPAGE_CURATED_COUNT } from '../utils/pagination.js';
import { slugify } from '../utils/slugify.js';

const seedProducts = [
  {
    name: 'Classy Handbag',
    slug: 'classy-handbag',
    description: 'Structured handbag with a top handle and woven body',
    price: 25000,
    categorySlug: 'bags',
    images: [{ url: '/images/prod-handbag.jpg', alt: 'Warm orange woven handbag' }],
    bestSeller: true,
    newArrival: false,
    featured: true,
    stock: 12,
    listedAt: new Date('2026-09-12'),
  },
  {
    name: 'Canvas Tote Bag',
    slug: 'canvas-tote-bag',
    description: 'Open canvas tote for everyday carry',
    price: 12000,
    categorySlug: 'totes',
    images: [{ url: '/images/cat-tote.jpg', alt: 'Canvas tote bag' }],
    bestSeller: true,
    newArrival: false,
    featured: false,
    stock: 20,
    listedAt: new Date('2026-09-18'),
  },
  {
    name: 'Comfort Slides',
    slug: 'comfort-slides',
    description: 'Two-strap slides with a soft footbed',
    price: 15000,
    categorySlug: 'slides',
    images: [{ url: '/images/prod-slides.jpg', alt: 'Grey two-strap slides on a cream rug' }],
    bestSeller: true,
    newArrival: false,
    featured: false,
    stock: 18,
    listedAt: new Date('2026-09-22'),
  },
  {
    name: 'Soft Beret',
    slug: 'soft-beret',
    description: 'Soft beret for everyday headwear',
    price: 6000,
    categorySlug: 'berets',
    images: [{ url: '/images/cat-beret.jpg', alt: 'Soft beret' }],
    bestSeller: true,
    newArrival: false,
    featured: false,
    stock: 25,
    listedAt: new Date('2026-09-28'),
  },
  {
    name: 'Turban Cap',
    slug: 'turban-cap',
    description: 'Ready satin turban',
    price: 7000,
    categorySlug: 'turbans',
    images: [{ url: '/images/cat-turban.jpg', alt: 'Brown satin turban' }],
    bestSeller: true,
    newArrival: false,
    featured: false,
    stock: 15,
    listedAt: new Date('2026-10-02'),
  },
  {
    name: 'Autogele',
    slug: 'autogele',
    description: 'Ready-to-wear autogele',
    price: 10000,
    categorySlug: 'autogele',
    images: [{ url: '/images/cat-gele.jpg', alt: 'Autogele headwrap' }],
    bestSeller: false,
    newArrival: true,
    featured: true,
    stock: 10,
    listedAt: new Date('2026-10-20'),
  },
  {
    name: 'Knotted Headband',
    slug: 'knotted-headband',
    description: 'Soft knotted headband',
    price: 4000,
    categorySlug: 'headbands',
    images: [{ url: '/images/cat-headband.jpg', alt: 'Pale pink knotted headband' }],
    bestSeller: false,
    newArrival: true,
    featured: false,
    stock: 30,
    listedAt: new Date('2026-10-24'),
  },
  {
    name: 'Block Heels',
    slug: 'block-heels',
    description: 'Leather slingbacks with a covered block heel',
    price: 28000,
    categorySlug: 'heels',
    images: [{ url: '/images/prod-block-heels.jpg', alt: 'Tan leather slingback shoes with a block heel' }],
    bestSeller: false,
    newArrival: true,
    featured: true,
    stock: 8,
    listedAt: new Date('2026-10-28'),
  },
  {
    name: 'Mini Bag',
    slug: 'mini-bag',
    description: 'Compact shoulder bag with a chain strap',
    price: 18000,
    categorySlug: 'bags',
    images: [{ url: '/images/prod-minibag.jpg', alt: 'Pink mini bag with a silver chain strap' }],
    bestSeller: false,
    newArrival: true,
    featured: false,
    stock: 14,
    listedAt: new Date('2026-11-01'),
  },
  {
    name: 'Classic Beret',
    slug: 'classic-beret',
    description: 'Black beret',
    price: 8000,
    categorySlug: 'berets',
    images: [{ url: '/images/prod-classic-beret.jpg', alt: 'Black beret worn with a coat' }],
    bestSeller: false,
    newArrival: true,
    featured: false,
    stock: 16,
    listedAt: new Date('2026-11-05'),
  },
];

const categoryImages = {
  bags: { url: '/images/prod-handbag.jpg', alt: 'Structured woven handbag' },
  totes: { url: '/images/cat-tote.jpg', alt: 'Canvas tote bag' },
  shoes: { url: '/images/cat-shoes.jpg', alt: 'Floral high heels' },
  sneakers: { url: '/images/cat-shoes.jpg', alt: 'Footwear' },
  slides: { url: '/images/prod-slides.jpg', alt: 'Comfort slides' },
  heels: { url: '/images/prod-block-heels.jpg', alt: 'Block heels' },
  berets: { url: '/images/cat-beret.jpg', alt: 'Soft beret' },
  turbans: { url: '/images/cat-turban.jpg', alt: 'Brown satin turban' },
  headwear: { url: '/images/cat-beret.jpg', alt: 'Headwear' },
  autogele: { url: '/images/cat-gele.jpg', alt: 'Gold autogele' },
  headbands: { url: '/images/cat-headband.jpg', alt: 'Pale pink knotted headband' },
  clothing: { url: '/images/prod-dress.jpg', alt: 'Clothing' },
  accessories: { url: '/images/prod-handbag.jpg', alt: 'Accessories' },
};

async function seed() {
  const connected = await connectDB();
  if (!connected || !isDbConnected()) {
    console.error('Seed aborted: MongoDB is not connected. Set MONGO_URI and start MongoDB first.');
    process.exit(1);
  }

  console.log('Clearing existing catalogue collections...');
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    HomepageContent.deleteMany({ key: 'main' }),
  ]);

  console.log('Creating categories...');
  const featuredSlugs = new Set(['bags', 'totes', 'shoes', 'berets', 'turbans', 'autogele', 'headbands']);
  const createdCategories = [];

  for (const [index, definition] of categoryDefinitions.entries()) {
    const slug = slugify(definition.slug || definition.name);
    // eslint-disable-next-line no-await-in-loop
    const category = await Category.create({
      name: definition.name,
      slug,
      description: definition.description || '',
      group: definition.group || '',
      image: categoryImages[slug] || { url: '', alt: definition.name },
      featured: featuredSlugs.has(slug),
      active: true,
      sortOrder: index + 1,
    });
    createdCategories.push(category);
  }

  const bySlug = Object.fromEntries(createdCategories.map((category) => [category.slug, category]));

  console.log('Creating products...');
  for (const item of seedProducts) {
    const category = bySlug[item.categorySlug];
    if (!category) {
      throw new Error(`Missing category for product ${item.name}`);
    }
    // eslint-disable-next-line no-await-in-loop
    await Product.create({
      name: item.name,
      slug: item.slug,
      description: item.description,
      price: item.price,
      category: category._id,
      categorySlug: category.slug,
      categoryLabel: category.name,
      images: item.images,
      sizes: [],
      colours: [],
      stock: item.stock,
      bestSeller: item.bestSeller,
      newArrival: item.newArrival,
      featured: item.featured,
      active: true,
      listedAt: item.listedAt,
    });
  }

  console.log('Creating homepage content...');
  await HomepageContent.create({
    key: 'main',
    announcement: 'Fast & Reliable Delivery Across Nigeria  |  Shop with Confidence',
    curatedBestSellerLimit: HOMEPAGE_CURATED_COUNT,
    curatedNewArrivalLimit: HOMEPAGE_CURATED_COUNT,
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
  });

  const [categoryCount, productCount] = await Promise.all([
    Category.countDocuments(),
    Product.countDocuments(),
  ]);

  console.log(`Seed complete: ${categoryCount} categories, ${productCount} products.`);
  await mongoose.disconnect();
}

seed()
  .then(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`Seed failed: ${error.message}`);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore disconnect errors
    }
    process.exit(1);
  });
