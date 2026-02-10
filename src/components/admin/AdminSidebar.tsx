import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  RefreshCw,
  Box,
  UtensilsCrossed,
  Salad,
  Users,
  Settings,
  Store,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.jpeg';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: Package },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: RefreshCw },
  { name: 'Boxes', href: '/admin/boxes', icon: Box },
  { name: 'Meals', href: '/admin/meals', icon: UtensilsCrossed },
  { name: 'Ingredients', href: '/admin/ingredients', icon: Salad },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const AdminSidebar = ({ collapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2">
          <img src={logo} alt="Boxify" className="h-8 w-8 rounded-lg object-cover" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold font-['Poppins'] text-foreground leading-tight">
                Boxify
              </span>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Admin
              </span>
            </div>
          )}
        </Link>
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Link
          to="/"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
          )}
        >
          <Store className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Back to Store</span>}
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
