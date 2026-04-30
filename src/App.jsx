import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import BoxesPage from './pages/BoxesPage';
import BoxDetailPage from './pages/BoxDetailPage';
import BuildBoxPage from './pages/BuildBoxPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import SubscribePage from './pages/SubscribePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import ProfilePage from './pages/dashboard/ProfilePage';
import OrdersPage from './pages/dashboard/OrdersPage';
import SubscriptionsPage from './pages/dashboard/SubscriptionsPage';
import AdminLayout from './pages/admin/AdminLayout';

function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
      <Route path="/boxes" element={<AppLayout><BoxesPage /></AppLayout>} />
      <Route path="/boxes/:id" element={<AppLayout><BoxDetailPage /></AppLayout>} />
      <Route path="/build-box" element={<AppLayout><BuildBoxPage /></AppLayout>} />
      <Route path="/cart" element={<AppLayout><CartPage /></AppLayout>} />
      <Route path="/checkout" element={<AppLayout><CheckoutPage /></AppLayout>} />
      <Route path="/order-confirmation" element={<AppLayout><OrderConfirmationPage /></AppLayout>} />
      <Route path="/subscribe" element={<AppLayout><SubscribePage /></AppLayout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<AppLayout><DashboardLayout /></AppLayout>}>
        <Route index element={<ProfilePage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
      </Route>
      <Route path="/admin/*" element={<AdminLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <AppRoutes />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
                  success: { iconTheme: { primary: '#f79408', secondary: '#fff' } },
                }}
              />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}