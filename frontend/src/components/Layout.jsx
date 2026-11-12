import { useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import useScrollReveal from '../hooks/useScrollReveal';
import AnnouncementBar from './AnnouncementBar';
import Drawers from './Drawers';
import Footer from './Footer';
import Header from './Header';

export default function Layout({ children }) {
  const { catalog } = useShop();
  const location = useLocation();
  useScrollReveal();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AnnouncementBar message={catalog?.announcement} />
      <Header />
      <main id="main" key={location.pathname} className="page-shell">
        {children}
      </main>
      <Footer />
      <Drawers />
    </>
  );
}
