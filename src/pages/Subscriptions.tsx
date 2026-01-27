import { RefreshCw, Pause, Play, X, Calendar, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock subscription data
const subscriptions = [
  {
    id: 'SUB-001',
    box: 'Classic Balanced Box',
    price: 49.99,
    frequency: 'Weekly',
    status: 'Active',
    nextDelivery: 'Jan 30, 2026',
    startDate: 'Dec 1, 2025',
    mealsPerWeek: 5,
  },
  {
    id: 'SUB-002',
    box: 'Vegan Delight Box',
    price: 54.99,
    frequency: 'Bi-weekly',
    status: 'Active',
    nextDelivery: 'Feb 2, 2026',
    startDate: 'Nov 15, 2025',
    mealsPerWeek: 5,
  },
];

const pastSubscriptions = [
  {
    id: 'SUB-003',
    box: 'Keto Power Box',
    price: 59.99,
    frequency: 'Weekly',
    status: 'Cancelled',
    endDate: 'Dec 15, 2025',
    startDate: 'Oct 1, 2025',
  },
];

const Subscriptions = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Poppins'] text-foreground">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">Manage your meal box subscriptions</p>
      </div>

      {/* Active Subscriptions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Subscriptions</h2>
        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {subscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{sub.box}</CardTitle>
                      <CardDescription>{sub.id}</CardDescription>
                    </div>
                    <Badge variant="default" className="bg-primary">
                      {sub.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-semibold">${sub.price}/delivery</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="font-semibold">{sub.frequency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Delivery</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {sub.nextDelivery}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Meals/Week</p>
                      <p className="font-semibold">{sub.mealsPerWeek} meals</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline">
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-1" />
                      Skip Next
                    </Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Change Box
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Active Subscriptions</h3>
              <p className="text-muted-foreground mb-4">Start saving with a weekly meal subscription</p>
              <Button>Browse Boxes</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Subscriptions */}
      {pastSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Past Subscriptions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pastSubscriptions.map((sub) => (
              <Card key={sub.id} className="opacity-70">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{sub.box}</CardTitle>
                      <CardDescription>{sub.id}</CardDescription>
                    </div>
                    <Badge variant="outline">{sub.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-semibold">${sub.price}/delivery</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="font-semibold">{sub.frequency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Started</p>
                      <p className="font-semibold">{sub.startDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ended</p>
                      <p className="font-semibold">{sub.endDate}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-border">
                    <Button size="sm" variant="default">
                      <Play className="h-4 w-4 mr-1" />
                      Reactivate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Billing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Monthly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">This Month</p>
              <p className="text-2xl font-bold">$159.97</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Last Month</p>
              <p className="text-2xl font-bold">$214.96</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Saved</p>
              <p className="text-2xl font-bold text-primary">$89.40</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscriptions;
