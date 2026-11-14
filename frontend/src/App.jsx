import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import Layout from './components/Layout';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminPlaceholderPage from './pages/AdminPlaceholderPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminReviewsPage from './pages/AdminReviewsPage';
import AdminWhatsAppPage from './pages/AdminWhatsAppPage';
import ContactPage from './pages/ContactPage';
import HomePage from './pages/HomePage';
import InfoPage from './pages/InfoPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductListingPage from './pages/ProductListingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="whatsapp" element={<AdminWhatsAppPage />} />
        <Route path="analytics" element={<AdminDashboardPage analyticsOnly />} />
        <Route path="customers" element={<AdminPlaceholderPage section="customers" />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="promotions" element={<AdminPlaceholderPage section="promotions" />} />
        <Route path="hero-slides" element={<AdminPlaceholderPage section="hero-slides" />} />
        <Route path="settings" element={<AdminPlaceholderPage section="settings" />} />
        <Route path="support" element={<AdminPlaceholderPage section="support" />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/best-sellers" element={<ProductListingPage mode="best-sellers" />} />
        <Route path="/new-arrivals" element={<ProductListingPage mode="new-arrivals" />} />
        <Route path="/shop" element={<ProductListingPage mode="shop" />} />
        <Route path="/shop/:slug" element={<ProductListingPage mode="category" />} />
        <Route path="/product/:idOrSlug" element={<ProductDetailPage />} />
        <Route path="/about" element={<InfoPage slug="about" />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help/:slug" element={<InfoPage />} />
        <Route path="*" element={<InfoPage slug="missing" />} />
      </Route>
    </Routes>
  );
}
