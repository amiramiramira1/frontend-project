import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Check, Pause, SkipForward, Calendar, Plus, Shuffle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { boxesData } from '@/data/boxesData';

const servingsOptions = [1, 2, 4, 6];

const SubscribeBox = () => {
  const { slug } = useParams<{ slug: string }>();
  const box = boxesData.find((b) => b.slug === slug);

  const [frequency, setFrequency] = useState('weekly');
  const [selectedServings, setSelectedServings] = useState(2);
  const [rotationPattern, setRotationPattern] = useState('sequential');
  const [extraMealIds, setExtraMealIds] = useState<number[]>([]);

  // Build a pool of all meals across all boxes for "add more meals" modal
  const allMeals = useMemo(() => {
    const currentMealNames = box?.meals.map((m) => m.name) || [];
    return boxesData
      .flatMap((b) => b.meals)
      .filter((m, i, arr) => arr.findIndex((x) => x.name === m.name) === i)
      .filter((m) => !currentMealNames.includes(m.name));
  }, [box]);

  if (!box) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Box Not Found</h1>
          <Button asChild><Link to="/boxes">Browse All Boxes</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const pricePerServing = Math.round(box.price * 3.8);
  const totalServings = box.mealsPerWeek * selectedServings;
  const pricePerDelivery = pricePerServing * totalServings;
  const firstDelivery = new Date(Date.now() + 4 * 86400000);
  const deliveryDay = firstDelivery.toLocaleDateString('en-US', { weekday: 'long' });
  const totalMealPool = box.mealsPerWeek + extraMealIds.length;

  const toggleExtraMeal = (id: number) => {
    setExtraMealIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/boxes">Boxes</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/box/${box.slug}`}>{box.name}</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Subscribe</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-['Poppins'] mb-2">
            Subscribe to {box.name}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">Get fresh meals delivered every week</p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Configuration */}
            <div className="lg:col-span-2 space-y-8">
              {/* Box Summary */}
              <Card>
                <CardContent className="p-4 flex gap-4">
                  <img src={box.image} alt={box.name} className="w-20 h-20 rounded-lg object-cover" />
                  <div>
                    <h3 className="font-bold text-foreground font-['Poppins']">{box.name}</h3>
                    <p className="text-sm text-muted-foreground">{box.mealsPerWeek} meals · {box.dietType.join(', ')}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-secondary text-secondary" />
                      <span className="text-sm font-medium">{box.rating}</span>
                      <span className="text-xs text-muted-foreground">({box.reviews})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Frequency */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Frequency</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={frequency} onValueChange={setFrequency} className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary transition-colors">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                        <span className="font-medium">Weekly</span>
                        <Badge className="ml-2 bg-primary/10 text-primary border-0">Recommended</Badge>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border opacity-50">
                      <RadioGroupItem value="monthly" id="monthly" disabled />
                      <Label htmlFor="monthly" className="flex-1 cursor-not-allowed">
                        <span className="font-medium">Monthly</span>
                        <Badge variant="outline" className="ml-2">Coming Soon</Badge>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Servings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">For how many people?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {servingsOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedServings(s)}
                        className={`relative flex-1 py-3 rounded-xl text-center font-bold transition-all ${
                          selectedServings === s
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-muted text-foreground hover:bg-accent'
                        }`}
                      >
                        {s}
                        {s === 2 && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full whitespace-nowrap">
                            ⭐ Popular
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Meal Variety */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Meal Variety</CardTitle>
                  <CardDescription>Pick extra meals to rotate through for variety (up to 5 more)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {box.meals.map((meal) => (
                      <Badge key={meal.id} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {meal.name}
                      </Badge>
                    ))}
                    {extraMealIds.map((id) => {
                      const meal = allMeals.find((m) => m.id === id);
                      return meal ? (
                        <Badge key={`extra-${id}`} variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                          + {meal.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add More Meals
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Meals to Rotation</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 mt-4">
                        {allMeals.map((meal) => (
                          <label
                            key={meal.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={extraMealIds.includes(meal.id)}
                              onCheckedChange={() => toggleExtraMeal(meal.id)}
                              disabled={!extraMealIds.includes(meal.id) && extraMealIds.length >= 5}
                            />
                            <img src={meal.image} alt={meal.name} className="w-10 h-10 rounded object-cover" />
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground">{meal.name}</p>
                              <p className="text-xs text-muted-foreground">{meal.calories} cal</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Rotation Pattern</p>
                    <RadioGroup value={rotationPattern} onValueChange={setRotationPattern} className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="sequential" id="sequential" />
                        <Label htmlFor="sequential" className="cursor-pointer">
                          <span className="font-medium">Sequential</span>
                          <span className="text-sm text-muted-foreground ml-2">— cycle through all meals</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="random" id="random" />
                        <Label htmlFor="random" className="cursor-pointer">
                          <Shuffle className="h-4 w-4 inline mr-1" />
                          <span className="font-medium">Random</span>
                          <span className="text-sm text-muted-foreground ml-2">— surprise me each week!</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Day */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Schedule</CardTitle>
                  <CardDescription>Your first delivery will arrive in 3-5 days. Future deliveries will be on the same weekday.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">
                        First delivery: {firstDelivery.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Then every {deliveryDay}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Pricing Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="font-['Poppins']">Subscription Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {totalMealPool > box.mealsPerWeek && (
                    <div className="text-sm text-muted-foreground">
                      Meal pool: {totalMealPool} meals
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Price per serving</span>
                    <span>{pricePerServing} EGP</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Servings per delivery</span>
                    <span>{box.mealsPerWeek} × {selectedServings} = {totalServings}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Frequency</span>
                    <span className="capitalize">{frequency}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Per delivery</span>
                    <span>{pricePerDelivery} EGP</span>
                  </div>

                  <Badge className="w-full justify-center bg-secondary/10 text-secondary border-0 py-1">
                    🎉 First delivery FREE
                  </Badge>

                  <Button variant="default" size="lg" className="w-full">
                    Start Subscription
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-foreground">Benefits</h4>
                    {[
                      { icon: Pause, text: 'Pause or cancel anytime' },
                      { icon: ArrowRight, text: 'Change servings as needed' },
                      { icon: SkipForward, text: 'Skip a week if you\'re away' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        {text}
                      </div>
                    ))}
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

export default SubscribeBox;
