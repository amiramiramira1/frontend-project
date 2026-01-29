import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MealCard from '@/components/MealCard';
import ServingsSelector from '@/components/ServingsSelector';
import BoxNutritionCard from '@/components/BoxNutritionCard';
import BoxReviews from '@/components/BoxReviews';
import { boxesData } from '@/data/boxesData';

const BoxDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const box = boxesData.find((b) => b.slug === slug);
  const [selectedServings, setSelectedServings] = useState(2);

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

  // Convert USD to EGP (approximate rate for display)
  const pricePerServing = Math.round(box.price * 3.8);
  const basePrice = pricePerServing * box.mealsPerWeek * 2;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/boxes">Boxes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{box.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* TOP SECTION: 2-column layout */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
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

            {/* Info */}
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

              {/* Starting Price */}
              <div className="mb-8">
                <p className="text-lg text-muted-foreground">
                  Starting from{' '}
                  <span className="text-2xl font-bold text-foreground">{basePrice} EGP</span>
                  <span className="text-muted-foreground"> (for 2 people)</span>
                </p>
              </div>
            </div>
          </div>

          {/* MEALS INCLUDED SECTION */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground font-['Poppins'] mb-8">
              {box.mealsPerWeek} Meals Included in This Box
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {box.meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          </section>

          {/* SERVINGS SELECTOR & CTA */}
          <section className="mb-16">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              <ServingsSelector
                mealsCount={box.mealsPerWeek}
                pricePerServing={pricePerServing}
                selectedServings={selectedServings}
                onServingsChange={setSelectedServings}
              />

              {/* CTA Buttons */}
              <div className="flex flex-col justify-end">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="cta" size="xl" className="flex-1">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" size="xl" className="flex-1">
                    <Calendar className="h-5 w-5 mr-2" />
                    Subscribe Weekly
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* NUTRITION SUMMARY */}
          <section className="mb-16 max-w-xl">
            <BoxNutritionCard nutrition={box.nutrition} />
          </section>

          {/* CUSTOMER REVIEWS */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground font-['Poppins'] mb-8">
              Customer Reviews
            </h2>
            <BoxReviews
              rating={box.rating}
              reviewCount={box.reviews}
              reviews={box.customerReviews}
            />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BoxDetail;
