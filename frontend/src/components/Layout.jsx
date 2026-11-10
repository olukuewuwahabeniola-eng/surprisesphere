import { useShop } from '../context/ShopContext';
import AnnouncementBar from './AnnouncementBar';
import Drawers from './Drawers';
import Footer from './Footer';
import Header from './Header';

export default function Layout({ children }) {
  const { catalog } = useShop();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AnnouncementBar message={catalog?.announcement} />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <Drawers />
    </>
  );
}
