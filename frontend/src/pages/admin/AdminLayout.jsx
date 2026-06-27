import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, NavLink, Routes, Route, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Package, Repeat, Users, BarChart3, RefreshCw,
  CheckCircle, Clock, Truck, XCircle, ChefHat, Boxes,
  Plus, Pencil, Trash2, X, Upload, Search, Image as ImageIcon, Tag, Leaf,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ── Constants ──────────────────────────────────────────────────────
const statusOptions   = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
const MULTIPLIERS     = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };
const DIET_TYPES_MEAL = ['vegan', 'vegetarian', 'keto', 'paleo', 'standard'];
const DIET_TYPES_BOX  = ['vegan', 'vegetarian', 'keto', 'paleo', 'standard', 'mixed'];
const ALLERGEN_LIST   = ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish'];

// ── Reusable: SlideOver drawer ─────────────────────────────────────
function SlideOver({ open, onClose, title, children, onSave, saving }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-sm transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="flex-1 btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Reusable: ImageUploader ────────────────────────────────────────
function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    setUploading(true);
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(data.url);
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-outline !py-2 !px-4 flex items-center gap-2 text-sm w-full justify-center"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : value ? 'Change Image' : 'Upload Image'}
          </button>
          {value && (
            <p className="text-xs text-gray-400 mt-1 truncate">{value}</p>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Reusable: FormField ────────────────────────────────────────────
function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ── AdminStats ──────────────────────────────────────────────────────
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
          { label: 'Total Orders',         value: stats?.totalOrders,                            color: 'from-blue-500 to-blue-600',     icon: Package },
          { label: 'Revenue (Paid)',       value: `${stats?.totalRevenue?.toLocaleString()} EGP`, color: 'from-brand-400 to-brand-600',   icon: BarChart3 },
          { label: 'Active Subscriptions', value: subStats?.active,                              color: 'from-green-500 to-green-600',   icon: Repeat },
          { label: 'Total Users',          value: stats?.totalUsers,                             color: 'from-purple-500 to-purple-600', icon: Users },
          { label: 'Active Boxes',         value: stats?.totalBoxes,                             color: 'from-orange-400 to-orange-600', icon: Boxes },
          { label: 'Total Meals',          value: stats?.totalMeals,                             color: 'from-teal-500 to-teal-600',    icon: ChefHat },
          { label: 'Paused Subscriptions', value: subStats?.paused,                              color: 'from-yellow-400 to-yellow-600', icon: Repeat },
          { label: 'Cancelled Subs',       value: subStats?.cancelled,                           color: 'from-red-400 to-red-600',       icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-6 h-6 opacity-80 mb-3" />
            <div className="text-2xl font-display font-black">{value ?? '—'}</div>
            <div className="text-sm opacity-80 mt-1">{label}</div>
          </div>
        ))}
      </div>
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

// ── AdminOrders ────────────────────────────────────────────────────
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders', { params: { limit: 100 } })
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
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
                <div className="font-bold text-gray-900">#{order._id.slice(-8).toUpperCase()}</div>
                <div className="text-sm text-gray-500">{order.user?.name} · {order.user?.email}</div>
                <div className="text-sm text-brand-600 font-medium mt-0.5">{order.totalPrice?.toLocaleString()} EGP</div>
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

// ── AdminSubscriptions ─────────────────────────────────────────────
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

// ── AdminUsers ─────────────────────────────────────────────────────
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

// ── AdminInventory (dual-tab quick view) ─────────────────────────
function AdminInventory() {
  const [activeTab, setActiveTab] = useState('meals'); // 'meals' or 'ingredients'
  const [meals, setMeals] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, iRes] = await Promise.all([
        api.get('/meals', { params: { limit: 200 } }),
        api.get('/ingredients', { params: { limit: 200 } })
      ]);
      setMeals(mRes.data.meals || []);
      setIngredients(iRes.data.ingredients || []);
    } catch {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateMeal = async (id, changes) => {
    setMeals(prev => prev.map(m => m._id === id ? { ...m, ...changes } : m));
    try {
      await api.put(`/meals/${id}`, changes);
      toast.success('Meal override updated');
      // Refetch to calculate dynamic stock quantities across other meals
      const [mRes, iRes] = await Promise.all([
        api.get('/meals', { params: { limit: 200 } }),
        api.get('/ingredients', { params: { limit: 200 } })
      ]);
      setMeals(mRes.data.meals || []);
      setIngredients(iRes.data.ingredients || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update meal');
      fetchData();
    }
  };

  const updateIngredient = async (id, changes) => {
    setIngredients(prev => prev.map(i => i._id === id ? { ...i, ...changes } : i));
    try {
      await api.put(`/ingredients/${id}`, changes);
      toast.success('Ingredient updated');
      // Refetch to calculate dynamic stock quantities across other meals
      const [mRes, iRes] = await Promise.all([
        api.get('/meals', { params: { limit: 200 } }),
        api.get('/ingredients', { params: { limit: 200 } })
      ]);
      setMeals(mRes.data.meals || []);
      setIngredients(iRes.data.ingredients || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ingredient');
      fetchData();
    }
  };

  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;

  return (
    <div>
      {/* Tab Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-gray-900">Inventory Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('meals')}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'meals' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Meals Stock ({meals.length})
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'ingredients' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Ingredients Stock ({ingredients.length})
          </button>
        </div>
      </div>

      {activeTab === 'meals' ? (
        <div className="space-y-3">
          {meals.length === 0 && <p className="text-gray-400 text-center py-10">No meals found</p>}
          {meals.map(meal => (
            <div key={meal._id} className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {meal.image
                      ? <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-5 h-5 text-gray-400" /></div>
                    }
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{meal.name}</div>
                    <div className="text-sm text-gray-500">
                      Calculated Qty: <span className="font-semibold text-brand-600">{meal.stockQuantity}</span> servings
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateMeal(meal._id, { inStock: !meal.inStock })}
                    className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                      meal.inStock ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {meal.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {ingredients.length === 0 && <p className="text-gray-400 text-center py-10">No ingredients found</p>}
          {ingredients.map(ing => (
            <div key={ing._id} className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-600 font-bold">
                    {ing.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{ing.name}</div>
                    <div className="text-sm text-gray-500">Unit: {ing.unit} · {ing.costPerUnit} EGP/unit</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Qty ({ing.unit})</label>
                    <input
                      type="number" min="0"
                      value={ing.stockQuantity || ''}
                      placeholder="—"
                      onChange={e => {
                        const qty = Number(e.target.value);
                        updateIngredient(ing._id, { stockQuantity: qty, inStock: qty > 0 });
                      }}
                      className="input-field !w-24 !py-1.5 !px-2 text-sm text-center"
                    />
                  </div>
                  <button
                    onClick={() => updateIngredient(ing._id, { inStock: !ing.inStock })}
                    className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                      ing.inStock ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {ing.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AdminMeals — full CRUD ─────────────────────────────────────────
const EMPTY_MEAL_FORM = {
  name: '', description: '', dietType: 'standard', cuisine: '',
  allergens: [], image: '', ingredients: [],
};

function AdminMeals() {
  const [meals, setMeals]               = useState([]);
  const [ingredients, setIngredients]   = useState([]);   // all ingredients from DB
  const [loading, setLoading]           = useState(true);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [editing, setEditing]           = useState(null);  // meal being edited, null = create
  const [form, setForm]                 = useState(EMPTY_MEAL_FORM);
  const [saving, setSaving]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch]             = useState('');
  const [ingSearch, setIngSearch]       = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/meals', { params: { limit: 200 } }),
      api.get('/ingredients', { params: { limit: 200 } }),
    ])
      .then(([m, i]) => {
        setMeals(m.data.meals || []);
        setIngredients(i.data.ingredients || []);
      })
      .catch(() => toast.error('Failed to load meals'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_MEAL_FORM);
    setDrawerOpen(true);
  };

  const openEdit = (meal) => {
    setEditing(meal);
    setForm({
      name: meal.name || '',
      description: meal.description || '',
      dietType: meal.dietType || 'standard',
      cuisine: meal.cuisine || '',
      allergens: meal.allergens || [],
      image: meal.image || '',
      ingredients: (meal.ingredients || []).map(i => ({
        ingredient: i.ingredient?._id || i.ingredient,
        quantity: i.quantity,
      })),
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (form.ingredients.length === 0) { toast.error('Add at least one ingredient'); return; }
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.put(`/meals/${editing._id}`, form);
        setMeals(prev => prev.map(m => m._id === editing._id ? data.meal : m));
        toast.success('Meal updated');
      } else {
        const { data } = await api.post('/meals', form);
        setMeals(prev => [data.meal, ...prev]);
        toast.success('Meal created');
      }
      setDrawerOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/meals/${id}`);
      setMeals(prev => prev.filter(m => m._id !== id));
      setConfirmDelete(null);
      toast.success('Meal deleted');
    } catch { toast.error('Delete failed'); }
  };

  const toggleAllergen = (a) => {
    setForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(a)
        ? prev.allergens.filter(x => x !== a)
        : [...prev.allergens, a],
    }));
  };

  const addIngredient = (ingId) => {
    if (form.ingredients.find(i => i.ingredient === ingId)) return;
    setForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { ingredient: ingId, quantity: 100 }] }));
    setIngSearch('');
  };

  const removeIngredient = (ingId) => {
    setForm(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i.ingredient !== ingId) }));
  };

  const updateIngQty = (ingId, qty) => {
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(i => i.ingredient === ingId ? { ...i, quantity: Number(qty) } : i),
    }));
  };

  const ingById = useCallback((id) => ingredients.find(i => i._id === id), [ingredients]);

  const filteredMeals = meals.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.dietType?.toLowerCase().includes(search.toLowerCase()) ||
    m.cuisine?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(ingSearch.toLowerCase()) &&
    !form.ingredients.find(fi => fi.ingredient === i._id)
  );

  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-gray-900">Meals ({meals.length})</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 !py-2 !px-4">
          <Plus className="w-4 h-4" /> New Meal
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search meals…"
          className="input-field !pl-9"
        />
      </div>

      {filteredMeals.length === 0 && <p className="text-gray-400 text-center py-10">No meals found</p>}

      {/* Meal cards */}
      <div className="space-y-3">
        {filteredMeals.map(meal => (
          <div key={meal._id} className="card p-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {meal.image
                  ? <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-6 h-6 text-gray-300" /></div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{meal.name}</span>
                  <span className={`badge ${meal.inStock ? 'badge-green' : 'badge-red'}`}>
                    {meal.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <span className="badge badge-gray capitalize">{meal.dietType}</span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {meal.cuisine} · {meal.caloriesPerServing} cal · {meal.pricePerServing} EGP/serving
                </div>
                {meal.allergens?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {meal.allergens.map(a => (
                      <span key={a} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">⚠ {a}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {confirmDelete === meal._id ? (
                  <>
                    <span className="text-sm text-gray-600">Delete?</span>
                    <button onClick={() => handleDelete(meal._id)} className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors">Yes</button>
                    <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">No</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openEdit(meal)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-brand-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(meal._id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-500 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over form */}
      <SlideOver
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Edit: ${editing.name}` : 'New Meal'}
        onSave={handleSave}
        saving={saving}
      >
        {/* Name */}
        <FormField label="Name *">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="e.g. Grilled Chicken Bowl" />
        </FormField>

        {/* Description */}
        <FormField label="Description">
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Short description…" />
        </FormField>

        {/* Diet Type */}
        <FormField label="Diet Type">
          <select value={form.dietType} onChange={e => setForm(p => ({ ...p, dietType: e.target.value }))} className="input-field">
            {DIET_TYPES_MEAL.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
          </select>
        </FormField>

        {/* Cuisine */}
        <FormField label="Cuisine">
          <input value={form.cuisine} onChange={e => setForm(p => ({ ...p, cuisine: e.target.value }))} className="input-field" placeholder="e.g. Mediterranean" />
        </FormField>

        {/* Allergens */}
        <FormField label="Allergens">
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_LIST.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAllergen(a)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                  form.allergens.includes(a)
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </FormField>

        {/* Image */}
        <ImageUploader value={form.image} onChange={url => setForm(p => ({ ...p, image: url }))} />

        {/* Ingredients */}
        <FormField label="Ingredients *">
          {/* Search to add */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={ingSearch}
              onChange={e => setIngSearch(e.target.value)}
              placeholder="Search ingredients to add…"
              className="input-field !pl-9"
            />
            {ingSearch && filteredIngredients.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredIngredients.slice(0, 10).map(ing => (
                  <button
                    key={ing._id}
                    type="button"
                    onClick={() => addIngredient(ing._id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">{ing.name}</span>
                    <span className="text-gray-400 text-xs">{ing.unit} · {ing.caloriesPerUnit} cal</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected ingredients */}
          {form.ingredients.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded-xl">No ingredients added yet</p>
          )}
          <div className="space-y-2">
            {form.ingredients.map(item => {
              const ing = ingById(item.ingredient);
              return (
                <div key={item.ingredient} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="flex-1 text-sm font-medium text-gray-900">{ing?.name || item.ingredient}</span>
                  <span className="text-xs text-gray-400">{ing?.unit}</span>
                  <input
                    type="number"
                    min="0.01"
                    value={item.quantity}
                    onChange={e => updateIngQty(item.ingredient, e.target.value)}
                    className="input-field !w-20 !py-1 !px-2 text-sm text-center"
                  />
                  <button onClick={() => removeIngredient(item.ingredient)} className="p-1 hover:text-red-500 text-gray-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </FormField>

        {/* Computed fields — read-only after save */}
        {editing && (
          <div className="bg-brand-50 rounded-xl p-4 flex gap-6">
            <div>
              <div className="text-xs text-brand-600 font-semibold uppercase tracking-wide">Price/Serving</div>
              <div className="text-lg font-bold text-brand-800">{editing.pricePerServing} EGP</div>
            </div>
            <div>
              <div className="text-xs text-brand-600 font-semibold uppercase tracking-wide">Calories</div>
              <div className="text-lg font-bold text-brand-800">{editing.caloriesPerServing} cal</div>
            </div>
            <p className="text-xs text-brand-500 self-end">Auto-calculated from ingredients</p>
          </div>
        )}
      </SlideOver>
    </div>
  );
}

// ── AdminBoxes — full CRUD ─────────────────────────────────────────
const EMPTY_BOX_FORM = {
  name: '', description: '', dietType: 'mixed', image: '',
  meals: [], isActive: true,
};

function AdminBoxes() {
  const [boxes, setBoxes]             = useState([]);
  const [allMeals, setAllMeals]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(EMPTY_BOX_FORM);
  const [saving, setSaving]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch]           = useState('');
  const [mealSearch, setMealSearch]   = useState('');

  // Admin needs to see inactive boxes too, so fetch without filter
  useEffect(() => {
    Promise.all([
      api.get('/boxes', { params: { limit: 200, includeInactive: true } }),
      api.get('/meals', { params: { limit: 200 } }),
    ])
      .then(([b, m]) => {
        setBoxes(b.data.boxes || []);
        setAllMeals(m.data.meals || []);
      })
      .catch(() => toast.error('Failed to load boxes'))
      .finally(() => setLoading(false));
  }, []);

  // Live price preview — sum of pricePerServing from selected meals
  const liveBasePrice = form.meals.reduce((sum, id) => {
    const meal = allMeals.find(m => m._id === id);
    return sum + (meal?.pricePerServing || 0);
  }, 0);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_BOX_FORM);
    setDrawerOpen(true);
  };

  const openEdit = (box) => {
    setEditing(box);
    setForm({
      name: box.name || '',
      description: box.description || '',
      dietType: box.dietType || 'mixed',
      image: box.image || '',
      meals: (box.meals || []).map(m => m._id || m),
      isActive: box.isActive !== false,
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (form.meals.length === 0) { toast.error('Select at least one meal'); return; }
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.put(`/boxes/${editing._id}`, form);
        setBoxes(prev => prev.map(b => b._id === editing._id ? { ...data.box, meals: data.box.meals || form.meals } : b));
        toast.success('Box updated');
      } else {
        const { data } = await api.post('/boxes', form);
        setBoxes(prev => [data.box, ...prev]);
        toast.success('Box created');
      }
      setDrawerOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/boxes/${id}`);
      // Backend soft-deletes (sets isActive: false), so update locally
      setBoxes(prev => prev.map(b => b._id === id ? { ...b, isActive: false } : b));
      setConfirmDelete(null);
      toast.success('Box deactivated');
    } catch { toast.error('Delete failed'); }
  };

  const toggleMeal = (mealId) => {
    setForm(prev => ({
      ...prev,
      meals: prev.meals.includes(mealId)
        ? prev.meals.filter(id => id !== mealId)
        : prev.meals.length >= 10
          ? (toast.error('Max 10 meals per box'), prev.meals)
          : [...prev.meals, mealId],
    }));
  };

  const toggleActive = async (box) => {
    try {
      await api.put(`/boxes/${box._id}`, { isActive: !box.isActive });
      setBoxes(prev => prev.map(b => b._id === box._id ? { ...b, isActive: !b.isActive } : b));
    } catch { toast.error('Failed to update box'); }
  };

  const filteredBoxes = boxes.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.dietType?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMealsForPicker = allMeals.filter(m =>
    m.name.toLowerCase().includes(mealSearch.toLowerCase())
  );

  const mealById = useCallback((id) => allMeals.find(m => m._id === id), [allMeals]);

  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-gray-900">Boxes ({boxes.length})</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 !py-2 !px-4">
          <Plus className="w-4 h-4" /> New Box
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search boxes…" className="input-field !pl-9" />
      </div>

      {filteredBoxes.length === 0 && <p className="text-gray-400 text-center py-10">No boxes found</p>}

      {/* Box cards */}
      <div className="space-y-3">
        {filteredBoxes.map(box => (
          <div key={box._id} className={`card p-4 transition-opacity ${!box.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {box.image
                  ? <img src={box.image} alt={box.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Boxes className="w-6 h-6 text-gray-300" /></div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{box.name}</span>
                  <span className={`badge ${box.isActive ? 'badge-green' : 'badge-red'}`}>
                    {box.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="badge badge-gray capitalize">{box.dietType}</span>
                  <span className="badge badge-blue capitalize">{box.type}</span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {(box.meals?.length || 0)} meals · {box.basePrice?.toFixed(2)} EGP base price
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Active toggle */}
                <button
                  onClick={() => toggleActive(box)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    box.isActive ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {box.isActive ? 'Deactivate' : 'Activate'}
                </button>

                {confirmDelete === box._id ? (
                  <>
                    <span className="text-sm text-gray-600">Deactivate?</span>
                    <button onClick={() => handleDelete(box._id)} className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors">Yes</button>
                    <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">No</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openEdit(box)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-brand-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(box._id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-500 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over form */}
      <SlideOver
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Edit: ${editing.name}` : 'New Box'}
        onSave={handleSave}
        saving={saving}
      >
        {/* Name */}
        <FormField label="Name *">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="e.g. Classic Weekly Box" />
        </FormField>

        {/* Description */}
        <FormField label="Description">
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Short description…" />
        </FormField>

        {/* Diet Type */}
        <FormField label="Diet Type">
          <select value={form.dietType} onChange={e => setForm(p => ({ ...p, dietType: e.target.value }))} className="input-field">
            {DIET_TYPES_BOX.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
          </select>
        </FormField>

        {/* Image */}
        <ImageUploader value={form.image} onChange={url => setForm(p => ({ ...p, image: url }))} />

        {/* Active toggle */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <div>
            <div className="font-semibold text-gray-900 text-sm">Active</div>
            <div className="text-xs text-gray-500">Visible to customers on the Boxes page</div>
          </div>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              form.isActive ? 'bg-brand-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                form.isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Meals picker */}
        <FormField label={`Meals * (${form.meals.length}/10)`}>
          {/* Live price */}
          <div className="mb-3 bg-brand-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-brand-700 font-medium">Live Base Price</span>
            <span className="font-bold text-brand-900 text-lg">{liveBasePrice.toFixed(2)} EGP</span>
          </div>

          {/* Selected pills */}
          {form.meals.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {form.meals.map(id => {
                const meal = mealById(id);
                return meal ? (
                  <span key={id} className="flex items-center gap-1.5 bg-brand-100 text-brand-800 text-sm font-medium rounded-full px-3 py-1">
                    {meal.name}
                    <button type="button" onClick={() => toggleMeal(id)} className="hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Search and pick */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={mealSearch}
              onChange={e => setMealSearch(e.target.value)}
              placeholder="Search meals…"
              className="input-field !pl-9"
            />
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
            {filteredMealsForPicker.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No meals found</p>
            )}
            {filteredMealsForPicker.map(meal => {
              const selected = form.meals.includes(meal._id);
              return (
                <button
                  key={meal._id}
                  type="button"
                  onClick={() => toggleMeal(meal._id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm border-b border-gray-100 last:border-0 transition-colors ${
                    selected ? 'bg-brand-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {meal.image && (
                      <img src={meal.image} alt={meal.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{meal.name}</div>
                      <div className="text-xs text-gray-400">{meal.pricePerServing} EGP · {meal.caloriesPerServing} cal</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selected ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
                  }`}>
                    {selected && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </FormField>
      </SlideOver>
    </div>
  );
}

// ── AdminPromos ────────────────────────────────────────────────────
function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', discount: '', label: '', usageLimit: '', expiresAt: '' });

  const fetchPromos = () => {
    api.get('/promo')
      .then(({ data }) => setPromos(data.promos || []))
      .catch(() => toast.error('Failed to load promo codes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPromos(); }, []);

  const openCreate = () => {
    setForm({ code: '', discount: '', label: '', usageLimit: '', expiresAt: '' });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount || !form.label) {
      toast.error('Code, discount, and label are required'); return;
    }
    setSaving(true);
    try {
      await api.post('/promo', {
        code: form.code,
        discount: parseFloat(form.discount) / 100, // UI uses %, API uses fraction
        label: form.label,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
      });
      toast.success('Promo code created');
      setDrawerOpen(false);
      fetchPromos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create promo code');
    } finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await api.patch(`/promo/${id}/toggle`);
      setPromos(prev => prev.map(p => p._id === id ? data.promo : p));
      toast.success(data.message);
    } catch { toast.error('Failed to toggle promo'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo code permanently?')) return;
    try {
      await api.delete(`/promo/${id}`);
      setPromos(prev => prev.filter(p => p._id !== id));
      toast.success('Promo code deleted');
    } catch { toast.error('Failed to delete promo'); }
  };

  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold">Promo Codes ({promos.length})</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Promo
        </button>
      </div>

      {promos.length === 0 && <p className="text-gray-400 text-center py-10">No promo codes yet</p>}

      <div className="space-y-3">
        {promos.map(promo => (
          <div key={promo._id} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              promo.isActive ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Tag className={`w-5 h-5 ${promo.isActive ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-900">{promo.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {promo.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                {promo.label} · {(promo.discount * 100).toFixed(0)}% off ·
                Used {promo.usageCount}{promo.usageLimit ? `/${promo.usageLimit}` : ''} times
                {promo.expiresAt && ` · Expires ${new Date(promo.expiresAt).toLocaleDateString()}`}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleToggle(promo._id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  promo.isActive
                    ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {promo.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(promo._id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <SlideOver open={drawerOpen} onClose={() => setDrawerOpen(false)} title="New Promo Code" onSave={handleSave} saving={saving}>
        <FormField label="Code">
          <input
            value={form.code}
            onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. SAVE10"
            className="input-field font-mono"
          />
        </FormField>
        <FormField label="Discount (%)">
          <input
            type="number"
            min="1" max="100"
            value={form.discount}
            onChange={e => setForm(p => ({ ...p, discount: e.target.value }))}
            placeholder="e.g. 10"
            className="input-field"
          />
        </FormField>
        <FormField label="Label">
          <input
            value={form.label}
            onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
            placeholder="e.g. 10% off"
            className="input-field"
          />
        </FormField>
        <FormField label="Usage Limit (optional)">
          <input
            type="number"
            min="1"
            value={form.usageLimit}
            onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))}
            placeholder="Leave empty for unlimited"
            className="input-field"
          />
        </FormField>
        <FormField label="Expiry Date (optional)">
          <input
            type="date"
            value={form.expiresAt}
            onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
            className="input-field"
          />
        </FormField>
      </SlideOver>
    </div>
  );
}

// ── AdminIngredients — full CRUD ───────────────────────────────────
const UNIT_OPTIONS = ['g', 'kg', 'ml', 'L', 'piece', 'tbsp', 'tsp'];
const EMPTY_INGREDIENT_FORM = {
  name: '', unit: 'g', costPerUnit: '', caloriesPerUnit: '',
  stockQuantity: '', inStock: true,
};

function AdminIngredients() {
  const [ingredients, setIngredients]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [editing, setEditing]             = useState(null);
  const [form, setForm]                   = useState(EMPTY_INGREDIENT_FORM);
  const [saving, setSaving]               = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch]               = useState('');

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ingredients', { params: { limit: 200 } });
      setIngredients(data.ingredients || []);
    } catch {
      toast.error('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIngredients(); }, [fetchIngredients]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_INGREDIENT_FORM);
    setDrawerOpen(true);
  };

  const openEdit = (ing) => {
    setEditing(ing);
    setForm({
      name:           ing.name || '',
      unit:           ing.unit || 'g',
      costPerUnit:    ing.costPerUnit ?? '',
      caloriesPerUnit: ing.caloriesPerUnit ?? '',
      stockQuantity:  ing.stockQuantity ?? '',
      inStock:        ing.inStock !== false,
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.unit) { toast.error('Unit is required'); return; }
    if (!form.costPerUnit && form.costPerUnit !== 0) { toast.error('Cost per unit is required'); return; }
    if (!form.caloriesPerUnit && form.caloriesPerUnit !== 0) { toast.error('Calories per unit is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name:           form.name.trim(),
        unit:           form.unit,
        costPerUnit:    Number(form.costPerUnit),
        caloriesPerUnit: Number(form.caloriesPerUnit),
        stockQuantity:  form.stockQuantity !== '' ? Number(form.stockQuantity) : 0,
        inStock:        form.inStock,
      };
      if (editing) {
        const { data } = await api.put(`/ingredients/${editing._id}`, payload);
        setIngredients(prev => prev.map(i => i._id === editing._id ? data.ingredient : i));
        toast.success('Ingredient updated');
      } else {
        const { data } = await api.post('/ingredients', payload);
        setIngredients(prev => [data.ingredient, ...prev]);
        toast.success('Ingredient created');
      }
      setDrawerOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/ingredients/${id}`);
      setIngredients(prev => prev.filter(i => i._id !== id));
      setConfirmDelete(null);
      toast.success('Ingredient deleted');
    } catch { toast.error('Delete failed'); }
  };

  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.unit?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="animate-pulse h-60 bg-gray-100 rounded-2xl" />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-gray-900">Ingredients ({ingredients.length})</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 !py-2 !px-4">
          <Plus className="w-4 h-4" /> New Ingredient
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ingredients…"
          className="input-field !pl-9"
        />
      </div>

      {filteredIngredients.length === 0 && <p className="text-gray-400 text-center py-10">No ingredients found</p>}

      {/* Ingredient cards */}
      <div className="space-y-3">
        {filteredIngredients.map(ing => (
          <div key={ing._id} className="card p-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-700 font-bold text-lg">{ing.name?.[0]?.toUpperCase()}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{ing.name}</span>
                  <span className={`badge ${ing.inStock ? 'badge-green' : 'badge-red'}`}>
                    {ing.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <span className="badge badge-gray">{ing.unit}</span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {ing.costPerUnit} EGP/{ing.unit} · {ing.caloriesPerUnit} cal/{ing.unit}
                  {ing.stockQuantity > 0 && <> · <span className="font-medium text-brand-600">{ing.stockQuantity} {ing.unit}</span> in stock</>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {confirmDelete === ing._id ? (
                  <>
                    <span className="text-sm text-gray-600">Delete?</span>
                    <button onClick={() => handleDelete(ing._id)} className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors">Yes</button>
                    <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">No</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openEdit(ing)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-brand-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(ing._id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-500 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over form */}
      <SlideOver
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Edit: ${editing.name}` : 'New Ingredient'}
        onSave={handleSave}
        saving={saving}
      >
        {/* Name */}
        <FormField label="Name *">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="e.g. Chicken Breast" />
        </FormField>

        {/* Unit */}
        <FormField label="Unit *">
          <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="input-field">
            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </FormField>

        {/* Cost per Unit */}
        <FormField label="Cost per Unit (EGP) *">
          <input
            type="number" min="0.01" step="0.01"
            value={form.costPerUnit}
            onChange={e => setForm(p => ({ ...p, costPerUnit: e.target.value }))}
            className="input-field" placeholder="e.g. 0.25"
          />
        </FormField>

        {/* Calories per Unit */}
        <FormField label="Calories per Unit *">
          <input
            type="number" min="0" step="0.1"
            value={form.caloriesPerUnit}
            onChange={e => setForm(p => ({ ...p, caloriesPerUnit: e.target.value }))}
            className="input-field" placeholder="e.g. 1.65"
          />
        </FormField>

        {/* Stock Quantity */}
        <FormField label="Stock Quantity">
          <input
            type="number" min="0"
            value={form.stockQuantity}
            onChange={e => setForm(p => ({ ...p, stockQuantity: e.target.value }))}
            className="input-field" placeholder="e.g. 500"
          />
        </FormField>

        {/* In Stock toggle */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <div>
            <div className="font-semibold text-gray-900 text-sm">In Stock</div>
            <div className="text-xs text-gray-500">Mark this ingredient as available</div>
          </div>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, inStock: !p.inStock }))}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              form.inStock ? 'bg-brand-500' : 'bg-gray-200'
            }`}
          >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              form.inStock ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        </div>
      </SlideOver>
    </div>
  );
}

// ── Admin nav ──────────────────────────────────────────────────────
const adminNav = [
  { to: '/admin',               label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/admin/orders',        label: 'Orders',        icon: Package },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: Repeat },
  { to: '/admin/users',         label: 'Users',         icon: Users },
  { to: '/admin/meals',         label: 'Meals',         icon: ChefHat },
  { to: '/admin/boxes',         label: 'Boxes',         icon: Boxes },
  { to: '/admin/promos',        label: 'Promos',        icon: Tag },
  { to: '/admin/ingredients',   label: 'Ingredients',   icon: Leaf },
  { to: '/admin/inventory',     label: 'Inventory',     icon: RefreshCw },
];

// ── AdminLayout ────────────────────────────────────────────────────
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
          <Route index             element={<AdminStats />} />
          <Route path="orders"        element={<AdminOrders />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="users"         element={<AdminUsers />} />
          <Route path="meals"         element={<AdminMeals />} />
          <Route path="boxes"         element={<AdminBoxes />} />
          <Route path="promos"        element={<AdminPromos />} />
          <Route path="ingredients"   element={<AdminIngredients />} />
          <Route path="inventory"     element={<AdminInventory />} />
        </Routes>
      </div>
    </div>
  );
}
