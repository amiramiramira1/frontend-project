import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { boxesData, dietTypes, priceRanges } from '@/data/boxesData';

const BrowseBoxes = () => {
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceRanges[0]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const toggleDiet = (diet: string) => {
    if (diet === 'All') {
      setSelectedDiets([]);
      return;
    }
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const filteredBoxes = boxesData.filter((box) => {
    const dietMatch =
      selectedDiets.length === 0 ||
      box.dietType.some((d) => selectedDiets.includes(d));
    const priceMatch =
      box.price >= selectedPriceRange.min && box.price <= selectedPriceRange.max;
    return dietMatch && priceMatch;
  });

  const clearFilters = () => {
    setSelectedDiets([]);
    setSelectedPriceRange(priceRanges[0]);
  };

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Diet Type Filter */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Diet Type</h3>
        <div className="space-y-3">
          {dietTypes.map((diet) => (
            <div key={diet} className="flex items-center gap-3">
              <Checkbox
                id={`diet-${diet}`}
                checked={diet === 'All' ? selectedDiets.length === 0 : selectedDiets.includes(diet)}
                onCheckedChange={() => toggleDiet(diet)}
              />
              <Label htmlFor={`diet-${diet}`} className="text-sm cursor-pointer">
                {diet}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Price Range</h3>
        <RadioGroup
          value={selectedPriceRange.label}
          onValueChange={(value) =>
            setSelectedPriceRange(priceRanges.find((p) => p.label === value) || priceRanges[0])
          }
        >
          {priceRanges.map((range) => (
            <div key={range.label} className="flex items-center gap-3">
              <RadioGroupItem value={range.label} id={`price-${range.label}`} />
              <Label htmlFor={`price-${range.label}`} className="text-sm cursor-pointer">
                {range.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Clear Filters */}
      {(selectedDiets.length > 0 || selectedPriceRange !== priceRanges[0]) && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Header */}
        <section className="bg-muted/30 py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-['Poppins'] mb-4">
              Browse Our Boxes
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Discover chef-crafted meal boxes for every taste and dietary preference. 
              Filter by diet type, price, or meals per week to find your perfect match.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-card rounded-xl border border-border p-6">
                <h2 className="font-bold text-lg text-foreground mb-6 font-['Poppins']">Filters</h2>
                <FilterContent />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Mobile Filter Button & Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredBoxes.length}</span> boxes
                </p>
                
                {/* Mobile Filter Trigger */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Boxes Grid */}
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBoxes.map((box) => (
                  <Card
                    key={box.id}
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border hover:border-primary/30"
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={box.image}
                        alt={box.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {box.tag && (
                        <span className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                          {box.tag}
                        </span>
                      )}
                    </div>

                    <CardContent className="p-5">
                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 fill-secondary text-secondary" />
                        <span className="text-sm font-semibold text-foreground">{box.rating}</span>
                        <span className="text-sm text-muted-foreground">({box.reviews})</span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-xl font-bold text-foreground mb-2 font-['Poppins'] group-hover:text-primary transition-colors">
                        {box.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {box.description}
                      </p>

                      {/* Diet Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {box.dietType.map((diet) => (
                          <span
                            key={diet}
                            className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full"
                          >
                            {diet}
                          </span>
                        ))}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold text-foreground">${box.price}</span>
                          <span className="text-sm text-muted-foreground">/meal</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link to={`/box/${box.slug}`}>View Details</Link>
                        </Button>
                        <Button variant="default" size="sm" className="flex-1">
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* No Results */}
              {filteredBoxes.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg mb-4">
                    No boxes match your current filters.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BrowseBoxes;
