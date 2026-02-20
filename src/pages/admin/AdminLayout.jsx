import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Outlet, Routes, Route } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { LayoutDashboard, Package, Repeat, Users, ChefHat, BarChart3, RefreshCw } from 'lucide-react';

const statusOptions = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'paid', 'cancelled'];

function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-2xl" />;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Orders', value: stats?.totalOrders, color: 'from-blue-500 to-blue-600', icon: Package },
        { label: 'Revenue', value: `${stats?.totalRevenue?.toLocaleString()} EGP`, color: 'from-brand-400 to-brand-600', icon: BarChart3 },
        { label: 'Active Subscriptions', value: stats?.activeSubscriptions, color: 'from-green-500 to-green-600', icon: Repeat },
        { label: 'Total Users', value: stats?.totalUsers, color: 'from-purple-500 to-purple-600', icon: Users },
      ].map(({ label, value, color, icon: Icon }) => (
        <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white`}>
          <Icon className="w-6 h-6 opacity-80 mb-3" />
          <div className="text-2xl font-display font-black">{value ?? '—'}</div>
          <div className="text-sm opacity-80 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/orders').then(({ data }) => setOrders(data)).finally(() => setLoading(false)); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-4">All Orders ({orders.length})</h2>
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order._id} className="card p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-bold text-gray-900">{order.orderNumber}</div>
                <div className="text-sm text-gray-500">{order.userId?.name} · {order.userId?.email}</div>
                <div className="text-sm text-brand-600 font-medium mt-0.5">{order.totalPrice?.toLocaleString()} EGP</div>
              </div>
              <select
                value={order.status}
                onChange={e => updateStatus(order._id, e.target.value)}
                className="input-field !w-auto !py-2 !px-3 text-sm"
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');
  useEffect(() => { api.get('/admin/subscriptions').then(({ data }) => setSubs(data)).finally(() => setLoading(false)); }, []);

  const manualGenerate = async (id) => {
    setGenerating(id);
    try {
      await api.post(`/admin/subscriptions/${id}/generate`);
      toast.success('Order generated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setGenerating(''); }
  };

  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-4">All Subscriptions ({subs.length})</h2>
      <div className="space-y-3">
        {subs.map(sub => (
          <div key={sub._id} className="card p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-bold text-gray-900">{sub.userId?.name}</div>
                <div className="text-sm text-gray-500">{sub.frequency} · {sub.deliveryDay} · {sub.servingsPerMeal} people</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${sub.status === 'active' ? 'badge-green' : sub.status === 'paused' ? 'badge-orange' : 'badge-red'}`}>{sub.status}</span>
                  <span className="text-sm font-medium text-brand-600">{sub.fixedPricePerDelivery?.toLocaleString()} EGP/delivery</span>
                </div>
              </div>
              {sub.status === 'active' && (
                <button onClick={() => manualGenerate(sub._id)} disabled={generating === sub._id} className="btn-outline !py-2 !px-4 text-sm flex items-center gap-2">
                  <RefreshCw className={`w-3.5 h-3.5 ${generating === sub._id ? 'animate-spin' : ''}`} />
                  Generate Order
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/users').then(({ data }) => setUsers(data)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-4">All Users ({users.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {users.map(u => (
          <div key={u._id} className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-300 to-brand-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">{u.name?.[0]}</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{u.name}</div>
              <div className="text-sm text-gray-500">{u.email}</div>
              <span className={`badge mt-1 ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>{u.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Package },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: Repeat },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isAdmin) navigate('/');
  }, [user, isAdmin]);

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white">
        <div className="page-container">
          <div className="flex items-center gap-4 py-4">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-display text-xl font-bold">Boxify Admin</h1>
            <nav className="ml-6 flex gap-1">
              {adminNav.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`
                }>
                  <Icon className="w-4 h-4" /> {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="page-container py-8 space-y-8">
        <Routes>
          <Route index element={<><AdminStats /></>} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="users" element={<AdminUsers />} />
        </Routes>
      </div>
    </div>
  );
}
