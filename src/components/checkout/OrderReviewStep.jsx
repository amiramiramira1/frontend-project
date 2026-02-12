import { ClipboardList, MapPin, CreditCard, Banknote, Pencil, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
/**
 * @typedef {Object} OrderItem
 * @property {number} id - The unique identifier for the order item
 * @property {string} name - The name of the item
 * @property {string} image - URL of the item's image
 * @property {number} price - Price of a single item
 * @property {number} quantity - Number of items
 * @property {number} [servings] - Optional number of servings
 * @property {number} [mealsCount] - Optional number of meals
 */

/**
 * @typedef {Object} OrderReviewStepProps
 * @property {OrderItem[]} orderItems - Array of order items
 * @property {Object} deliveryInfo - Delivery information
 * @property {string} paymentMethod - Selected payment method
 * @property {() => void} onEditDelivery - Handler for editing delivery info
 * @property {() => void} onEditPayment - Handler for editing payment method
 * @property {number} total - Total order amount
 */

/**
 * OrderReviewStep component for reviewing order details before submission
 * @param {OrderReviewStepProps} props - Component props
 */
const OrderReviewStep = ({
  orderItems,
  deliveryInfo,
  paymentMethod,
  onEditDelivery,
  onEditPayment,
  total,
}) => {
  // Calculate estimated delivery date (3-5 days from now)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 3);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 5);
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-['Poppins']">
          <ClipboardList className="h-5 w-5 text-primary" />
          Review Your Order
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground">Order Items</h4>
          </div>
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.mealsCount && `${item.mealsCount} meals • `}
                    {item.servings && `${item.servings} people • `}
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-foreground">
                  {(item.price * item.quantity).toLocaleString()} EGP
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Delivery Address */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Delivery Address
            </h4>
            <Button variant="ghost" size="sm" onClick={onEditDelivery}>
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium text-foreground">
              {deliveryInfo.fullName || 'Ahmed Hassan'}
            </p>
            <p className="text-muted-foreground">
              {deliveryInfo.address || '15 El-Tahrir Street, Apt 4B'}
            </p>
            <p className="text-muted-foreground">
              {deliveryInfo.city || 'Cairo'}, {deliveryInfo.postalCode || '11511'}
            </p>
            <p className="text-muted-foreground">
              {deliveryInfo.phone || '+20 100 123 4567'}
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment Method
            </h4>
            <Button variant="ghost" size="sm" onClick={onEditPayment}>
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-sm flex items-center gap-3">
            <Banknote className="h-5 w-5 text-primary" />
            <span className="text-foreground">
              {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card'}
            </span>
          </div>
        </div>

        {/* Delivery Estimate */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Estimated Delivery</p>
              <p className="font-semibold text-foreground">
                {formatDate(startDate)} - {formatDate(endDate)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-foreground">Total</span>
          <span className="text-2xl font-bold text-primary">
            {total.toLocaleString()} EGP
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderReviewStep;
