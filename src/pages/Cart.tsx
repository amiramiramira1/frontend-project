import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import boxClassic from '@/assets/box-classic.jpg';
import boxKeto from '@/assets/box-keto.jpg';
import boxVegan from '@/assets/box-vegan.jpg';

interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  mealsPerWeek: number;
  isSubscription: boolean;
}

const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: 'Classic Comfort Box',
    image: boxClassic,
    price: 89.99,
    quantity: 1,
    mealsPerWeek: 5,
    isSubscription: true,
  },
  {
    id: 2,
    name: 'Keto Power Box',
    image: boxKeto,
    price: 109.99,
    quantity: 1,
    mealsPerWeek: 5,
    isSubscription: false,
  },
  {
    id: 3,
    name: 'Plant-Based Vegan Box',
    image: boxVegan,
    price: 94.99,
    quantity: 2,
    mealsPerWeek: 5,
    isSubscription: true,
  },
];

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + deliveryFee;

  const EmptyCart = () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2 font-['Poppins']">
        Your cart is empty
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Looks like you haven't added any meal boxes yet. Explore our delicious
        options and start your healthy eating journey!
      </p>
      <Button variant="default" size="lg" asChild>
        <Link to="/boxes">Browse Boxes</Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/boxes"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-['Poppins']">
              Shopping Cart
            </h1>
            {cartItems.length > 0 && (
              <p className="text-muted-foreground mt-2">
                {cartItems.length} item{cartItems.length > 1 ? 's' : ''} in your
                cart
              </p>
            )}
          </div>

          {cartItems.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="font-semibold text-foreground text-lg font-['Poppins']">
                                {item.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {item.mealsPerWeek} meals per week
                              </p>
                              {item.isSubscription && (
                                <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  Weekly Subscription
                                </span>
                              )}
                            </div>
                            <p className="text-lg font-bold text-foreground whitespace-nowrap">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>

                          {/* Quantity & Remove */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium text-foreground">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="font-['Poppins']">
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span>
                        {deliveryFee === 0 ? (
                          <span className="text-primary">Free</span>
                        ) : (
                          `$${deliveryFee.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    {deliveryFee > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Free delivery on orders over $100
                      </p>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-foreground">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>

                    <Button
                      variant="default"
                      size="lg"
                      className="w-full mt-4"
                      asChild
                    >
                      <Link to="/checkout">Proceed to Checkout</Link>
                    </Button>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Secure checkout powered by industry-standard encryption
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
