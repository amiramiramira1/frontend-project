import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RecommendedBoxes from "@/components/cart/RecommendedBoxes";

import boxClassic from "@/assets/box-classic.jpg";
import boxKeto from "@/assets/box-keto.jpg";
import boxVegan from "@/assets/box-vegan.jpg";

const initialCartItems = [
  {
    id: 1,
    name: 'Classic Balance',
    type: 'Pre-made',
    image: boxClassic,
    pricePerServing: 49,
    quantity: 1,
    mealsPerWeek: 5,
    servings: 2,
    isSubscription: true,
    meals: ['Grilled Chicken Quinoa Bowl', 'Salmon with Brown Rice', 'Turkey Meatballs & Pasta', 'Beef Stir Fry', 'Herb Crusted Cod'],
  },
  {
    id: 2,
    name: 'Keto Fuel',
    type: 'Pre-made',
    image: boxKeto,
    pricePerServing: 57,
    quantity: 1,
    mealsPerWeek: 5,
    servings: 2,
    isSubscription: false,
    meals: ['Bacon Wrapped Chicken', 'Salmon with Avocado Salsa', 'Beef Zucchini Lasagna', 'Shrimp Alfredo Zoodles', 'Pork Chops with Broccoli'],
  },
  {
    id: 3,
    name: 'Plant Power',
    type: 'Pre-made',
    image: boxVegan,
    pricePerServing: 46,
    quantity: 2,
    mealsPerWeek: 5,
    servings: 4,
    isSubscription: true,
    meals: ['Buddha Bowl', 'Tofu Teriyaki Stir Fry', 'Lentil Curry', 'Mediterranean Falafel Plate', 'Black Bean Burrito Bowl'],
  },
];

const servingsOptions = [1, 2, 4, 6];

const Cart = () => {
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [openMeals, setOpenMeals] = useState({});

  const updateQuantity = (id, delta) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const updateServings = (id, servings) => {
    setCartItems((items) =>
      items.map((item) => (item.id === id ? { ...item, servings } : item))
    );
  };

  const removeItem = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const getItemSubtotal = (item) =>
    item.pricePerServing * item.mealsPerWeek * item.servings * item.quantity;

  const subtotal = cartItems.reduce((sum, item) => sum + getItemSubtotal(item), 0);
  const deliveryFee = subtotal > 500 ? 0 : 50;
  const total = subtotal + deliveryFee;

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
              Shopping Cart {totalItems > 0 && `(${totalItems} item${totalItems > 1 ? "s" : ""})`}
            </h1>
          </div>

          {cartItems.length === 0 ? (
            <EmptyCart />
          ) : (
            <>
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {cartItems.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      isOpen={!!openMeals[item.id]}
                      onToggleMeals={() =>
                        setOpenMeals((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      onUpdateQuantity={(delta) => updateQuantity(item.id, delta)}
                      onUpdateServings={(s) => updateServings(item.id, s)}
                      onRemove={() => removeItem(item.id)}
                      subtotal={getItemSubtotal(item)}
                    />
                  ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle className="font-['Poppins']">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{subtotal} EGP</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Delivery</span>
                        <span>
                          {deliveryFee === 0 ? (
                            <span className="text-primary font-medium">Free</span>
                          ) : (
                            `${deliveryFee} EGP`
                          )}
                        </span>
                      </div>
                      {deliveryFee > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Free delivery on orders over 500 EGP
                        </p>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold text-primary">
                        <span>Total</span>
                        <span>{total} EGP</span>
                      </div>

                      <Button variant="default" size="lg" className="w-full mt-4" asChild>
                        <Link to="/checkout">Proceed to Checkout</Link>
                      </Button>

                      <div className="text-center">
                        <Link
                          to="/boxes"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          Continue Shopping
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recommended Boxes */}
              <RecommendedBoxes currentItemIds={cartItems.map((i) => i.id)} />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const EmptyCart = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
    </div>
    <h2 className="text-2xl font-bold text-foreground mb-2 font-['Poppins']">Your cart is empty</h2>
    <p className="text-muted-foreground mb-6 max-w-md">
      Browse our boxes to get started with fresh, chef-crafted meals delivered to your door!
    </p>
    <Button variant="default" size="lg" asChild>
      <Link to="/boxes">Browse Boxes</Link>
    </Button>
  </div>
);

const CartItemCard = ({
  item,
  isOpen,
  onToggleMeals,
  onUpdateQuantity,
  onUpdateServings,
  onRemove,
  subtotal,
}) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4 md:p-6">
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <div>
              <h3 className="font-semibold text-foreground text-lg font-['Poppins']">
                {item.name}
              </h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {item.type}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground whitespace-nowrap">
              {subtotal} EGP
            </p>
          </div>

          {/* Meals dropdown */}
          <Collapsible open={isOpen} onOpenChange={onToggleMeals}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm text-primary hover:underline mt-2">
              {item.mealsPerWeek} meals included
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                {item.meals.map((meal) => (
                  <li key={meal}>{meal}</li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* Servings & Price per serving */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Servings:</span>
              <Select
                value={String(item.servings)}
                onValueChange={(v) => onUpdateServings(Number(v))}
              >
                <SelectTrigger className="w-24 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {servingsOptions.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} {s === 1 ? 'person' : 'people'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground">
              {item.pricePerServing} EGP/serving
            </span>
          </div>

          {/* Quantity & Remove */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(-1)}
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
                onClick={() => onUpdateQuantity(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>

          {item.isSubscription && (
            <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Weekly Subscription
            </span>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Cart;
