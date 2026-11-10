import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CategoryRow from '../components/CategoryRow';
import Hero from '../components/Hero';
import PromoBanners from '../components/PromoBanners';
import ProductSection from '../components/ProductSection';
import { useShop } from '../context/ShopContext';

export default function HomePage() {
  const { catalog, status, loadCatalog } = useShop();
  const location = useLocation();

  useEffect(() => {
    if (status !== 'ready' || !location.hash) {
      return;
    }
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [status, location.hash]);

  if (status === 'loading') {
    return (
      <div className="container home-state" aria-live="polite">
        <p>Loading the shop…</p>
        <div className="skeleton hero-skeleton" />
        <div className="skeleton-row">
          <span className="skeleton" />
          <span className="skeleton" />
          <span className="skeleton" />
          <span className="skeleton" />
        </div>
      </div>
    );
  }

  if (status === 'error' || !catalog) {
    return (
      <div className="container home-state">
        <h1>The shop could not be loaded</h1>
        <p>The homepage catalogue comes from the Surprise Fashion Sphere API. Start the backend, then try again.</p>
        <button type="button" className="button button-wine" onClick={loadCatalog}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <Hero slides={catalog.heroSlides} />
      <CategoryRow categories={catalog.categories} />
      <ProductSection
        id="best-sellers"
        title="Best Sellers"
        products={catalog.bestSellers}
        viewAllTo="/best-sellers"
      />
      <ProductSection
        id="new-arrivals"
        title="New Arrivals"
        products={catalog.newArrivals}
        viewAllTo="/new-arrivals"
      />
      <PromoBanners promos={catalog.promos} />
    </>
  );
}
