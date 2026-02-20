import { Link } from 'react-router-dom';
import { Package, Instagram, Twitter, Facebook, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="page-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">Boxify</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Fresh, pre-portioned meal kits delivered to your door. Cook like a chef, waste less, live better.
            </p>
            <div className="flex gap-3">
              {[Instagram, Twitter, Facebook].map((Icon, idx) => (
                <a key={idx} href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/boxes" className="hover:text-brand-400 transition-colors">All Meal Boxes</Link></li>
              <li><Link to="/build-box" className="hover:text-brand-400 transition-colors">Build Custom Box</Link></li>
              <li><Link to="/boxes?category=Mediterranean" className="hover:text-brand-400 transition-colors">Mediterranean</Link></li>
              <li><Link to="/boxes?category=Healthy" className="hover:text-brand-400 transition-colors">Healthy Options</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/dashboard" className="hover:text-brand-400 transition-colors">My Dashboard</Link></li>
              <li><Link to="/dashboard/orders" className="hover:text-brand-400 transition-colors">My Orders</Link></li>
              <li><Link to="/dashboard/subscriptions" className="hover:text-brand-400 transition-colors">Subscriptions</Link></li>
              <li><Link to="/cart" className="hover:text-brand-400 transition-colors">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-400" /> hello@boxify.eg</li>
              <li className="text-gray-400">Cairo, Egypt</li>
              <li className="text-gray-400">Delivery: Sat–Thu</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 Boxify. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
