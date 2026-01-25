import { useParams, Link } from 'react-router-dom';
import { Star, ArrowLeft, ShoppingCart, Calendar, Flame, Beef, Wheat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MealCard from '@/components/MealCard';
import { boxesData } from '@/data/boxesData';

const BoxDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const box = boxesData.find((b) => b.slug === slug);

  if (!box) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Box Not Found</h1>
          <p className="text-muted-foreground mb-8">The box you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/boxes">Browse All Boxes</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Back Button */}
          <Link
            to="/boxes"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Boxes
          </Link>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden">
              <img
                src={box.image}
                alt={box.name}
                className="w-full h-full object-cover"
              />
              {box.tag && (
                <span className="absolute top-6 left-6 bg-secondary text-secondary-foreground text-sm font-bold px-4 py-2 rounded-full">
                  {box.tag}
                </span>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(box.rating)
                          ? 'fill-secondary text-secondary'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{box.rating}</span>
                <span className="text-muted-foreground">({box.reviews} reviews)</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground font-['Poppins'] mb-4">
                {box.name}
              </h1>

              {/* Description */}
              <p className="text-muted-foreground text-lg mb-6">
                {box.longDescription}
              </p>

              {/* Diet Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {box.dietType.map((diet) => (
                  <span
                    key={diet}
                    className="bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-full"
                  >
                    {diet}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">${box.price}</span>
                  <span className="text-muted-foreground">/meal</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {box.mealsPerWeek} meals per week • ${(box.price * box.mealsPerWeek).toFixed(2)}/week
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button variant="cta" size="xl" className="flex-1">
                  <Calendar className="h-5 w-5 mr-2" />
                  Subscribe Weekly
                </Button>
                <Button variant="outline" size="xl" className="flex-1">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  One-Time Purchase
                </Button>
              </div>

              {/* Nutrition Card */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Nutrition Info (per meal avg.)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10 mx-auto mb-2">
                        <Flame className="h-5 w-5 text-secondary" />
                      </div>
                      <p className="text-xl font-bold text-foreground">{box.nutrition.calories}</p>
                      <p className="text-xs text-muted-foreground">Calories</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mx-auto mb-2">
                        <Beef className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-xl font-bold text-foreground">{box.nutrition.protein}g</p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted mx-auto mb-2">
                        <Wheat className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-xl font-bold text-foreground">{box.nutrition.carbs}g</p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted mx-auto mb-2">
                        <div className="w-5 h-5 rounded-full bg-muted-foreground/60" />
                      </div>
                      <p className="text-xl font-bold text-foreground">{box.nutrition.fat}g</p>
                      <p className="text-xs text-muted-foreground">Fat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="meals" className="mb-16">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-8">
              <TabsTrigger
                value="meals"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Meals Included
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Customer Reviews
              </TabsTrigger>
            </TabsList>

            {/* Meals Tab */}
            <TabsContent value="meals">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {box.meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <div className="max-w-3xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-bold text-foreground">{box.rating}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(box.rating)
                                ? 'fill-secondary text-secondary'
                                : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">{box.reviews} reviews</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {box.customerReviews.map((review) => (
                    <div key={review.id}>
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {review.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-foreground">{review.name}</span>
                            <span className="text-sm text-muted-foreground">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < review.rating
                                    ? 'fill-secondary text-secondary'
                                    : 'text-muted'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </div>
                      </div>
                      <Separator className="mt-6" />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BoxDetail;
