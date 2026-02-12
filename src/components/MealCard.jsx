import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Flame } from 'lucide-react';

/**
 * @typedef {Object} MealData
 * @property {number} id - Unique identifier for the meal
 * @property {string} name - Name of the meal
 * @property {string} image - URL to the meal image
 * @property {string[]} ingredients - List of ingredients
 * @property {number} calories - Number of calories
 * @property {string[]} tags - Array of dietary tags
 */

/**
 * @typedef {Object} MealCardProps
 * @property {MealData} meal - The meal data to display
 * @property {boolean} [compact] - Whether to show the compact version
 */

/**
 * MealCard component for displaying meal information
 * @param {MealCardProps} props - Component props
 */
const MealCard = ({ meal, compact = false }) => {
  const tagColors = {
    'Vegetarian': 'bg-primary/10 text-primary border-primary/20',
    'Vegan': 'bg-primary/10 text-primary border-primary/20',
    'Gluten-Free': 'bg-secondary/10 text-secondary border-secondary/20',
    'Dairy-Free': 'bg-secondary/10 text-secondary border-secondary/20',
    'High Protein': 'bg-accent/10 text-accent-foreground border-accent/20',
    'Low Carb': 'bg-muted text-muted-foreground border-border',
    'Keto': 'bg-muted text-muted-foreground border-border',
  };

  if (compact) {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-4 p-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={meal.image}
              alt={meal.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{meal.name}</h4>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Flame className="h-3.5 w-3.5 text-secondary" />
              <span>{meal.calories} cal</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {meal.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`text-xs px-2 py-0 ${tagColors[tag] || 'bg-muted text-muted-foreground'}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={meal.image}
          alt={meal.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-4">
        <h4 className="font-bold text-lg text-foreground mb-2 font-['Poppins']">
          {meal.name}
        </h4>
        
        {/* Calories */}
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium text-foreground">{meal.calories} calories</span>
        </div>

        {/* Ingredients */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ingredients</p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {meal.ingredients.join(', ')}
          </p>
        </div>

        {/* Dietary Tags */}
        <div className="flex flex-wrap gap-1.5">
          {meal.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={`text-xs ${tagColors[tag] || 'bg-muted text-muted-foreground'}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MealCard;
