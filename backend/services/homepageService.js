import HomepageContent from '../models/HomepageContent.js';
import {
  activeHeroSlides,
  DEFAULT_HOMEPAGE,
  normalizeHeroSlides,
} from '../utils/homepageDefaults.js';
import { HOMEPAGE_CURATED_COUNT } from '../utils/pagination.js';
import { requireDb } from '../utils/requireDb.js';
import { listActiveCategories } from './categoryService.js';
import { getCuratedProducts } from './productService.js';
import { getStoreSettings } from './storeService.js';

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

function resolveHeroSlides(content) {
  const slides = content.heroSlides?.length ? content.heroSlides : DEFAULT_HOMEPAGE.heroSlides;
  const active = activeHeroSlides(slides);
  return active.length ? active : activeHeroSlides(DEFAULT_HOMEPAGE.heroSlides);
}

export async function getHomepagePayload() {
  requireDb();

  const content = await getOrCreateHomepageContent();
  const bestLimit = content.curatedBestSellerLimit || HOMEPAGE_CURATED_COUNT;
  const newLimit = content.curatedNewArrivalLimit || HOMEPAGE_CURATED_COUNT;

  const [bestSellers, newArrivals, featuredProducts, activeCategories, featuredCategories, store] =
    await Promise.all([
      getCuratedProducts({ bestSeller: true, limit: bestLimit }),
      getCuratedProducts({ newArrival: true, limit: newLimit }),
      getCuratedProducts({ featured: true, limit: bestLimit }),
      listActiveCategories(),
      listActiveCategories({ featuredOnly: true }),
      getStoreSettings(),
    ]);

  const categories = activeCategories.categories || [];
  const heroSlides = resolveHeroSlides(content);

  return {
    announcement: content.announcement,
    heroSlides,
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
    banners: heroSlides,
    store,
    source: 'mongodb',
  };
}

export async function getHomepageBanners() {
  requireDb();
  const content = await getOrCreateHomepageContent();
  const heroSlides = resolveHeroSlides(content);
  return {
    announcement: content.announcement,
    heroSlides,
    promos: content.promos?.length ? content.promos : DEFAULT_HOMEPAGE.promos,
    source: 'mongodb',
  };
}

export async function getAdminHomepageContent() {
  requireDb();
  const content = await getOrCreateHomepageContent();
  return {
    announcement: content.announcement || DEFAULT_HOMEPAGE.announcement,
    heroSlides: normalizeHeroSlides(
      content.heroSlides?.length ? content.heroSlides : DEFAULT_HOMEPAGE.heroSlides,
    ),
    promos: content.promos?.length ? content.promos : DEFAULT_HOMEPAGE.promos,
    curatedBestSellerLimit: content.curatedBestSellerLimit || HOMEPAGE_CURATED_COUNT,
    curatedNewArrivalLimit: content.curatedNewArrivalLimit || HOMEPAGE_CURATED_COUNT,
    source: 'mongodb',
  };
}

export async function updateAdminHeroSlides(rawSlides = []) {
  requireDb();
  const slides = normalizeHeroSlides(rawSlides);
  if (!slides.length) {
    const error = new Error('Provide at least one hero slide with a title and image.');
    error.statusCode = 400;
    throw error;
  }

  const content = await HomepageContent.findOneAndUpdate(
    { key: 'main' },
    {
      $set: { heroSlides: slides },
      $setOnInsert: {
        announcement: DEFAULT_HOMEPAGE.announcement,
        promos: DEFAULT_HOMEPAGE.promos,
        curatedBestSellerLimit: HOMEPAGE_CURATED_COUNT,
        curatedNewArrivalLimit: HOMEPAGE_CURATED_COUNT,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return {
    message: 'Hero slides saved.',
    heroSlides: normalizeHeroSlides(content.heroSlides),
    activeCount: activeHeroSlides(content.heroSlides).length,
    source: 'mongodb',
  };
}
