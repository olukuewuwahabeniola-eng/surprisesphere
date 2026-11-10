import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ContactPage from './pages/ContactPage';
import HomePage from './pages/HomePage';
import InfoPage from './pages/InfoPage';
import ProductListingPage from './pages/ProductListingPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/best-sellers" element={<ProductListingPage mode="best-sellers" />} />
        <Route path="/new-arrivals" element={<ProductListingPage mode="new-arrivals" />} />
        <Route path="/shop" element={<ProductListingPage mode="shop" />} />
        <Route path="/shop/:slug" element={<ProductListingPage mode="category" />} />
        <Route path="/about" element={<InfoPage slug="about" />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help/:slug" element={<InfoPage />} />
        <Route path="*" element={<InfoPage slug="missing" />} />
      </Routes>
    </Layout>
  );
}
