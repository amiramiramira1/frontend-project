import { CreditCard, Banknote, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentMethodFormProps {
  paymentMethod: string;
  onChange: (value: string) => void;
}

const PaymentMethodForm = ({ paymentMethod, onChange }: PaymentMethodFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-['Poppins']">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={paymentMethod} onValueChange={onChange} className="space-y-4">
          {/* Cash on Delivery */}
          <div
            className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
              paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onClick={() => onChange('cod')}
          >
            <RadioGroupItem value="cod" id="cod" className="mt-1" />
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Banknote className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Label htmlFor="cod" className="font-semibold cursor-pointer text-foreground">
                  Cash on Delivery
                </Label>
                <p className="text-sm text-muted-foreground">
                  Pay with cash when your order arrives
                </p>
              </div>
            </div>
          </div>

          {/* Card Payment - Disabled */}
          <div className="flex items-start space-x-4 p-4 rounded-lg border-2 border-border opacity-60 cursor-not-allowed">
            <RadioGroupItem value="card" id="card" disabled className="mt-1" />
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="card" className="font-semibold text-muted-foreground">
                    Credit/Debit Card
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Visa, Mastercard, and more
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>

        {/* Info Box for COD */}
        {paymentMethod === 'cod' && (
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              Pay when your box arrives at your door. Please have the exact amount ready for faster delivery.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodForm;
