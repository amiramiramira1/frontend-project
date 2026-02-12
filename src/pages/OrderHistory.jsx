import { useState } from "react";
import { Eye, Package, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock order data
const orders = [
  {
    id: "ORD-001",
    date: "Jan 23, 2026",
    items: ["Classic Balanced Box"],
    total: 49.99,
    status: "Delivered",
    deliveryDate: "Jan 25, 2026",
    meals: ["Grilled Chicken", "Salmon Bowl", "Beef Stir-fry", "Turkey Wrap", "Pasta Primavera"],
  },
  {
    id: "ORD-002",
    date: "Jan 16, 2026",
    items: ["Vegan Delight Box"],
    total: 54.99,
    status: "Delivered",
    deliveryDate: "Jan 18, 2026",
    meals: ["Buddha Bowl", "Tofu Curry", "Quinoa Salad", "Veggie Wrap", "Mushroom Risotto"],
  },
  {
    id: "ORD-003",
    date: "Jan 9, 2026",
    items: ["Keto Power Box"],
    total: 59.99,
    status: "Delivered",
    deliveryDate: "Jan 11, 2026",
    meals: ["Ribeye Steak", "Salmon Avocado", "Chicken Thighs", "Bacon Eggs", "Cheese Platter"],
  },
  {
    id: "ORD-004",
    date: "Jan 2, 2026",
    items: ["Mediterranean Box", "Protein Plus Box"],
    total: 109.98,
    status: "Delivered",
    deliveryDate: "Jan 4, 2026",
    meals: ["Greek Salad", "Falafel Plate", "Chicken Breast", "Protein Shake", "Egg Whites"],
  },
  {
    id: "ORD-005",
    date: "Dec 26, 2025",
    items: ["Classic Balanced Box"],
    total: 49.99,
    status: "Delivered",
    deliveryDate: "Dec 28, 2025",
    meals: ["Grilled Chicken", "Salmon Bowl", "Beef Stir-fry", "Turkey Wrap", "Pasta Primavera"],
  },
  {
    id: "ORD-006",
    date: "Dec 19, 2025",
    items: ["Vegan Delight Box"],
    total: 54.99,
    status: "Cancelled",
    deliveryDate: null,
    meals: [],
  },
  {
    id: "ORD-007",
    date: "Dec 12, 2025",
    items: ["Asian Fusion Box"],
    total: 52.99,
    status: "Delivered",
    deliveryDate: "Dec 14, 2025",
    meals: ["Teriyaki Bowl", "Pad Thai", "Sushi Platter", "Ramen", "Dim Sum"],
  },
  {
    id: "ORD-008",
    date: "Jan 28, 2026",
    items: ["Classic Balanced Box"],
    total: 49.99,
    status: "Processing",
    deliveryDate: "Jan 30, 2026",
    meals: ["Grilled Chicken", "Salmon Bowl", "Beef Stir-fry", "Turkey Wrap", "Pasta Primavera"],
  },
];

const getStatusVariant = (status) => {
  switch (status) {
    case "Delivered":
      return "default";
    case "Processing":
      return "secondary";
    case "Cancelled":
      return "destructive";
    default:
      return 'outline';
  }
};

const OrderHistory = () => {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Poppins'] text-foreground">Order History</h1>
        <p className="text-muted-foreground mt-1">View and manage your past orders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'Delivered').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Click on a row to view order details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <>
                  <TableRow 
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{order.items.join(', ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedOrder === order.id && (
                    <TableRow key={`${order.id}-details`}>
                      <TableCell colSpan={6} className="bg-muted/30">
                        <div className="py-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Order Details</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-muted-foreground">Order ID:</span> {order.id}</p>
                                <p><span className="text-muted-foreground">Order Date:</span> {order.date}</p>
                                {order.deliveryDate && (
                                  <p><span className="text-muted-foreground">Delivery Date:</span> {order.deliveryDate}</p>
                                )}
                              </div>
                            </div>
                            {order.meals.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Meals Included</h4>
                                <ul className="text-sm space-y-1">
                                  {order.meals.map((meal, index) => (
                                    <li key={index} className="text-muted-foreground">• {meal}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Reorder</Button>
                            {order.status !== 'Cancelled' && (
                              <Button size="sm" variant="outline">Download Invoice</Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderHistory;
