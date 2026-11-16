import { SURPRISE_IMAGE_LIBRARY } from '../data/surpriseImageLibrary.js';
import { getAdminHomepageContent, updateAdminHeroSlides } from '../services/homepageService.js';
import { assertMongoReady } from '../utils/assertMongo.js';

export async function getAdminHomepageHandler(_req, res) {
  await assertMongoReady('MongoDB must be connected to manage homepage content.');
  const result = await getAdminHomepageContent();
  res.json({
    title: 'Homepage content',
    imageLibrary: SURPRISE_IMAGE_LIBRARY,
    ...result,
  });
}

export async function getHeroImageLibraryHandler(_req, res) {
  await assertMongoReady('MongoDB must be connected to load the hero image library.');
  res.json({
    title: 'Hero image library',
    images: SURPRISE_IMAGE_LIBRARY,
    note: 'These images come from the project fashion library. Product uploads do not appear here automatically.',
    source: 'local-library',
  });
}

export async function putAdminHeroSlidesHandler(req, res) {
  await assertMongoReady('MongoDB must be connected to manage hero slides.');
  const slides = Array.isArray(req.body?.heroSlides)
    ? req.body.heroSlides
    : Array.isArray(req.body?.slides)
      ? req.body.slides
      : Array.isArray(req.body)
        ? req.body
        : null;

  if (!slides) {
    res.status(400).json({ message: 'Send a heroSlides array.' });
    return;
  }

  const result = await updateAdminHeroSlides(slides);
  res.json(result);
}
