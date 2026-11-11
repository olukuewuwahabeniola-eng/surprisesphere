import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getHomepage, readError } from '../services/api';

const ShopContext = createContext(null);
const STORAGE_KEY = 'sfs-shop-v1';

function readStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '');
    return {
      cart: Array.isArray(parsed?.cart) ? parsed.cart : [],
      wishlist: Array.isArray(parsed?.wishlist) ? parsed.wishlist : [],
    };
  } catch {
    return { cart: [], wishlist: [] };
  }
}

function snapshot(product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    alt: product.alt,
  };
}

export function ShopProvider({ children }) {
  const [bag, setBag] = useState(readStorage);
  const [catalog, setCatalog] = useState(null);
  const [status, setStatus] = useState('loading');
  const [catalogError, setCatalogError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
  }, [bag]);

  const loadCatalog = useCallback(async () => {
    setStatus('loading');
    setCatalogError('');
    try {
      const data = await getHomepage();
      setCatalog(data);
      setStatus('ready');
    } catch (error) {
      setCatalogError(
        readError(
          error,
          'This shop is not available right now because the catalogue API did not respond.',
        ),
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const products = useMemo(() => {
    if (!catalog) {
      return [];
    }
    return [...catalog.bestSellers, ...catalog.newArrivals];
  }, [catalog]);

  const cartCount = bag.cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = bag.cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function addToCart(product) {
    setBag((current) => {
      const existing = current.cart.find((item) => item.id === product.id);
      const cart = existing
        ? current.cart.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
          )
        : [...current.cart, { ...snapshot(product), qty: 1 }];
      return { ...current, cart };
    });
  }

  function changeQty(id, qty) {
    setBag((current) => ({
      ...current,
      cart:
        qty < 1
          ? current.cart.filter((item) => item.id !== id)
          : current.cart.map((item) => (item.id === id ? { ...item, qty } : item)),
    }));
  }

  function removeFromCart(id) {
    changeQty(id, 0);
  }

  function toggleWishlist(product) {
    setBag((current) => {
      const saved = current.wishlist.some((item) => item.id === product.id);
      return {
        ...current,
        wishlist: saved
          ? current.wishlist.filter((item) => item.id !== product.id)
          : [...current.wishlist, snapshot(product)],
      };
    });
  }

  function isWished(id) {
    return bag.wishlist.some((item) => item.id === id);
  }

  const value = {
    catalog,
    status,
    catalogError,
    products,
    cart: bag.cart,
    wishlist: bag.wishlist,
    cartCount,
    subtotal,
    cartOpen,
    wishOpen,
    accountOpen,
    setCartOpen,
    setWishOpen,
    setAccountOpen,
    loadCatalog,
    addToCart,
    changeQty,
    removeFromCart,
    toggleWishlist,
    isWished,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) {
    throw new Error('useShop must be used within ShopProvider');
  }
  return value;
}
