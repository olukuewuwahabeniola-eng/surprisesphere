import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ListingFilters from '../components/ListingFilters';
import ProductCard from '../components/ProductCard';
import {
  getBestSellers,
  getCategories,
  getCategoryShop,
  getNewArrivals,
  getShop,
  readError,
} from '../services/api';

const loaders = {
  'best-sellers': getBestSellers,
  'new-arrivals': getNewArrivals,
  shop: getShop,
};

const PAGE_SIZE = 24;

export default function ProductListingPage({ mode }) {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const queryKey = searchParams.toString();
  const filterQuery = useMemo(() => {
    const params = new URLSearchParams(queryKey);
    const next = {
      sort: params.get('sort') || 'newest',
      pageSize: PAGE_SIZE,
    };
    ['category', 'minPrice', 'maxPrice', 'size', 'colour'].forEach((key) => {
      const value = params.get(key);
      if (value) {
        next[key] = value;
      }
    });
    return next;
  }, [queryKey]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setStatus('loading');
      setError('');
      setProducts([]);
      setPagination(null);
      try {
        const request = { ...filterQuery, page: 1 };
        const [listing, categoryData] = await Promise.all([
          mode === 'category' ? getCategoryShop(slug, request) : loaders[mode](request),
          getCategories().catch(() => ({ categories: [] })),
        ]);
        if (!alive) {
          return;
        }
        setPayload(listing);
        setProducts(listing.products || []);
        setPagination(listing.pagination || null);
        setCategories(categoryData.categories || []);
        setStatus('ready');
      } catch (err) {
        if (!alive) {
          return;
        }
        setPayload(null);
        setProducts([]);
        setPagination(null);
        setError(readError(err, 'This listing could not be loaded.'));
        setStatus('error');
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [mode, slug, filterQuery]);

  async function loadMore() {
    if (!pagination?.hasMore || loadingMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const request = { ...filterQuery, page: pagination.page + 1 };
      const listing =
        mode === 'category' ? await getCategoryShop(slug, request) : await loaders[mode](request);
      setProducts((current) => {
        const seen = new Set(current.map((product) => product.id));
        const incoming = (listing.products || []).filter((product) => !seen.has(product.id));
        return [...current, ...incoming];
      });
      setPagination(listing.pagination || null);
    } catch (err) {
      setError(readError(err, 'More products could not be loaded.'));
    } finally {
      setLoadingMore(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="container listing-page" aria-live="polite">
        <p>Loading the list…</p>
        <div className="skeleton-row">
          <span className="skeleton" />
          <span className="skeleton" />
          <span className="skeleton" />
          <span className="skeleton" />
        </div>
      </div>
    );
  }

  if (status === 'error' && products.length === 0) {
    return (
      <div className="container listing-page">
        <p className="eyebrow">Shop</p>
        <h1>Listing unavailable</h1>
        <p>{error}</p>
        <Link className="button button-wine" to="/">
          Back to the homepage
        </Link>
      </div>
    );
  }

  const showCategoryFilter = mode !== 'category';
  const total = pagination?.total ?? products.length;
  const shown = products.length;

  return (
    <div className="listing-page">
      <div className="container">
        <p className="eyebrow">Shop</p>
        <div className="listing-head">
          <div>
            <h1>{payload?.title}</h1>
            <p>{payload?.description}</p>
          </div>
          <Link className="text-button" to="/">
            ← Back home
          </Link>
        </div>

        <ListingFilters
          categories={categories.filter((category) => !category.isGroup)}
          showCategoryFilter={showCategoryFilter}
          resultCount={total}
          shownCount={shown}
        />

        {products.length === 0 ? (
          <div className="listing-empty">
            <h2>No pieces listed here yet</h2>
            <p>
              This page can hold the full matching collection. Nothing has been invented to fill it. When
              more Best Sellers, New Arrivals or category products are published, they will appear here.
            </p>
            <Link className="button button-wine" to="/">
              Return to the homepage
            </Link>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="listing-more">
              <p>
                Showing {shown} of {total}
                {pagination?.hasFixedQuota === false ? ' matching pieces' : ' pieces'}
              </p>
              {pagination?.hasMore ? (
                <button
                  type="button"
                  className="button button-wine"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              ) : (
                <p className="listing-complete">You have reached the end of this list.</p>
              )}
              {error && (
                <p className="form-note" role="status">
                  {error}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
