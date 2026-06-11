import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Package, ChefHat, User, LogOut, Settings, LayoutDashboard, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith('ar') ?? false; // language is undefined during async init
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(isAr ? 'en' : 'ar');
  };

  const navLinks = [
    { to: '/boxes',     label: t('nav.mealBoxes') },
    { to: '/build-box', label: t('nav.buildMyBox') },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Boxify Logo" className="w-14 h-14 object-contain group-hover:scale-105 transition-transform" />
            <span className="font-display text-xl font-bold text-gray-900">Boxify</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isActive ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
              }>
                {t('nav.admin')}
              </NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* ── Language Toggle Button ── */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLanguage}
              title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-brand-400 hover:text-brand-600 text-gray-600 text-sm font-semibold transition-all duration-200 hover:shadow-sm active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {user && (
              <Link to="/cart" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">{user.name?.split(' ')[0]}</span>
                </button>

                {userMenuOpen && (
                  <div className={`absolute ${isAr ? 'left-0' : 'right-0'} mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fade-in`}>
                    <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="w-4 h-4" /> {t('nav.myDashboard')}
                    </Link>
                    <Link to="/dashboard/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Package className="w-4 h-4" /> {t('nav.myOrders')}
                    </Link>
                    <Link to="/dashboard/subscriptions" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <ChefHat className="w-4 h-4" /> {t('nav.subscriptions')}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50">
                        <LayoutDashboard className="w-4 h-4" /> {t('nav.adminPanel')}
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                        <LogOut className="w-4 h-4" /> {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-secondary !py-2 !px-4 text-sm">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">{t('nav.getStarted')}</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-xl hover:bg-gray-100">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-1 pt-3 animate-fade-in">
            <div className="flex flex-col gap-0">
              {navLinks.map(link => (
                <NavLink key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `px-4 py-2 rounded-xl text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  {link.label}
                </NavLink>
              ))}
              {!user && (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary mt-2 text-center text-sm">{t('nav.login')}</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary mt-1 text-center text-sm">{t('nav.getStarted')}</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </nav>
  );
}
