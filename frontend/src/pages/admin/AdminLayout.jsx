import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { LayoutDashboard, Package, Repeat, Users, BarChart3, RefreshCw, CheckCircle, Clock, Truck, XCircle, ChefHat } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Valid statuses from the Order model enum
const statusOptions = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
const MULTIPLIERS   = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

// ── AdminStats ─────────────────────────────────────────────────────
// GET /api/admin/stats → { stats: { totalOrders, totalRevenue, totalUsers, ordersByStatus, ... } }
function AdminStats() {
  const [stats, setStats] = useState(null);
  const [subStats, setSubStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/subscriptions/stats'),
    ])
      .then(([s, ss]) => { setStats(s.data.stats); setSubStats(ss.data.subscriptionStats); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-2xl" />;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',          value: stats?.totalOrders,                            color: 'from-blue-500 to-blue-600',     icon: Package },
          { label: 'Revenue (Delivered)',   value: `${stats?.totalRevenue?.toLocaleString()} EGP`, color: 'from-brand-400 to-brand-600',   icon: BarChart3 },
          { label: 'Active Subscriptions',  value: subStats?.active,                              color: 'from-green-500 to-green-600',   icon: Repeat },
          { label: 'Total Users',           value: stats?.totalUsers,                             color: 'from-purple-500 to-purple-600', icon: Users },
          { label: 'Active Boxes',          value: stats?.totalBoxes,                             color: 'from-orange-400 to-orange-600', icon: ChefHat },
          { label: 'Total Meals',           value: stats?.totalMeals,                             color: 'from-teal-500 to-teal-600',    icon: Package },
          { label: 'Paused Subscriptions',  value: subStats?.paused,                              color: 'from-yellow-400 to-yellow-600', icon: Repeat },
          { label: 'Cancelled Subs',        value: subStats?.cancelled,                           color: 'from-red-400 to-red-600',       icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-6 h-6 opacity-80 mb-3" />
            <div className="text-2xl font-display font-black">{value ?? '—'}</div>
            <div className="text-sm opacity-80 mt-1">{label}</div>
          </div>
        ))}
      </div>
      {/* Orders by status bar chart */}
      {stats?.ordersByStatus && (
        <div className="card p-5 mt-6">
          <h3 className="font-display font-bold text-gray-900 mb-4">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Object.entries(stats.ordersByStatus).map(([name, count]) => ({ name, count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}

// ── AdminOrders ───────────────────────────────────────────────────
// GET /api/orders → { orders: [...], pagination }   (admin sees all)
// PUT /api/orders/:id/status → { status }
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admin can see all orders via GET /api/orders
    api.get('/orders', { params: { limit: 100 } })
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      // PUT /api/orders/:id/status (admin route)
      await api.put(`/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-4">All Orders ({orders.length})</h2>
      {orders.length === 0 && <p className="text-gray-400 text-center py-10">No orders yet</p>}
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order._id} className="card p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                {/* order.user is populated with { name, email } */}
                <div className="font-bold text-gray-900">#{order._id.slice(-8).toUpperCase()}</div>
                <div className="text-sm text-gray-500">
                  {order.user?.name} · {order.user?.email}
                </div>
                <div className="text-sm text-brand-600 font-medium mt-0.5">
                  {order.totalPrice?.toLocaleString()} EGP
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
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

// ── AdminSubscriptions ────────────────────────────────────────────
// GET /api/admin/subscriptions/upcoming → { upcomingDeliveries: [...] }
// POST /api/admin/subscriptions/generate → { subscriptionId }
function AdminSubscriptions() {
  const [upcoming, setUpcoming] = useState([]);
  const [allSubs, setAllSubs]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState('');
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    Promise.all([
      api.get('/admin/subscriptions/upcoming'),
      api.get('/subscriptions', { params: { limit: 100 } }),
    ])
      .then(([u, a]) => {
        setUpcoming(u.data.upcomingDeliveries || []);
        setAllSubs(a.data.subscriptions || []);
      })
      .catch(() => toast.error('Failed to load subscriptions'))
      .finally(() => setLoading(false));
  }, []);

  // POST /api/admin/subscriptions/generate with { subscriptionId } in body
  const manualGenerate = async (subscriptionId) => {
    setGenerating(subscriptionId);
    try {
      await api.post('/admin/subscriptions/generate', { subscriptionId });
      toast.success('Order generated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setGenerating(''); }
  };

  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;

  const displayList = tab === 'upcoming' ? upcoming : allSubs;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold">Subscriptions</h2>
        <div className="flex gap-2">
          <button onClick={() => setTab('upcoming')} className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${tab === 'upcoming' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Upcoming ({upcoming.length})
          </button>
          <button onClick={() => setTab('all')} className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${tab === 'all' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All ({allSubs.length})
          </button>
        </div>
      </div>
      {displayList.length === 0 && <p className="text-gray-400 text-center py-10">No subscriptions to show</p>}
      <div className="space-y-3">
        {displayList.map(sub => {
          // sub.user and sub.box are populated
          const pricePerDelivery = sub.box?.basePrice
            ? (sub.box.basePrice * (MULTIPLIERS[sub.servingSize] || 1)).toFixed(0)
            : '—';
          return (
            <div key={sub._id} className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-bold text-gray-900">{sub.user?.name}</div>
                  <div className="text-sm text-gray-500">
                    {sub.box?.name} · {sub.frequency} · {sub.servingSize} {sub.servingSize === 1 ? 'person' : 'people'}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`badge ${sub.status === 'active' ? 'badge-green' : sub.status === 'paused' ? 'badge-orange' : 'badge-red'}`}>
                      {sub.status}
                    </span>
                    <span className="text-sm font-medium text-brand-600">{pricePerDelivery} EGP/delivery</span>
                    {sub.nextDeliveryDate && (
                      <span className="text-xs text-gray-400">
                        Next: {new Date(sub.nextDeliveryDate).toLocaleDateString('en-EG', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                {sub.status === 'active' && (
                  <button
                    onClick={() => manualGenerate(sub._id)}
                    disabled={generating === sub._id}
                    className="btn-outline !py-2 !px-4 text-sm flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generating === sub._id ? 'animate-spin' : ''}`} />
                    Generate Order
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AdminUsers ────────────────────────────────────────────────────
// GET /api/admin/users → { users: [...] }
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-4">All Users ({users.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {users.map(u => (
          <div key={u._id} className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-300 to-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">{u.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900">{u.name}</div>
              <div className="text-sm text-gray-500 truncate">{u.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>{u.role}</span>
                <span className="text-xs text-gray-400">
                  Joined {new Date(u.createdAt).toLocaleDateString('en-EG', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Admin nav ─────────────────────────────────────────────────────
const adminNav = [
  { to: '/admin',              label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/admin/orders',       label: 'Orders',        icon: Package },
  { to: '/admin/subscriptions',label: 'Subscriptions', icon: Repeat },
  { to: '/admin/users',        label: 'Users',         icon: Users },
];

// ── AdminLayout ───────────────────────────────────────────────────
export default function AdminLayout() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!user || !isAdmin) navigate('/'); }, [user, isAdmin]);
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white">
        <div className="page-container">
          <div className="flex flex-row items-center gap-3 py-7">
            <Link to="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-display text-base font-bold leading-tight">Boxify<br/>Admin</h1>
            </Link>
            <nav className="ml-2 flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
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
          <Route index      element={<AdminStats />} />
          <Route path="orders"        element={<AdminOrders />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="users"         element={<AdminUsers />} />
        </Routes>
      </div>
    </div>
  );
}
