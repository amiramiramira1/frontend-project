import { Flame, Beef, Wheat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BoxNutritionCard = ({ nutrition }) => {
  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">
          Nutrition Info (per serving avg.)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10 mx-auto mb-2">
              <Flame className="h-5 w-5 text-secondary" />
            </div>
            <p className="text-xl font-bold text-foreground">{nutrition.calories}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
          <div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mx-auto mb-2">
              <Beef className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground">{nutrition.protein}g</p>
            <p className="text-xs text-muted-foreground">Protein</p>
          </div>
          <div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted mx-auto mb-2">
              <Wheat className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{nutrition.carbs}g</p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted mx-auto mb-2">
              <div className="w-5 h-5 rounded-full bg-muted-foreground/60" />
            </div>
            <p className="text-xl font-bold text-foreground">{nutrition.fat}g</p>
            <p className="text-xs text-muted-foreground">Fat</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BoxNutritionCard;
