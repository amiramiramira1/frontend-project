import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Package, Calendar, ArrowRight, Home, Mail, Clock, Truck, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import boxClassic from "@/assets/box-classic.jpg";
import boxKeto from "@/assets/box-keto.jpg";

const orderDetails = {
  orderNumber: "BOX-2026-001",
  orderDate: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  estimatedDelivery: `${new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
  deliveryAddress: {
    name: "Ahmed Hassan",
    address: "45 El-Tahrir Street, Apt 12",
    city: "Cairo, Egypt",
    phone: "+20 100 123 4567",
  },
  paymentMethod: "Cash on Delivery",
  email: "ahmed@email.com",
  items: [
    { id: 1, name: "Classic Balance Box", image: boxClassic, price: 490, quantity: 1, servings: 2 },
    { id: 2, name: "Keto Fuel Box", image: boxKeto, price: 570, quantity: 1, servings: 2 },
  ],
};

const timelineSteps = [
  { label: "Order Confirmed", icon: CheckCircle2, status: "done" },
  { label: "Preparing Your Box", icon: ChefHat, status: "current" },
  { label: "Out for Delivery", icon: Truck, status: "upcoming" },
  { label: "Delivered", icon: Package, status: "upcoming" },
];

const OrderConfirmation = () => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const subtotal = orderDetails.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 500 ? 0 : 50;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                backgroundColor: ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(160 84% 60%)', 'hsl(38 92% 70%)'][i % 4],
                animation: `fall ${2 + Math.random() * 3}s ease-in ${Math.random() * 2}s forwards`,
                opacity: 0.8,
              }}
            />
          ))}
          <style>{`
            @keyframes fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Success Header */}
          <div className="text-center mb-10 animate-scale-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-['Poppins'] mb-3">
              Order Placed Successfully!
            </h1>
            <p className="text-xl font-bold text-foreground mb-2">
              Order #{orderDetails.orderNumber}
            </p>
            <p className="text-muted-foreground">
              Thank you for your order. We'll deliver fresh ingredients to your door.
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

          {/* What's Next Timeline */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-['Poppins']">What's Next</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {timelineSteps.map((step, index) => (
                  <div key={step.label} className="flex md:flex-col items-center gap-3 md:gap-2 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.status === 'done'
                          ? 'bg-primary text-primary-foreground'
                          : step.status === 'current'
                          ? 'bg-secondary text-secondary-foreground animate-pulse'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-sm font-medium text-center ${
                        step.status === 'done'
                          ? 'text-primary'
                          : step.status === 'current'
                          ? 'text-secondary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                      {step.status === 'done' && ' ✓'}
                    </span>
                    {index < timelineSteps.length - 1 && (
                      <div className="hidden md:block h-0.5 w-full bg-border flex-1" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Details Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-['Poppins']">Order Details</CardTitle>
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
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} · {item.servings} people
                      </p>
                    </div>
                    <p className="font-bold text-foreground">
                      {(item.price * item.quantity)} EGP
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{subtotal} EGP</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-primary font-medium' : ''}>
                    {deliveryFee === 0 ? 'Free' : `${deliveryFee} EGP`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Total</span>
                  <span>{total} EGP</span>
                </div>
              </div>

              <Separator />

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
                  <p className="text-sm text-muted-foreground mt-2">
                    Order Date: {orderDetails.orderDate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg" asChild>
              <Link to="/dashboard/orders">
                <Package className="h-5 w-5 mr-2" />
                Track Your Order
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

          {/* Email Confirmation Note */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <Mail className="h-4 w-4" />
              A confirmation email has been sent to {orderDetails.email}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
