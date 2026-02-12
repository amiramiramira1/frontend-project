import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * @typedef {Object} ServingOption
 * @property {number} value - Numeric value of the serving option
 * @property {string} label - Display label
 * @property {boolean} [isPopular] - Whether this option is marked as popular
 */

const servingOptions = [
  { value: 1, label: '1' },
  { value: 2, label: '2', isPopular: true },
  { value: 4, label: '4' },
  { value: 6, label: '6' },
];

/**
 * @typedef {Object} ServingsSelectorProps
 * @property {number} mealsCount - Number of meals
 * @property {number} pricePerServing - Price per serving
 * @property {number} selectedServings - Currently selected number of servings
 * @property {Function} onServingsChange - Callback when servings change
 */

/**
 * ServingsSelector component for selecting number of servings
 * @param {ServingsSelectorProps} props - Component props
 */
const ServingsSelector = ({
  mealsCount,
  pricePerServing,
  selectedServings,
  onServingsChange,
}) => {
  const totalServings = mealsCount * selectedServings;
  const totalPrice = totalServings * pricePerServing;
  const averagePrice = totalPrice / totalServings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground font-['Poppins'] mb-4">
          For how many people?
        </h3>
        <div className="flex flex-wrap gap-3">
          {servingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onServingsChange(option.value)}
              className={`relative flex items-center justify-center min-w-[80px] h-14 px-6 rounded-full font-semibold text-lg transition-all duration-200 ${
                selectedServings === option.value
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {option.label}
              {option.isPopular && (
                <Star className="h-4 w-4 ml-1 fill-secondary text-secondary" />
              )}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {selectedServings === 2 && (
            <span className="text-secondary font-medium">Most Popular</span>
          )}
        </p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-foreground">
              <span className="text-muted-foreground">
                {mealsCount} Meals × {selectedServings} {selectedServings === 1 ? 'Person' : 'People'}
              </span>
              <span className="font-semibold">{totalServings} servings</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">{totalPrice} EGP</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Average</span>
              <span>{averagePrice.toFixed(0)} EGP per serving</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServingsSelector;
