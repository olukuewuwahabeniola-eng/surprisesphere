import HomepageContent from '../models/HomepageContent.js';
import { HOMEPAGE_CURATED_COUNT } from '../utils/pagination.js';
import { requireDb } from '../utils/requireDb.js';
import { listActiveCategories } from './categoryService.js';
import { getCuratedProducts } from './productService.js';
import { getStoreSettings } from './storeService.js';

const DEFAULT_HOMEPAGE = {
  announcement: 'Fast & Reliable Delivery Across Nigeria  |  Shop with Confidence',
  heroSlides: [
    {
      id: 'step-out',
      title: 'BEAUTY,\nREIMAGINED.',
      subtitle: 'A considered edit of bags, footwear, headwear and more—styled for the woman who arrives with intention.',
      cta: 'Shop Now',
      href: '/best-sellers',
      image: '/images/hero-1.jpg',
      alt: 'Woman in a burgundy coat carrying shopping bags',
    },
    {
      id: 'bags',
      title: 'THE PERFECT\nFINISH.',
      subtitle: 'Handbags that complete every look—quiet luxury for day, soft drama for evening.',
      cta: 'Shop Now',
      href: '/shop/bags',
      image: '/images/prod-handbag.jpg',
      alt: 'Warm orange woven handbag with a top handle',
    },
    {
      id: 'shoes',
      title: 'STEP OUT.\nSTAND APART.',
      subtitle: 'Heels, slides and everyday pairs made for work, owambe and the weekend in between.',
      cta: 'Shop Now',
      href: '/shop/shoes',
      image: '/images/cat-shoes.jpg',
      alt: 'Floral pointed-toe heels on a pale blue set',
    },
    {
      id: 'clothing',
      title: 'MAKE EVERY\nENTRANCE\nUNFORGETTABLE.',
      subtitle: 'Dresses and occasion pieces designed to hold the room—and the moment.',
      cta: 'Shop Now',
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

  const [bestSellers, newArrivals, featuredProducts, featuredCategories, store] = await Promise.all([
    getCuratedProducts({ bestSeller: true, limit: bestLimit }),
    getCuratedProducts({ newArrival: true, limit: newLimit }),
    getCuratedProducts({ featured: true, limit: bestLimit }),
    listActiveCategories({ featuredOnly: true }),
    getStoreSettings(),
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
    store,
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
