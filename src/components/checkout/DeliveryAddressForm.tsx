import { MapPin, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const egyptianCities = [
  'Cairo',
  'Alexandria',
  'Giza',
  'Sharm El Sheikh',
  'Hurghada',
  'Luxor',
  'Aswan',
  'Port Said',
  'Suez',
  'Mansoura',
  'Tanta',
  'Ismailia',
  'Faiyum',
  'Zagazig',
  'Damietta',
];

const savedAddresses = [
  {
    id: 'home',
    label: 'Home',
    name: 'Ahmed Hassan',
    address: '15 El-Tahrir Street, Apt 4B',
    city: 'Cairo',
    postalCode: '11511',
    phone: '+20 100 123 4567',
  },
  {
    id: 'work',
    label: 'Work',
    name: 'Ahmed Hassan',
    address: 'Smart Village, Building B104',
    city: 'Giza',
    postalCode: '12577',
    phone: '+20 100 123 4567',
  },
];

export interface DeliveryInfo {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  saveAsDefault: boolean;
  selectedAddressId: string | null;
}

interface DeliveryAddressFormProps {
  deliveryInfo: DeliveryInfo;
  onChange: (field: string, value: string | boolean) => void;
  onSelectSavedAddress: (addressId: string) => void;
  showNewAddressForm: boolean;
  onToggleNewAddress: () => void;
}

const DeliveryAddressForm = ({
  deliveryInfo,
  onChange,
  onSelectSavedAddress,
  showNewAddressForm,
  onToggleNewAddress,
}: DeliveryAddressFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-['Poppins']">
          <MapPin className="h-5 w-5 text-primary" />
          Delivery Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Saved Addresses */}
        {savedAddresses.length > 0 && !showNewAddressForm && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Saved Addresses</Label>
            <RadioGroup
              value={deliveryInfo.selectedAddressId || ''}
              onValueChange={onSelectSavedAddress}
              className="space-y-3"
            >
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                    deliveryInfo.selectedAddressId === addr.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelectSavedAddress(addr.id)}
                >
                  <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{addr.label}</span>
                      {addr.id === 'home' && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{addr.name}</p>
                    <p className="text-sm text-muted-foreground">{addr.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {addr.city}, {addr.postalCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{addr.phone}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={onToggleNewAddress}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Address
            </Button>
          </div>
        )}

        {/* New Address Form */}
        {(showNewAddressForm || savedAddresses.length === 0) && (
          <div className="space-y-4">
            {savedAddresses.length > 0 && (
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">New Address</Label>
                <Button variant="ghost" size="sm" onClick={onToggleNewAddress}>
                  Use Saved Address
                </Button>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Ahmed Hassan"
                  value={deliveryInfo.fullName}
                  onChange={(e) => onChange('fullName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+20 100 123 4567"
                  value={deliveryInfo.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="15 El-Tahrir Street, Apt 4B"
                value={deliveryInfo.address}
                onChange={(e) => onChange('address', e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select
                  value={deliveryInfo.city}
                  onValueChange={(value) => onChange('city', value)}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {egyptianCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="11511"
                  value={deliveryInfo.postalCode}
                  onChange={(e) => onChange('postalCode', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="saveAsDefault"
                checked={deliveryInfo.saveAsDefault}
                onCheckedChange={(checked) => onChange('saveAsDefault', checked as boolean)}
              />
              <Label htmlFor="saveAsDefault" className="text-sm cursor-pointer">
                Save as default address
              </Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryAddressForm;
