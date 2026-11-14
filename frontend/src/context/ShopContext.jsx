import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getHomepage, getStore, readError } from '../services/api';
import { trackAddToCart } from '../utils/analytics';
import { cartLineKey } from '../utils/whatsappOrder';

const ShopContext = createContext(null);
const STORAGE_KEY = 'sfs-shop-v1';

function readStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '');
    const cart = Array.isArray(parsed?.cart)
      ? parsed.cart.map((item) => ({
          ...item,
          size: item.size || '',
          colour: item.colour || '',
          qty: Math.max(1, Number(item.qty) || 1),
          lineKey: item.lineKey || cartLineKey(item),
        }))
      : [];
    return {
      cart,
      wishlist: Array.isArray(parsed?.wishlist) ? parsed.wishlist : [],
    };
  } catch {
    return { cart: [], wishlist: [] };
  }
}

function snapshot(product, { size = '', colour = '', price, image } = {}) {
  const item = {
    id: product.id,
    name: product.name,
    price: Number.isFinite(Number(price)) ? Number(price) : product.price,
    image: image || product.image,
    alt: product.alt,
    size: size || '',
    colour: colour || '',
  };
  return {
    ...item,
    lineKey: cartLineKey(item),
  };
}

export function ShopProvider({ children }) {
  const [bag, setBag] = useState(readStorage);
  const [catalog, setCatalog] = useState(null);
  const [store, setStore] = useState({ whatsappNumber: '', whatsappConfigured: false });
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
      const [data, storeData] = await Promise.all([
        getHomepage(),
        getStore().catch(() => null),
      ]);
      setCatalog(data);
      const nextStore = data.store || storeData || { whatsappNumber: '', whatsappConfigured: false };
      setStore({
        whatsappNumber: String(nextStore.whatsappNumber || '').replace(/\D/g, ''),
        whatsappConfigured: Boolean(
          nextStore.whatsappConfigured || String(nextStore.whatsappNumber || '').replace(/\D/g, ''),
        ),
      });
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

  function addToCart(product, options = {}) {
    const addQty = Math.max(1, Number(options.qty) || 1);
    const next = snapshot(product, {
      size: options.size || '',
      colour: options.colour || '',
      price: options.price,
      image: options.image,
    });

    setBag((current) => {
      const existing = current.cart.find((item) => item.lineKey === next.lineKey);
      const cart = existing
        ? current.cart.map((item) =>
            item.lineKey === next.lineKey
              ? {
                  ...item,
                  qty: item.qty + addQty,
                  price: next.price,
                  image: next.image,
                }
              : item,
          )
        : [...current.cart, { ...next, qty: addQty }];
      return { ...current, cart };
    });

    trackAddToCart({
      productId: product.id,
      productName: product.name,
      qty: addQty,
      value: Number(next.price) * addQty,
      size: next.size,
      colour: next.colour,
    });
  }

  function changeQty(lineKey, qty) {
    setBag((current) => ({
      ...current,
      cart:
        qty < 1
          ? current.cart.filter((item) => item.lineKey !== lineKey && item.id !== lineKey)
          : current.cart.map((item) =>
              item.lineKey === lineKey || item.id === lineKey ? { ...item, qty } : item,
            ),
    }));
  }

  function removeFromCart(lineKey) {
    changeQty(lineKey, 0);
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
    store,
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
