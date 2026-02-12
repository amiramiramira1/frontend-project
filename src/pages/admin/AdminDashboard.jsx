import { DollarSign, ShoppingBag, RefreshCw, Truck, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const statsCards = [
  {
    title: "Total Revenue",
    value: "45,670 EGP",
    trend: "+12% from last month",
    trendPositive: true,
    icon: DollarSign,
  },
  {
    title: "Active Orders",
    value: "23",
    trend: "5 need attention",
    trendPositive: false,
    icon: ShoppingBag,
  },
  {
    title: 'Active Subscriptions',
    value: '67',
    trend: '+8 this week',
    trendPositive: true,
    icon: RefreshCw,
  },
  {
    title: 'Pending Deliveries',
    value: '15',
    trend: 'Due in next 3 days',
    trendPositive: null,
    icon: Truck,
  },
];

const revenueData = [
  { month: "Sep", revenue: 28000 },
  { month: "Oct", revenue: 32000 },
  { month: "Nov", revenue: 35000 },
  { month: "Dec", revenue: 38000 },
  { month: "Jan", revenue: 41000 },
  { month: "Feb", revenue: 45670 },
];

const orderStatusData = [
  { name: "Delivered", value: 45, color: "hsl(160, 84%, 39%)" },
  { name: "In Transit", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "Preparing", value: 23, color: "hsl(220, 70%, 55%)" },
  { name: "Cancelled", value: 5, color: "hsl(0, 84%, 60%)" },
];

const recentOrders = [
  { id: "BOX-2026-045", customer: "Sarah M.", items: "Classic Balance × 2", amount: "1,130 EGP", status: "Delivered" },
  { id: "BOX-2026-044", customer: "Ahmed K.", items: "Mediterranean × 1", amount: "565 EGP", status: "In Transit" },
  { id: "BOX-2026-043", customer: "Nour H.", items: "Keto Fuel × 3", amount: "1,920 EGP", status: "Preparing" },
  { id: "BOX-2026-042", customer: "Omar R.", items: "Plant Power × 1", amount: "490 EGP", status: "Delivered" },
  { id: "BOX-2026-041", customer: "Layla S.", items: "Protein Plus × 2", amount: "1,290 EGP", status: "Cancelled" },
];

const upcomingSubscriptions = [
  { date: "Feb 12, 2026", customer: "Sarah M.", box: "Classic Balance", servings: "2 people" },
  { date: "Feb 12, 2026", customer: "Ahmed K.", box: "Mediterranean", servings: "4 people" },
  { date: "Feb 13, 2026", customer: "Nour H.", box: "Keto Fuel", servings: "2 people" },
  { date: "Feb 14, 2026", customer: "Omar R.", box: "Plant Power", servings: "1 person" },
  { date: "Feb 14, 2026", customer: "Layla S.", box: "Protein Plus", servings: "6 people" },
];

const statusColor = (status) => {
  switch (status) {
    case "Delivered":
      return "bg-primary/10 text-primary border-primary/20";
    case "In Transit":
      return "bg-secondary/10 text-secondary border-secondary/20";
    case "Preparing":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "Cancelled":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "";
  }
};

const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Poppins'] text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your store overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold font-['Poppins'] text-foreground">{stat.value}</p>
                    <p className={`text-xs font-medium ${stat.trendPositive === true ? 'text-primary' : stat.trendPositive === false ? 'text-secondary' : 'text-muted-foreground'}`}>
                      {stat.trendPositive === true && <TrendingUp className="inline h-3 w-3 mr-1" />}
                      {stat.trend}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue in EGP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`${value.toLocaleString()} EGP`, "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status Distribution</CardTitle>
            <CardDescription>Current order breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" stroke="none">
                    {orderStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {orderStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-semibold text-foreground ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <CardDescription>Latest 5 orders</CardDescription>
          </div>
          <Link to="/admin/orders">
            <Button variant="ghost" size="sm">
              View All Orders <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming Subscriptions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Upcoming Subscription Deliveries</CardTitle>
            <CardDescription>Next 5 deliveries</CardDescription>
          </div>
          <Link to="/admin/subscriptions">
            <Button variant="ghost" size="sm">
              View All <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingSubscriptions.map((sub, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-foreground min-w-[110px]">{sub.date}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{sub.customer}</p>
                    <p className="text-xs text-muted-foreground">{sub.box} · {sub.servings}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
