import HomepageContent from '../models/HomepageContent.js';
import { HOMEPAGE_CURATED_COUNT } from '../utils/pagination.js';
import { requireDb } from '../utils/requireDb.js';
import { listActiveCategories } from './categoryService.js';
import { getCuratedProducts } from './productService.js';

const DEFAULT_HOMEPAGE = {
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

async function getOrCreateHomepageContent() {
  let content = await HomepageContent.findOne({ key: 'main' }).lean();
  if (!content) {
    content = (
      await HomepageContent.create({
        key: 'main',
        ...DEFAULT_HOMEPAGE,
        curatedBestSellerLimit: HOMEPAGE_CURATED_COUNT,
        curatedNewArrivalLimit: HOMEPAGE_CURATED_COUNT,
      })
    ).toObject();
  }
  return content;
}

export async function getHomepagePayload() {
  requireDb();

  const content = await getOrCreateHomepageContent();
  const bestLimit = content.curatedBestSellerLimit || HOMEPAGE_CURATED_COUNT;
  const newLimit = content.curatedNewArrivalLimit || HOMEPAGE_CURATED_COUNT;

  const [bestSellers, newArrivals, featuredProducts, featuredCategories] = await Promise.all([
    getCuratedProducts({ bestSeller: true, limit: bestLimit }),
    getCuratedProducts({ newArrival: true, limit: newLimit }),
    getCuratedProducts({ featured: true, limit: bestLimit }),
    listActiveCategories({ featuredOnly: true }),
  ]);

  const categories =
    featuredCategories.categories.length > 0
      ? featuredCategories.categories
      : (await listActiveCategories()).categories.slice(0, 7);

  return {
    announcement: content.announcement,
    heroSlides: content.heroSlides?.length ? content.heroSlides : DEFAULT_HOMEPAGE.heroSlides,
    categories: categories.map((category) => ({
      id: category.slug,
      name: category.name,
      image: category.image,
      alt: category.alt,
    })),
    bestSellers,
    newArrivals,
    featuredProducts,
    featuredCategories: featuredCategories.categories,
    promos: content.promos?.length ? content.promos : DEFAULT_HOMEPAGE.promos,
    banners: content.heroSlides?.length ? content.heroSlides : DEFAULT_HOMEPAGE.heroSlides,
    source: 'mongodb',
  };
}

export async function getHomepageBanners() {
  requireDb();
  const content = await getOrCreateHomepageContent();
  return {
    announcement: content.announcement,
    heroSlides: content.heroSlides?.length ? content.heroSlides : DEFAULT_HOMEPAGE.heroSlides,
    promos: content.promos?.length ? content.promos : DEFAULT_HOMEPAGE.promos,
    source: 'mongodb',
  };
}
