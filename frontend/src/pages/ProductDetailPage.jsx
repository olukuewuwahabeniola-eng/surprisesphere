import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductReviews from '../components/ProductReviews';
import StarRating, { formatRatingAverage } from '../components/StarRating';
import TestimonialGallery from '../components/TestimonialGallery';
import { useShop } from '../context/ShopContext';
import {
  getProduct,
  getProductReviews,
  getReviewPhotos,
  readError,
} from '../services/api';
import { formatNaira } from '../utils/money';
import {
  colourSwatchHex,
  getAvailableColours,
  getAvailableSizes,
  getColourOptions,
  getImagesForColour,
  getSelectionStock,
  isSelectionPurchasable,
  resolveProductSelection,
} from '../utils/productOptions';
import { trackWhatsAppEnquiry } from '../utils/analytics';
import { buildWhatsAppProductOrderUrl } from '../utils/whatsappOrder';

function galleryFromProduct(product, colour = '') {
  const colourImages = getImagesForColour(product, colour).map((url) => ({
    url,
    alt: colour ? `${product?.name || ''} — ${colour}` : product?.name || '',
  }));
  if (colourImages.length) {
    return colourImages;
  }
  const images = Array.isArray(product?.images)
    ? product.images
        .map((entry) => (typeof entry === 'string' ? { url: entry, alt: product.name } : entry))
        .filter((entry) => entry?.url)
    : [];
  if (images.length) {
    return images;
  }
  if (product?.image) {
    return [{ url: product.image, alt: product.alt || product.name }];
  }
  return [];
}

export default function ProductDetailPage() {
  const { idOrSlug } = useParams();
  const { addToCart, setCartOpen, store, toggleWishlist, isWished } = useShop();

  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ average: 0, count: 0, distribution: {} });
  const [photos, setPhotos] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [added, setAdded] = useState(false);

  const colourOptions = useMemo(() => getColourOptions(product), [product]);
  const [colour, setColour] = useState('');
  const [size, setSize] = useState('');
  const colours = useMemo(() => getAvailableColours(product), [product]);
  const sizes = useMemo(() => getAvailableSizes(product, colour), [product, colour]);
  const gallery = useMemo(() => galleryFromProduct(product, colour), [product, colour]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      setError('');
      try {
        const productData = await getProduct(idOrSlug);
        const nextProduct = productData.product || productData;
        if (!nextProduct?.id) {
          throw new Error('Product missing');
        }

        const [reviewData, photoData] = await Promise.all([
          getProductReviews(nextProduct.slug || nextProduct.id, { pageSize: 50 }).catch(() => null),
          getReviewPhotos({
            placement: 'product',
            productId: nextProduct.id,
            pageSize: 24,
          }).catch(() => ({ photos: [] })),
        ]);

        if (cancelled) {
          return;
        }

        setProduct(nextProduct);
        setReviews(reviewData?.reviews || []);
        setSummary(
          reviewData?.summary || {
            average: nextProduct.ratingAverage || 0,
            count: nextProduct.ratingCount || 0,
            distribution: {},
          },
        );
        setPhotos(photoData?.photos || []);
        setActiveImage(0);
        setQty(1);
        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setError(readError(err, 'This product could not be loaded.'));
          setStatus('error');
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  useEffect(() => {
    if (!colours.includes(colour)) {
      setColour(colours[0] || '');
    }
  }, [colours, colour]);

  useEffect(() => {
    if (!sizes.includes(size)) {
      setSize(sizes[0] || '');
    }
  }, [sizes, size]);

  useEffect(() => {
    setActiveImage(0);
  }, [colour, product?.id]);

  const selection = useMemo(() => {
    if (!product) {
      return { size: '', colour: '', price: 0, image: '', stock: null, available: false };
    }
    return resolveProductSelection(product, { size, colour });
  }, [product, size, colour]);

  useEffect(() => {
    const stock = getSelectionStock(product, { size, colour });
    if (stock != null && Number.isFinite(stock) && stock > 0) {
      setQty((current) => Math.min(current, stock));
    }
  }, [product, size, colour]);

  if (status === 'loading') {
    return (
      <div className="container product-detail-state" aria-live="polite">
        <p>Loading product…</p>
        <div className="skeleton product-detail-skeleton" />
      </div>
    );
  }

  if (status === 'error' || !product) {
    return (
      <div className="container product-detail-state">
        <h1>Product unavailable</h1>
        <p>{error || 'This piece could not be found.'}</p>
        <Link className="button button-wine" to="/shop">
          Back to shop
        </Link>
      </div>
    );
  }

  const safeIndex = Math.min(activeImage, Math.max(gallery.length - 1, 0));
  const displayImage =
    gallery[safeIndex]?.url || selection.image || product.image || '';
  const compareAt = Number(product.compareAtPrice || product.originalPrice || 0);
  const hasDiscount = Number.isFinite(compareAt) && compareAt > Number(selection.price || 0);
  const discountPercent = hasDiscount
    ? Math.round(((compareAt - selection.price) / compareAt) * 100)
    : 0;
  const selectionStock = getSelectionStock(product, { size: selection.size, colour: selection.colour });
  const inStock = isSelectionPurchasable(product, {
    size: selection.size,
    colour: selection.colour,
  });
  const maxQty =
    selectionStock != null && Number.isFinite(selectionStock)
      ? Math.max(1, selectionStock)
      : null;
  const wished = isWished(product.id);

  const whatsappUrl = buildWhatsAppProductOrderUrl(store?.whatsappNumber, {
    id: product.id,
    name: product.name,
    price: selection.price,
    qty,
    size: selection.size,
    colour: selection.colour,
    image: displayImage,
  });

  function handleAdd() {
    if (sizes.length > 0 && !size) {
      setNote('Choose a size first.');
      return;
    }
    if (colours.length > 0 && !colour) {
      setNote('Choose a colour first.');
      return;
    }
    if (!inStock) {
      setNote('That colour/size combination is unavailable.');
      return;
    }
    setNote('');
    addToCart(product, {
      size: selection.size,
      colour: selection.colour,
      price: selection.price,
      image: displayImage,
      qty: maxQty != null ? Math.min(qty, maxQty) : qty,
      maxStock: selectionStock,
    });
    setAdded(true);
    setCartOpen(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  async function refreshReviews() {
    try {
      const reviewData = await getProductReviews(product.slug || product.id, { pageSize: 50 });
      setReviews(reviewData.reviews || []);
      setSummary(reviewData.summary || summary);
    } catch {
      // Keep existing approved reviews if refresh fails after submit.
    }
  }

  return (
    <article className="product-detail-page">
      <div className="container">
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          {product.category ? (
            <>
              <span>/</span>
              <Link to={`/shop/${product.category}`}>{product.categoryLabel || product.category}</Link>
            </>
          ) : null}
          <span>/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product-detail-layout">
          <div className="product-gallery">
            <div className="product-gallery-main">
              <img src={displayImage} alt={gallery[safeIndex]?.alt || product.alt || product.name} />
            </div>
            {gallery.length > 1 && (
              <div className="product-gallery-thumbs" role="list">
                {gallery.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    className={index === activeImage ? 'is-active' : undefined}
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <p className="eyebrow">{product.categoryLabel || 'Surprise Fashion Sphere'}</p>
            <h1>{product.name}</h1>

            {(summary.count > 0 || product.ratingCount > 0) && (
              <div className="product-detail-rating">
                <StarRating value={summary.average || product.ratingAverage || 0} />
                <a href="#customer-reviews-title">
                  {formatRatingAverage(summary.average || product.ratingAverage || 0)} ·{' '}
                  {summary.count || product.ratingCount || 0} review
                  {(summary.count || product.ratingCount || 0) === 1 ? '' : 's'}
                </a>
              </div>
            )}

            <div className="product-detail-price">
              <strong>{formatNaira(selection.price)}</strong>
              {hasDiscount ? (
                <>
                  <span className="product-detail-compare">{formatNaira(compareAt)}</span>
                  <span className="product-detail-discount">-{discountPercent}%</span>
                </>
              ) : null}
            </div>

            {product.description ? <p className="product-detail-copy">{product.description}</p> : null}

            {(sizes.length > 0 || colours.length > 0) && (
              <div className="product-detail-options">
                {sizes.length > 0 && (
                  <fieldset>
                    <legend>Size</legend>
                    <div className="option-chip-row">
                      {sizes.map((entry) => (
                        <button
                          key={entry}
                          type="button"
                          className={size === entry ? 'option-chip is-active' : 'option-chip'}
                          onClick={() => setSize(entry)}
                        >
                          {entry}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                {colours.length > 0 && (
                  <fieldset>
                    <legend>Colour{colour ? `: ${colour}` : ''}</legend>
                    <div className="product-swatches product-swatches-lg" role="listbox" aria-label="Available colours">
                      {colours.map((entry) => {
                        const option = colourOptions.find((item) => item.label === entry);
                        return (
                          <button
                            key={entry}
                            type="button"
                            role="option"
                            aria-selected={colour === entry}
                            className={`product-swatch${colour === entry ? ' is-selected' : ''}`}
                            title={entry}
                            style={{ background: colourSwatchHex(entry, option?.hex) }}
                            onClick={() => setColour(entry)}
                          >
                            <span className="sr-only">{entry}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="option-chip-row">
                      {colours.map((entry) => (
                        <button
                          key={`chip-${entry}`}
                          type="button"
                          className={colour === entry ? 'option-chip is-active' : 'option-chip'}
                          onClick={() => setColour(entry)}
                        >
                          {entry}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
              </div>
            )}

            <div className="product-detail-qty">
              <span>Quantity</span>
              <div className="qty product-qty">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                  disabled={!inStock}
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() =>
                    setQty((current) =>
                      maxQty != null ? Math.min(maxQty, current + 1) : current + 1,
                    )
                  }
                  disabled={!inStock || (maxQty != null && qty >= maxQty)}
                >
                  +
                </button>
              </div>
            </div>

            <p className={inStock ? 'product-stock is-in' : 'product-stock is-out'}>
              {inStock
                ? selectionStock != null && selectionStock > 0
                  ? `${selectionStock} in stock${selection.colour ? ` · ${selection.colour}` : ''}${selection.size ? ` · size ${selection.size}` : ''}`
                  : 'Available to order'
                : 'Currently unavailable'}
            </p>

            {note && <p className="product-option-note">{note}</p>}

            <div className="product-detail-actions">
              <button
                type="button"
                className="button button-wine"
                onClick={handleAdd}
                disabled={!inStock}
              >
                {added ? 'Added to bag' : 'Add to Cart'}
              </button>
              {whatsappUrl && inStock ? (
                <a
                  className="button button-cream"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    trackWhatsAppEnquiry({
                      channel: 'product',
                      items: [
                        {
                          productId: product.id,
                          name: product.name,
                          size: selection.size,
                          colour: selection.colour,
                          price: selection.price,
                          qty,
                          image: displayImage,
                        },
                      ],
                    });
                  }}
                >
                  Order via WhatsApp
                </a>
              ) : (
                <button type="button" className="button button-cream" disabled>
                  {inStock ? 'WhatsApp unavailable' : 'Unavailable'}
                </button>
              )}
              <button
                type="button"
                className={wished ? 'text-button is-wished' : 'text-button'}
                onClick={() => toggleWishlist(product)}
              >
                {wished ? 'Saved to wishlist' : 'Save to wishlist'}
              </button>
            </div>
          </div>
        </div>

        <ProductReviews
          productId={product.id}
          summary={summary}
          reviews={reviews}
          onSubmitted={refreshReviews}
        />

        <TestimonialGallery
          photos={photos}
          title="Customer Moments"
          eyebrow="WhatsApp reviews"
        />
      </div>
    </article>
  );
}
