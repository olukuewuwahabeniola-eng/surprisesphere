import { useEffect, useMemo, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { formatNaira } from '../utils/money';
import {
  getAvailableColours,
  getAvailableSizes,
  resolveProductSelection,
} from '../utils/productOptions';

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19.2 5.8 13a3.6 3.6 0 0 1 5.1-5.1L12 9l1.1-1.1a3.6 3.6 0 0 1 5.1 5.1L12 19.2Z" />
    </svg>
  );
}

function resolveHoverImage(product, primaryImage) {
  const gallery = Array.isArray(product?.images)
    ? product.images.map((entry) => (typeof entry === 'string' ? entry : entry?.url)).filter(Boolean)
    : [];
  const fromGallery = gallery.find((url) => url && url !== primaryImage);
  if (fromGallery) {
    return fromGallery;
  }

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const fromVariant = variants
    .map((variant) => variant?.image)
    .find((url) => url && url !== primaryImage);
  return fromVariant || '';
}

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, toggleWishlist, isWished, setCartOpen } = useShop();
  const [added, setAdded] = useState(false);
  const [note, setNote] = useState('');

  const sizes = useMemo(() => getAvailableSizes(product), [product]);
  const [size, setSize] = useState(sizes[0] || '');
  const colours = useMemo(() => getAvailableColours(product, size), [product, size]);
  const [colour, setColour] = useState(colours[0] || '');

  useEffect(() => {
    setSize(sizes[0] || '');
  }, [product.id, sizes]);

  useEffect(() => {
    if (!colours.includes(colour)) {
      setColour(colours[0] || '');
    }
  }, [colours, colour]);

  const selection = useMemo(
    () => resolveProductSelection(product, { size, colour }),
    [product, size, colour],
  );

  const wished = isWished(product.id);
  const displayImage = selection.image || product.image;
  const hoverImage = useMemo(
    () => resolveHoverImage(product, displayImage),
    [product, displayImage],
  );

  function handleAdd() {
    if (sizes.length > 0 && !size) {
      setNote('Choose a size first.');
      return;
    }
    if (colours.length > 0 && !colour) {
      setNote('Choose a colour first.');
      return;
    }
    setNote('');
    addToCart(product, {
      size: selection.size,
      colour: selection.colour,
      price: selection.price,
      image: displayImage,
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
        <img className="product-image is-primary" src={displayImage} alt={product.alt} />
        {hoverImage ? (
          <img className="product-image is-secondary" src={hoverImage} alt="" aria-hidden="true" />
        ) : null}
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
        <h3>{product.name}</h3>
        <p className="product-price">{formatNaira(selection.price)}</p>

        {(sizes.length > 0 || colours.length > 0) && (
          <div className="product-options">
            {sizes.length > 0 && (
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
            )}
            {colours.length > 0 && (
              <label>
                <span className="sr-only">Colour for {product.name}</span>
                <select value={colour} onChange={(event) => setColour(event.target.value)}>
                  {colours.map((entry) => (
                    <option key={entry} value={entry}>
                      Colour: {entry}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        {note && <p className="product-option-note">{note}</p>}

        <button
          type="button"
          className="button button-wine button-block button-rect"
          onClick={handleAdd}
        >
          {added ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
