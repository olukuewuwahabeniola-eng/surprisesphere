import { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { formatNaira } from '../utils/money';

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19.2 5.8 13a3.6 3.6 0 0 1 5.1-5.1L12 9l1.1-1.1a3.6 3.6 0 0 1 5.1 5.1L12 19.2Z" />
    </svg>
  );
}

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isWished } = useShop();
  const [added, setAdded] = useState(false);
  const wished = isWished(product.id);

  return (
    <article className="product-card" id={`product-${product.id}`}>
      <div className="product-media">
        <img src={product.image} alt={product.alt} />
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
        <p className="product-price">{formatNaira(product.price)}</p>
        <button
          type="button"
          className="button button-wine button-block"
          onClick={() => {
            addToCart(product);
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1200);
          }}
        >
          {added ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
