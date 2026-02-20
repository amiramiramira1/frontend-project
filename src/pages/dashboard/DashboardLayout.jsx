import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Package, Repeat, Settings, LogOut } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Profile', icon: User, end: true },
  { to: '/dashboard/orders', label: 'My Orders', icon: Package },
  { to: '/dashboard/subscriptions', label: 'Subscriptions', icon: Repeat },
];

export default function DashboardLayout() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  if (!user) { navigate('/login'); return null; }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="card p-5 mb-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mb-3">
                  <span className="text-white text-2xl font-bold">{user.name?.[0]?.toUpperCase()}</span>
                </div>
                <h2 className="font-display font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span className={`badge mt-2 ${user.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>{user.role}</span>
              </div>
            </div>
            <nav className="card overflow-hidden">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-600 border-r-4 border-brand-500' : 'text-gray-600 hover:bg-gray-50'}`
                }>
                  <Icon className="w-4 h-4" /> {label}
                </NavLink>
              ))}
              <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors border-t border-gray-100">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className="md:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
