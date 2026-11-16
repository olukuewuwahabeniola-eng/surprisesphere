import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompactProductRating } from './StarRating';
import { useShop } from '../context/ShopContext';
import { formatNaira } from '../utils/money';
import {
  getAvailableSizes,
  getColourOptions,
  getImagesForColour,
  getSelectionStock,
  isSelectionPurchasable,
  resolveProductSelection,
} from '../utils/productOptions';

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19.2 5.8 13a3.6 3.6 0 0 1 5.1-5.1L12 9l1.1-1.1a3.6 3.6 0 0 1 5.1 5.1L12 19.2Z" />
    </svg>
  );
}

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, toggleWishlist, isWished, setCartOpen } = useShop();
  const [added, setAdded] = useState(false);
  const [note, setNote] = useState('');

  const colourOptions = useMemo(
    () => getColourOptions(product).filter((entry) => entry.available !== false),
    [product],
  );
  const [colour, setColour] = useState(colourOptions[0]?.label || '');
  const sizes = useMemo(() => getAvailableSizes(product, colour), [product, colour]);
  const [size, setSize] = useState(sizes[0] || '');

  useEffect(() => {
    if (!colourOptions.some((entry) => entry.label === colour)) {
      setColour(colourOptions[0]?.label || '');
    }
  }, [colourOptions, colour]);

  useEffect(() => {
    if (!sizes.includes(size)) {
      setSize(sizes[0] || '');
    }
  }, [sizes, size]);

  const selection = useMemo(
    () => resolveProductSelection(product, { size, colour }),
    [product, size, colour],
  );

  const colourImages = useMemo(() => getImagesForColour(product, colour), [product, colour]);
  const displayImage = selection.image || colourImages[0] || product.image;
  const hoverImage = colourImages.find((url) => url && url !== displayImage) || '';
  const inStock = isSelectionPurchasable(product, {
    size: selection.size,
    colour: selection.colour,
  });
  const selectionStock = getSelectionStock(product, {
    size: selection.size,
    colour: selection.colour,
  });

  const wished = isWished(product.id);

  function handleAdd() {
    if (sizes.length > 0 && !size) {
      setNote('Choose a size first.');
      return;
    }
    if (colourOptions.length > 0 && !colour) {
      setNote('Choose a colour first.');
      return;
    }
    if (!inStock) {
      setNote('That option is unavailable.');
      return;
    }
    setNote('');
    addToCart(product, {
      size: selection.size,
      colour: selection.colour,
      price: selection.price,
      image: displayImage,
      maxStock: selectionStock,
    });
    setAdded(true);
    setCartOpen(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article
      className={`product-card${hoverImage ? ' has-hover-swap' : ''}`}
      id={`product-${product.id}`}
      data-reveal
      style={{ '--reveal-delay': `${Math.min(index, 10) * 55}ms` }}
    >
      <div className={`product-media${hoverImage ? ' has-hover-swap' : ''}`}>
        <Link to={`/product/${product.slug || product.id}`} className="product-media-link">
          <img
            className="product-image is-primary"
            src={displayImage}
            alt={product.alt}
            loading={index < 4 ? 'eager' : 'lazy'}
            decoding="async"
          />
          {hoverImage ? (
            <img
              className="product-image is-secondary"
              src={hoverImage}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </Link>
        <button
          type="button"
          className={wished ? 'wish is-on' : 'wish'}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name}`}
          onClick={() => toggleWishlist(product)}
        >
          <HeartIcon />
        </button>
      </div>
      <div className="product-body">
        <h3>
          <Link to={`/product/${product.slug || product.id}`}>{product.name}</Link>
        </h3>
        <CompactProductRating
          average={product.ratingAverage || product.rating?.average || 0}
          count={product.ratingCount || product.rating?.count || 0}
        />
        <p className="product-price">{formatNaira(selection.price)}</p>

        <div className="product-option-stack">
          {colourOptions.length > 0 ? (
            <div className="product-options">
              <label>
                <span className="sr-only">Colour for {product.name}</span>
                <select value={colour} onChange={(event) => setColour(event.target.value)}>
                  {colourOptions.map((entry) => (
                    <option key={entry.label} value={entry.label}>
                      Colour: {entry.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {sizes.length > 0 ? (
            <div className="product-options">
              <label>
                <span className="sr-only">Size for {product.name}</span>
                <select value={size} onChange={(event) => setSize(event.target.value)}>
                  {sizes.map((entry) => (
                    <option key={entry} value={entry}>
                      Size: {entry}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>

        {note && <p className="product-option-note">{note}</p>}

        <button
          type="button"
          className="button button-wine button-block button-rect"
          onClick={handleAdd}
          disabled={!inStock}
        >
          {added ? 'Added' : inStock ? 'Add to Cart' : 'Unavailable'}
        </button>
      </div>
    </article>
  );
}
