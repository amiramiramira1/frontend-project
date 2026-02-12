import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * @typedef {Object} OrderSuccessModalProps
 * @property {boolean} isOpen - Whether the modal is open
 * @property {() => void} onClose - Function to close the modal
 * @property {string} orderNumber - The order number to display
 */

/**
 * OrderSuccessModal component for displaying order confirmation
 * @param {OrderSuccessModalProps} props - Component props
 */
const OrderSuccessModal = ({ isOpen, onClose, orderNumber }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center space-y-4">
          {/* Success Animation */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
              <CheckCircle className="h-12 w-12 text-primary animate-fade-in" />
            </div>
            <div className="absolute -inset-2 rounded-full border-4 border-primary/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          </div>
          
          <DialogTitle className="text-2xl font-['Poppins']">
            Order Placed Successfully!
          </DialogTitle>
          
          <DialogDescription className="text-base space-y-2">
            <p>Thank you for your order. We're preparing your delicious meals!</p>
            <p className="font-medium text-foreground">
              Order Number: <span className="text-primary">{orderNumber}</span>
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 mt-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Package className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">
              You'll receive an SMS confirmation shortly with tracking details.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button onClick={onClose} className="w-full">
            View Order Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/boxes'}>
            Continue Shopping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderSuccessModal;
