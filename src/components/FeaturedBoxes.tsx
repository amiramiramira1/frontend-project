import { Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

import boxClassic from '@/assets/box-classic.jpg';
import boxVegan from '@/assets/box-vegan.jpg';
import boxKeto from '@/assets/box-keto.jpg';
import boxMediterranean from '@/assets/box-mediterranean.jpg';
import boxAsian from '@/assets/box-asian.jpg';
import boxProtein from '@/assets/box-protein.jpg';

const boxes = [
  {
    id: 1,
    name: 'Classic Balance',
    description: 'Perfectly balanced meals with lean proteins, whole grains, and fresh vegetables.',
    price: 12.99,
    rating: 4.9,
    reviews: 248,
    image: boxClassic,
    tag: 'Best Seller',
  },
  {
    id: 2,
    name: 'Plant Power',
    description: '100% vegan meals packed with plant-based proteins and vibrant vegetables.',
    price: 11.99,
    rating: 4.8,
    reviews: 186,
    image: boxVegan,
    tag: 'Vegan',
  },
  {
    id: 3,
    name: 'Keto Fuel',
    description: 'Low-carb, high-fat meals designed to keep you in ketosis and energized.',
    price: 14.99,
    rating: 4.7,
    reviews: 142,
    image: boxKeto,
    tag: 'Low Carb',
  },
  {
    id: 4,
    name: 'Mediterranean',
    description: 'Heart-healthy flavors inspired by the Mediterranean diet tradition.',
    price: 13.99,
    rating: 4.9,
    reviews: 167,
    image: boxMediterranean,
    tag: 'Popular',
  },
  {
    id: 5,
    name: 'Asian Fusion',
    description: 'Bold Asian flavors with teriyaki, sesame, and fresh stir-fried vegetables.',
    price: 12.99,
    rating: 4.8,
    reviews: 134,
    image: boxAsian,
    tag: null,
  },
  {
    id: 6,
    name: 'Protein Plus',
    description: 'High-protein meals perfect for muscle building and active lifestyles.',
    price: 15.99,
    rating: 4.9,
    reviews: 198,
    image: boxProtein,
    tag: 'High Protein',
  },
];

const FeaturedBoxes = () => {
  return (
    <section id="boxes" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm tracking-wider uppercase mb-3 block">
            Our Menu
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-['Poppins']">
            Featured Boxes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Chef-crafted meals for every taste and lifestyle. All boxes include 
            5 ready-to-heat meals delivered fresh.
          </p>
        </div>

        {/* Boxes Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {boxes.map((box, index) => (
            <div
              key={box.id}
              className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-2xl transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
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
                <button className="absolute top-4 right-4 p-2 bg-card/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground">
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                    <span className="text-sm font-semibold text-foreground">{box.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({box.reviews} reviews)</span>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-foreground mb-2 font-['Poppins'] group-hover:text-primary transition-colors">
                  {box.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {box.description}
                </p>

                {/* Price & CTA */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-foreground">${box.price}</span>
                    <span className="text-sm text-muted-foreground">/meal</span>
                  </div>
                  <Button variant="default" size="sm">
                    Add to Box
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            View All Boxes
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBoxes;
