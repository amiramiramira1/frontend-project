import { Package, RefreshCw, Truck, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Mock data
const stats = [
  { 
    title: 'Active Subscriptions', 
    value: '2', 
    icon: RefreshCw, 
    description: 'Weekly deliveries',
    color: 'text-primary'
  },
  { 
    title: 'Total Orders', 
    value: '12', 
    icon: Package, 
    description: 'Since joining',
    color: 'text-secondary'
  },
  { 
    title: 'Next Delivery', 
    value: 'Jan 30', 
    icon: Truck, 
    description: 'Tuesday, 2-4 PM',
    color: 'text-primary'
  },
  { 
    title: 'This Month', 
    value: '$186', 
    icon: CreditCard, 
    description: '2 boxes ordered',
    color: 'text-secondary'
  },
];

const recentOrders = [
  { id: 'ORD-001', box: 'Classic Balanced Box', date: 'Jan 23, 2026', status: 'Delivered', total: '$49.99' },
  { id: 'ORD-002', box: 'Vegan Delight Box', date: 'Jan 16, 2026', status: 'Delivered', total: '$54.99' },
  { id: 'ORD-003', box: 'Keto Power Box', date: 'Jan 9, 2026', status: 'Delivered', total: '$59.99' },
];

const upcomingDeliveries = [
  { box: 'Classic Balanced Box', date: 'Jan 30, 2026', time: '2-4 PM' },
  { box: 'Vegan Delight Box', date: 'Feb 2, 2026', time: '10 AM-12 PM' },
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Poppins'] text-foreground">Welcome back, John!</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your meal boxes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your last 3 orders</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{order.box}</p>
                    <p className="text-sm text-muted-foreground">{order.id} • {order.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {order.status}
                    </Badge>
                    <span className="font-semibold">{order.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deliveries</CardTitle>
            <CardDescription>Your next scheduled boxes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeliveries.map((delivery, index) => (
                <div
                  key={index}
                  className="p-4 border border-border rounded-lg space-y-2"
                >
                  <p className="font-medium">{delivery.box}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    <span>{delivery.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{delivery.time}</p>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline">
              Manage Deliveries
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/boxes">Browse Boxes</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/subscriptions">Manage Subscriptions</Link>
            </Button>
            <Button variant="outline">Skip Next Delivery</Button>
            <Button variant="outline">Update Payment</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
