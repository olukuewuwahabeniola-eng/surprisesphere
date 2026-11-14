import { Outlet, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import useScrollReveal from '../hooks/useScrollReveal';
import { trackPageView } from '../utils/analytics';
import { useEffect, useRef } from 'react';
import AnnouncementBar from './AnnouncementBar';
import Drawers from './Drawers';
import Footer from './Footer';
import Header from './Header';

export default function Layout({ children }) {
  const { catalog } = useShop();
  const location = useLocation();
  const lastPath = useRef('');
  useScrollReveal();

  useEffect(() => {
    const path = location.pathname + location.search;
    if (lastPath.current === path) {
      return;
    }
    lastPath.current = path;
    trackPageView(path);
  }, [location.pathname, location.search]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AnnouncementBar message={catalog?.announcement} />
      <Header />
      <main id="main" key={location.pathname} className="page-shell">
        {children ?? <Outlet />}
      </main>
      <Footer />
      <Drawers />
    </>
  );
}
