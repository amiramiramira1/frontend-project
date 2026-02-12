import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Check, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const categoryColors = {
  Protein: "bg-red-500/10 text-red-600 border-red-500/20",
  Vegetable: "bg-primary/10 text-primary border-primary/20",
  Grain: "bg-secondary/10 text-secondary border-secondary/20",
  Dairy: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Sauce: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Spice: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Oil: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Fruit: "bg-pink-500/10 text-pink-600 border-pink-500/20",
};

const allergenOptions = ["Gluten", "Dairy", "Nuts", "Soy", "Eggs", "Shellfish", "Fish"];
const categoryOptions = ["Protein", "Vegetable", "Grain", "Dairy", "Sauce", "Spice", "Oil", "Fruit"];
const unitOptions = ["g", "kg", "ml", "L", "pcs", "tbsp", "tsp"];

const initialIngredients = [
  { id: 1, name: "Chicken Breast", category: "Protein", quantity: "200", unit: "g", pricePerUnit: "0.12", calories: 330, protein: 62, carbs: 0, fat: 7, allergens: [] },
  { id: 2, name: "Quinoa", category: "Grain", quantity: "100", unit: "g", pricePerUnit: "0.08", calories: 368, protein: 14, carbs: 64, fat: 6, allergens: ["Gluten"] },
  { id: 3, name: "Broccoli", category: "Vegetable", quantity: "150", unit: "g", pricePerUnit: "0.04", calories: 51, protein: 4, carbs: 10, fat: 0, allergens: [] },
  { id: 4, name: "Atlantic Salmon", category: "Protein", quantity: "180", unit: "g", pricePerUnit: "0.25", calories: 412, protein: 40, carbs: 0, fat: 27, allergens: ["Fish"] },
  { id: 5, name: "Brown Rice", category: "Grain", quantity: "120", unit: "g", pricePerUnit: "0.03", calories: 440, protein: 10, carbs: 92, fat: 4, allergens: [] },
  { id: 6, name: "Olive Oil", category: "Oil", quantity: "15", unit: "ml", pricePerUnit: "0.06", calories: 130, protein: 0, carbs: 0, fat: 14, allergens: [] },
  { id: 7, name: "Feta Cheese", category: "Dairy", quantity: "50", unit: "g", pricePerUnit: "0.15", calories: 132, protein: 7, carbs: 2, fat: 11, allergens: ["Dairy"] },
  { id: 8, name: "Teriyaki Sauce", category: "Sauce", quantity: "30", unit: "ml", pricePerUnit: "0.05", calories: 45, protein: 2, carbs: 9, fat: 0, allergens: ["Soy", "Gluten"] },
];

const emptyIngredient = {
  name: "",
  category: "Protein",
  quantity: "",
  unit: "g",
  pricePerUnit: "",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  allergens: [],
};

const AdminIngredients = () => {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyIngredient);
  const [selected, setSelected] = useState([]);
  const [deleteIds, setDeleteIds] = useState([]);

  const filtered = ingredients
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter((i) => categoryFilter === "all" || i.category === categoryFilter);

  const startEdit = (ing) => {
    setEditingId(ing.id);
    setFormData({ name: ing.name, category: ing.category, quantity: ing.quantity, unit: ing.unit, pricePerUnit: ing.pricePerUnit, calories: ing.calories, protein: ing.protein, carbs: ing.carbs, fat: ing.fat, allergens: ing.allergens });
    setAddingNew(false);
  };

  const startAdd = () => {
    setAddingNew(true);
    setEditingId(null);
    setFormData(emptyIngredient);
  };

  const saveIngredient = () => {
    if (!formData.name.trim()) return;
    if (addingNew) {
      const newId = Math.max(...ingredients.map((i) => i.id), 0) + 1;
      setIngredients((prev) => [...prev, { ...formData, id: newId }]);
      toast({ title: "Ingredient added", description: `${formData.name} has been added.` });
    } else if (editingId !== null) {
      setIngredients((prev) => prev.map((i) => (i.id === editingId ? { ...formData, id: editingId } : i)));
      toast({ title: "Ingredient updated", description: `${formData.name} has been updated.` });
    }
    setAddingNew(false);
    setEditingId(null);
    setFormData(emptyIngredient);
  };

  const cancelEdit = () => { setAddingNew(false); setEditingId(null); setFormData(emptyIngredient); };

  const confirmDelete = () => {
    setIngredients((prev) => prev.filter((i) => !deleteIds.includes(i.id)));
    setSelected((prev) => prev.filter((id) => !deleteIds.includes(id)));
    toast({ title: "Deleted", description: `${deleteIds.length} ingredient(s) deleted.` });
    setDeleteIds([]);
  };

  const toggleAllergen = (a) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(a) ? prev.allergens.filter((x) => x !== a) : [...prev.allergens, a],
    }));
  };

  const toggleSelect = (id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleSelectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((i) => i.id));

  const renderFormRow = () => (
    <TableRow className="bg-accent/30">
      <TableCell><Checkbox disabled /></TableCell>
      <TableCell><Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className="h-8 text-sm" /></TableCell>
      <TableCell>
        <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
          <SelectTrigger className="h-8 text-sm w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>{categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Input value={formData.quantity} onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))} placeholder="Qty" className="h-8 text-sm w-16" />
          <Select value={formData.unit} onValueChange={(v) => setFormData((p) => ({ ...p, unit: v }))}>
            <SelectTrigger className="h-8 text-sm w-16"><SelectValue /></SelectTrigger>
            <SelectContent>{unitOptions.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </TableCell>
      <TableCell><Input value={formData.pricePerUnit} onChange={(e) => setFormData((p) => ({ ...p, pricePerUnit: e.target.value }))} placeholder="Price" className="h-8 text-sm w-20" /></TableCell>
      <TableCell><Input type="number" value={formData.calories} onChange={(e) => setFormData((p) => ({ ...p, calories: +e.target.value }))} className="h-8 text-sm w-16" /></TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {allergenOptions.map((a) => (
            <Badge
              key={a}
              variant="outline"
              className={`text-[10px] cursor-pointer ${formData.allergens.includes(a) ? 'bg-destructive/10 text-destructive border-destructive/30' : ''}`}
              onClick={() => toggleAllergen(a)}
            >{a}</Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={saveIngredient} className="text-primary"><Check className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Poppins'] text-foreground">Ingredient Database</h1>
          <p className="text-muted-foreground mt-1">{ingredients.length} ingredients</p>
        </div>
        <Button onClick={startAdd}><Plus className="h-4 w-4 mr-2" /> Add Ingredient</Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Note: Changing ingredient prices will automatically update all meals using this ingredient.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search ingredients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {selected.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Bulk Actions ({selected.length})</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setDeleteIds(selected)} className="text-destructive">Delete Selected</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({ title: 'Exported', description: 'CSV file downloaded.' })}>Export CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty/Serving</TableHead>
                  <TableHead>Price/Unit</TableHead>
                  <TableHead>Calories</TableHead>
                  <TableHead>Allergens</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addingNew && renderFormRow()}
                {filtered.map((ing) =>
                  editingId === ing.id ? (
                    <React.Fragment key={ing.id}>{renderFormRow()}</React.Fragment>
                  ) : (
                    <TableRow key={ing.id}>
                      <TableCell>
                        <Checkbox checked={selected.includes(ing.id)} onCheckedChange={() => toggleSelect(ing.id)} />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{ing.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={categoryColors[ing.category] || ''}>
                          {ing.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ing.quantity}{ing.unit}</TableCell>
                      <TableCell className="text-muted-foreground">{ing.pricePerUnit} EGP/{ing.unit}</TableCell>
                      <TableCell className="text-muted-foreground">{ing.calories}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {ing.allergens.length === 0 ? (
                            <span className="text-xs text-muted-foreground">None</span>
                          ) : (
                            ing.allergens.map((a) => (
                              <Badge key={a} variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">{a}</Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(ing)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteIds([ing.id])} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirm */}
      <AlertDialog open={deleteIds.length > 0} onOpenChange={() => setDeleteIds([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ingredient{deleteIds.length > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will remove {deleteIds.length} ingredient{deleteIds.length > 1 ? 's' : ''} and may affect meals using them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default AdminIngredients;
