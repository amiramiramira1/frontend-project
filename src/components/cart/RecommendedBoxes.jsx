import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { boxesData } from '@/data/boxesData';

/**
 * @typedef {Object} RecommendedBoxesProps
 * @property {number[]} currentItemIds - Array of box IDs that are already in the cart
 */

/**
 * RecommendedBoxes component for displaying suggested boxes
 * @param {RecommendedBoxesProps} props - Component props
 */
const RecommendedBoxes = ({ currentItemIds }) => {
  const recommended = boxesData
    .filter((box) => !currentItemIds.includes(box.id))
    .slice(0, 3);

  if (recommended.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-foreground font-['Poppins'] mb-6">
        You might also like
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommended.map((box) => {
          const priceEGP = Math.round(box.price * 3.8 * box.mealsPerWeek * 2);
          return (
            <Card key={box.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={box.image}
                  alt={box.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {box.tag && (
                  <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground">
                    {box.tag}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-foreground font-['Poppins'] mb-1">{box.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="text-sm font-medium text-foreground">{box.rating}</span>
                  <span className="text-xs text-muted-foreground">({box.reviews})</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{box.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">From {priceEGP} EGP</span>
                  <Button variant="default" size="sm" asChild>
                    <Link to={`/box/${box.slug}`}>View Box</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default RecommendedBoxes;
