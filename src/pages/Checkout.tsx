import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Banknote, MapPin, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import boxClassic from '@/assets/box-classic.jpg';
import boxKeto from '@/assets/box-keto.jpg';

const steps = [
  { id: 1, name: 'Delivery', icon: MapPin },
  { id: 2, name: 'Payment', icon: CreditCard },
  { id: 3, name: 'Review', icon: ClipboardList },
];

const orderItems = [
  { id: 1, name: 'Classic Comfort Box', image: boxClassic, price: 89.99, quantity: 1 },
  { id: 2, name: 'Keto Power Box', image: boxKeto, price: 109.99, quantity: 1 },
];

const Checkout = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    instructions: '',
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const handleDeliveryChange = (field: string, value: string) => {
    setDeliveryInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = () => {
    navigate('/order-confirmation');
  };

  const ProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`mt-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 md:w-24 h-1 mx-2 rounded transition-colors ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const DeliveryForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-['Poppins']">
          <MapPin className="h-5 w-5 text-primary" />
          Delivery Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={deliveryInfo.fullName}
              onChange={(e) => handleDeliveryChange('fullName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              value={deliveryInfo.phone}
              onChange={(e) => handleDeliveryChange('phone', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            placeholder="123 Main Street, Apt 4B"
            value={deliveryInfo.address}
            onChange={(e) => handleDeliveryChange('address', e.target.value)}
          />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="New York"
              value={deliveryInfo.city}
              onChange={(e) => handleDeliveryChange('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="NY"
              value={deliveryInfo.state}
              onChange={(e) => handleDeliveryChange('state', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              placeholder="10001"
              value={deliveryInfo.zipCode}
              onChange={(e) => handleDeliveryChange('zipCode', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
          <Input
            id="instructions"
            placeholder="Leave at the door, ring the bell, etc."
            value={deliveryInfo.instructions}
            onChange={(e) => handleDeliveryChange('instructions', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );

  const PaymentForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-['Poppins']">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
          <div
            className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
              paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onClick={() => setPaymentMethod('cod')}
          >
            <RadioGroupItem value="cod" id="cod" />
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="cod" className="font-semibold cursor-pointer">
                  Cash on Delivery
                </Label>
                <p className="text-sm text-muted-foreground">
                  Pay when your order arrives
                </p>
              </div>
            </div>
          </div>

          <div
            className="flex items-center space-x-4 p-4 rounded-lg border-2 border-border opacity-50 cursor-not-allowed"
          >
            <RadioGroupItem value="card" id="card" disabled />
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor="card" className="font-semibold text-muted-foreground">
                  Credit/Debit Card
                </Label>
                <p className="text-sm text-muted-foreground">
                  Coming soon
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );

  const OrderReview = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-['Poppins']">
          <ClipboardList className="h-5 w-5 text-primary" />
          Order Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Summary */}
        <div>
          <h4 className="font-semibold text-foreground mb-2">Delivery Address</h4>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium text-foreground">
              {deliveryInfo.fullName || 'John Doe'}
            </p>
            <p className="text-muted-foreground">
              {deliveryInfo.address || '123 Main Street, Apt 4B'}
            </p>
            <p className="text-muted-foreground">
              {deliveryInfo.city || 'New York'}, {deliveryInfo.state || 'NY'}{' '}
              {deliveryInfo.zipCode || '10001'}
            </p>
            <p className="text-muted-foreground">
              {deliveryInfo.phone || '+1 (555) 123-4567'}
            </p>
          </div>
        </div>

        {/* Payment Summary */}
        <div>
          <h4 className="font-semibold text-foreground mb-2">Payment Method</h4>
          <div className="bg-muted/50 rounded-lg p-4 text-sm flex items-center gap-3">
            <Banknote className="h-5 w-5 text-primary" />
            <span className="text-foreground">Cash on Delivery</span>
          </div>
        </div>

        {/* Items Summary */}
        <div>
          <h4 className="font-semibold text-foreground mb-2">Order Items</h4>
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-['Poppins']">
              Checkout
            </h1>
          </div>

          {/* Progress Indicator */}
          <ProgressIndicator />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {currentStep === 1 && <DeliveryForm />}
              {currentStep === 2 && <PaymentForm />}
              {currentStep === 3 && <OrderReview />}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                {currentStep < 3 ? (
                  <Button variant="default" onClick={handleNext}>
                    Continue
                  </Button>
                ) : (
                  <Button variant="default" size="lg" onClick={handlePlaceOrder}>
                    Place Order
                  </Button>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="font-['Poppins']">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span className="text-primary">Free</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
