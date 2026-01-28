import { Link } from 'react-router-dom';
import { CheckCircle2, Package, Calendar, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import boxClassic from '@/assets/box-classic.jpg';
import boxKeto from '@/assets/box-keto.jpg';

const orderDetails = {
  orderNumber: 'BOX-2024-78542',
  orderDate: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  deliveryAddress: {
    name: 'John Doe',
    address: '123 Main Street, Apt 4B',
    city: 'New York, NY 10001',
    phone: '+1 (555) 123-4567',
  },
  paymentMethod: 'Cash on Delivery',
  items: [
    { id: 1, name: 'Classic Comfort Box', image: boxClassic, price: 89.99, quantity: 1 },
    { id: 2, name: 'Keto Power Box', image: boxKeto, price: 109.99, quantity: 1 },
  ],
};

const OrderConfirmation = () => {
  const subtotal = orderDetails.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-['Poppins'] mb-3">
              Order Confirmed!
            </h1>
            <p className="text-lg text-muted-foreground">
              Thank you for your order. We've received your request and are preparing your meal boxes.
            </p>
          </div>

          {/* Order Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-bold text-foreground">{orderDetails.orderNumber}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/10 border-secondary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                  <p className="font-bold text-foreground">{orderDetails.estimatedDelivery}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-['Poppins']">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Items */}
              <div className="space-y-3">
                {orderDetails.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-primary">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              {/* Delivery & Payment Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Delivery Address</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">{orderDetails.deliveryAddress.name}</p>
                    <p>{orderDetails.deliveryAddress.address}</p>
                    <p>{orderDetails.deliveryAddress.city}</p>
                    <p>{orderDetails.deliveryAddress.phone}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Payment Method</h4>
                  <p className="text-sm text-muted-foreground">{orderDetails.paymentMethod}</p>
                  <p className="text-sm text-muted-foreground mt-2">Order Date: {orderDetails.orderDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg" asChild>
              <Link to="/dashboard/orders">
                <Package className="h-5 w-5 mr-2" />
                Track Order
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/boxes">
                <Home className="h-5 w-5 mr-2" />
                Continue Shopping
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Questions about your order?{' '}
            <Link to="/contact" className="text-primary hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
