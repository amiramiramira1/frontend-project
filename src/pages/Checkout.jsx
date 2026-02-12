import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutProgress from "@/components/checkout/CheckoutProgress";
import DeliveryAddressForm from "@/components/checkout/DeliveryAddressForm";
import PaymentMethodForm from "@/components/checkout/PaymentMethodForm";
import OrderReviewStep from "@/components/checkout/OrderReviewStep";
import OrderSuccessModal from "@/components/checkout/OrderSuccessModal";

import boxClassic from "@/assets/box-classic.jpg";
import boxKeto from "@/assets/box-keto.jpg";

const orderItems = [
  { id: 1, name: 'Classic Comfort Box', image: boxClassic, price: 490, quantity: 1, servings: 2, mealsCount: 5 },
  { id: 2, name: 'Keto Power Box', image: boxKeto, price: 590, quantity: 1, servings: 2, mealsCount: 5 },
];

const Checkout = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    saveAsDefault: false,
    selectedAddressId: "home", // Default to first saved address
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 50;
  const total = subtotal + deliveryFee;

  const handleDeliveryChange = (field, value) => {
    setDeliveryInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectSavedAddress = (addressId) => {
    setDeliveryInfo((prev) => ({ ...prev, selectedAddressId: addressId }));
    setShowNewAddressForm(false);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleEditDelivery = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditPayment = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    
    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate order number
    const newOrderNumber = `BXF-${Date.now().toString(36).toUpperCase()}`;
    setOrderNumber(newOrderNumber);
    setIsLoading(false);
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate("/order-confirmation");
  };

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
          <CheckoutProgress currentStep={currentStep} />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {currentStep === 1 && (
                <DeliveryAddressForm
                  deliveryInfo={deliveryInfo}
                  onChange={handleDeliveryChange}
                  onSelectSavedAddress={handleSelectSavedAddress}
                  showNewAddressForm={showNewAddressForm}
                  onToggleNewAddress={() => setShowNewAddressForm(!showNewAddressForm)}
                />
              )}
              
              {currentStep === 2 && (
                <PaymentMethodForm
                  paymentMethod={paymentMethod}
                  onChange={setPaymentMethod}
                />
              )}
              
              {currentStep === 3 && (
                <OrderReviewStep
                  orderItems={orderItems}
                  deliveryInfo={deliveryInfo}
                  paymentMethod={paymentMethod}
                  onEditDelivery={handleEditDelivery}
                  onEditPayment={handleEditPayment}
                  total={total}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="order-2 sm:order-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                {currentStep < 3 ? (
                  <Button 
                    onClick={handleNext}
                    className="order-1 sm:order-2"
                  >
                    {currentStep === 1 ? 'Continue to Payment' : 'Continue to Review'}
                  </Button>
                ) : (
                  <div className="order-1 sm:order-2 space-y-3">
                    <Button
                      size="lg"
                      onClick={handlePlaceOrder}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing Order...
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      By placing order, you agree to our{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms & Conditions
                      </Link>
                    </p>
                  </div>
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
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.mealsCount} meals • {item.servings} people
                        </p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {(item.price * item.quantity).toLocaleString()} EGP
                      </p>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{subtotal.toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      {deliveryFee === 0 ? (
                        <span className="text-primary font-medium">Free</span>
                      ) : (
                        <span>{deliveryFee} EGP</span>
                      )}
                    </div>
                    {subtotal < 500 && (
                      <p className="text-xs text-muted-foreground">
                        Add {(500 - subtotal).toLocaleString()} EGP more for free delivery
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span className="text-primary">{total.toLocaleString()} EGP</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Success Modal */}
      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        orderNumber={orderNumber}
      />
    </div>
  );
};

export default Checkout;
