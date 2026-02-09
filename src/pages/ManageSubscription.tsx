import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Pause, Play, X, Shuffle, ArrowRight, SkipForward, Edit2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import boxMediterranean from '@/assets/box-mediterranean.jpg';
import boxClassic from '@/assets/box-classic.jpg';
import boxKeto from '@/assets/box-keto.jpg';
import boxVegan from '@/assets/box-vegan.jpg';
import boxAsian from '@/assets/box-asian.jpg';

const subscription = {
  id: 'SUB-001',
  boxName: 'Mediterranean Box',
  boxImage: boxMediterranean,
  status: 'Active' as const,
  frequency: 'Weekly',
  servings: 2,
  price: 565,
  startDate: 'Jan 15, 2026',
  nextDelivery: 'Feb 12, 2026',
  deliveryDay: 'Every Monday',
  address: '45 El-Tahrir Street, Apt 12, Cairo',
  mealsPerDelivery: 5,
  rotationPattern: 'sequential' as 'sequential' | 'random',
  mealPool: [
    { id: 1, name: 'Greek Chicken Souvlaki', image: boxMediterranean },
    { id: 2, name: 'Grilled Sea Bass', image: boxMediterranean },
    { id: 3, name: 'Lamb Kofta Plate', image: boxMediterranean },
    { id: 4, name: 'Shrimp Paella', image: boxMediterranean },
    { id: 5, name: 'Stuffed Bell Peppers', image: boxVegan },
    { id: 6, name: 'Grilled Chicken Quinoa Bowl', image: boxClassic },
    { id: 7, name: 'Salmon with Brown Rice', image: boxMediterranean },
    { id: 8, name: 'Teriyaki Chicken Bowl', image: boxAsian },
    { id: 9, name: 'Bacon Wrapped Chicken', image: boxKeto },
    { id: 10, name: 'Buddha Bowl', image: boxVegan },
  ],
};

const deliveryHistory = [
  { id: 'ORD-045', date: 'Feb 3, 2026', status: 'Delivered', amount: 565 },
  { id: 'ORD-038', date: 'Jan 27, 2026', status: 'Delivered', amount: 565 },
  { id: 'ORD-031', date: 'Jan 20, 2026', status: 'Delivered', amount: 565 },
  { id: 'ORD-024', date: 'Jan 15, 2026', status: 'Delivered', amount: 0 },
];

const pauseReasons = [
  'Going on vacation',
  'Too much food left over',
  'Budget reasons',
  'Want to try cooking myself',
  'Other',
];

const ManageSubscription = () => {
  const [servings, setServings] = useState(String(subscription.servings));
  const [isRandom, setIsRandom] = useState(subscription.rotationPattern === 'random');
  const [hasChanges, setHasChanges] = useState(false);

  const handleServingsChange = (val: string) => {
    setServings(val);
    setHasChanges(true);
  };

  const handlePatternToggle = (val: boolean) => {
    setIsRandom(val);
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <img src={subscription.boxImage} alt={subscription.boxName} className="w-16 h-16 rounded-lg object-cover" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground font-['Poppins']">
                  {subscription.boxName} Subscription
                </h1>
                <p className="text-sm text-muted-foreground">{subscription.id}</p>
              </div>
            </div>
            <Badge className="self-start bg-primary text-primary-foreground">{subscription.status}</Badge>
          </div>

          <Tabs defaultValue="delivery" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="meals">Meals</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="space-y-4">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                    <Calendar className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Next Delivery</p>
                      <p className="text-xl font-bold text-foreground">{subscription.nextDelivery}</p>
                      <p className="text-sm text-muted-foreground">{subscription.deliveryDay}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Delivery Address</p>
                      <p className="text-sm text-muted-foreground">{subscription.address}</p>
                    </div>
                    <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4 mr-1" /> Change</Button>
                  </div>

                  <Button variant="outline" className="w-full">
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip Next Delivery
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="font-semibold text-foreground">{subscription.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Servings</p>
                      <Select value={servings} onValueChange={handleServingsChange}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 4, 6].map((s) => (
                            <SelectItem key={s} value={String(s)}>{s} {s === 1 ? 'person' : 'people'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price per Delivery</p>
                      <p className="font-semibold text-foreground">{subscription.price} EGP</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-semibold text-foreground">{subscription.startDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Meals Tab */}
            <TabsContent value="meals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Meal Pool ({subscription.mealPool.length} meals)</CardTitle>
                  <CardDescription>Meals per delivery: {subscription.mealsPerDelivery}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {subscription.mealPool.map((meal) => (
                      <div key={meal.id} className="text-center">
                        <img src={meal.image} alt={meal.name} className="w-full aspect-square rounded-lg object-cover mb-1" />
                        <p className="text-xs text-foreground font-medium line-clamp-2">{meal.name}</p>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm"><Edit2 className="h-4 w-4 mr-1" /> Edit Meal Pool</Button>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="rotation" className="font-medium">Random Rotation</Label>
                      <p className="text-sm text-muted-foreground">
                        {isRandom ? 'Surprise me each week!' : 'Cycle through meals sequentially'}
                      </p>
                    </div>
                    <Switch id="rotation" checked={isRandom} onCheckedChange={handlePatternToggle} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Delivery History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Order #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryHistory.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>{d.date}</TableCell>
                          <TableCell className="font-medium">{d.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-primary border-primary/20">{d.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {d.amount === 0 ? <span className="text-primary">Free</span> : `${d.amount} EGP`}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-8">
            {hasChanges && (
              <Button variant="default">
                Update Subscription
              </Button>
            )}

            {/* Pause Dialog */}
            <PauseDialog />

            {/* Cancel Dialog */}
            <CancelDialog />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const PauseDialog = () => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-secondary border-secondary/30 hover:bg-secondary/10">
          <Pause className="h-4 w-4 mr-2" />
          Pause Subscription
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to pause?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Your subscription will be paused and no deliveries will be made until you resume.
        </p>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Help us understand why:</p>
          {pauseReasons.map((reason) => (
            <label key={reason} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={selectedReasons.includes(reason)}
                onCheckedChange={(checked) =>
                  setSelectedReasons((prev) =>
                    checked ? [...prev, reason] : prev.filter((r) => r !== reason)
                  )
                }
              />
              {reason}
            </label>
          ))}
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Keep Active</Button>
          </DialogClose>
          <Button variant="secondary">Pause Subscription</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CancelDialog = () => {
  const [feedback, setFeedback] = useState('');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
          <X className="h-4 w-4 mr-2" />
          Cancel Subscription
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Subscription?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          We're sorry to see you go. Your subscription will be cancelled at the end of your current billing period.
        </p>
        <div>
          <Label htmlFor="feedback" className="text-sm font-medium">What could we do better?</Label>
          <Textarea
            id="feedback"
            placeholder="Share your feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="mt-2"
          />
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Keep Subscription</Button>
          </DialogClose>
          <Button variant="destructive">Cancel Subscription</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSubscription;
