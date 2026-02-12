import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { boxesData } from '@/data/boxesData';
import { useToast } from '@/hooks/use-toast';

const allMeals = boxesData.flatMap((b) =>
  b.meals.map((m) => ({ ...m, boxName: b.name, image: m.image }))
);
const uniqueMeals = allMeals.filter((m, i, arr) => arr.findIndex((x) => x.name === m.name) === i);

const servingOptions = [
  { value: 1, label: '1 person' },
  { value: 2, label: '2 people' },
  { value: 4, label: '4 people' },
  { value: 6, label: '6 people' },
];

const AdminBoxForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;
  const existingBox = isEdit ? boxesData.find((b) => b.id === Number(id)) : null;

  const [name, setName] = useState(existingBox?.name || '');
  const [description, setDescription] = useState(existingBox?.description || '');
  const [selectedMeals, setSelectedMeals] = useState(
    existingBox?.meals.map((m) => m.name) || []
  );
  const [servings, setServings] = useState(existingBox ? [1, 2, 4, 6] : [2]);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(!!existingBox?.tag);
  const [errors, setErrors] = useState({});

  const toggleMeal = (mealName) => {
    setSelectedMeals((prev) =>
      prev.includes(mealName) ? prev.filter((n) => n !== mealName) : [...prev, mealName]
    );
  };

  const toggleServing = (val) => {
    setServings((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Box name is required';
    if (selectedMeals.length < 3) errs.meals = 'Select at least 3 meals';
    if (servings.length === 0) errs.servings = 'Select at least 1 serving option';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (isDraft = false) => {
    if (!isDraft && !validate()) return;
    toast({
      title: isDraft ? 'Draft saved' : `Box ${isEdit ? 'updated' : 'created'} successfully`,
      description: isDraft ? 'Your box has been saved as a draft.' : `${name} is now ${isActive ? 'active' : 'inactive'}.`,
    });
    navigate('/admin/boxes');
  };

  // Price calculation helper
  const basePricePerServing = selectedMeals.length > 0 ? Math.round(490 / (selectedMeals.length * 2)) * 2 : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Poppins'] text-foreground">
          {isEdit ? `Edit ${existingBox?.name || 'Box'}` : 'Add New Box'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEdit ? 'Update box details and meals' : 'Create a new meal box'}
        </p>
      </div>

      {/* Section 1 - Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Box Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Mediterranean Box" />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe this box..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Drag & drop an image or</p>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" /> Upload Image
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 - Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Meals for This Box</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected chips */}
          {selectedMeals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMeals.map((mealName) => (
                <Badge key={mealName} variant="secondary" className="gap-1 pr-1">
                  {mealName}
                  <button onClick={() => toggleMeal(mealName)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">{selectedMeals.length} meals selected</p>
          {errors.meals && <p className="text-sm text-destructive">{errors.meals}</p>}

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
            {uniqueMeals.map((meal) => {
              const selected = selectedMeals.includes(meal.name);
              return (
                <div
                  key={meal.name}
                  onClick={() => toggleMeal(meal.name)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <Checkbox checked={selected} className="pointer-events-none" />
                  <img src={meal.image} alt={meal.name} className="h-10 w-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{meal.name}</p>
                    <p className="text-xs text-muted-foreground">{meal.calories} cal</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 3 - Servings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Serving Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Select which serving sizes are available</p>
          {errors.servings && <p className="text-sm text-destructive">{errors.servings}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {servingOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => toggleServing(opt.value)}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  servings.includes(opt.value) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}
              >
                <Checkbox checked={servings.includes(opt.value)} className="pointer-events-none" />
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 4 - Pricing & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pricing & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedMeals.length >= 3 && servings.length > 0 && (
            <div className="bg-accent/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Auto-calculated Prices</p>
              {servings.sort((a, b) => a - b).map((s) => (
                <div key={s} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s} {s === 1 ? 'person' : 'people'} ({selectedMeals.length} meals)</span>
                  <span className="font-medium text-foreground">{selectedMeals.length * basePricePerServing * s} EGP</span>
                </div>
              ))}
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Status</Label>
              <p className="text-sm text-muted-foreground">Make this box visible to customers</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox checked={isFeatured} onCheckedChange={(v) => setIsFeatured(!!v)} id="featured" />
            <Label htmlFor="featured">Mark as featured box</Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" onClick={() => handleSave(false)}>
          Save Box
        </Button>
        <Button variant="secondary" size="lg" onClick={() => handleSave(true)}>
          Save as Draft
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate('/admin/boxes')}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default AdminBoxForm;
