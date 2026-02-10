import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { boxesData } from '@/data/boxesData';

const AdminBoxes = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeStates, setActiveStates] = useState<Record<number, boolean>>(
    Object.fromEntries(boxesData.map((b) => [b.id, true]))
  );

  const perPage = 10;

  const filtered = boxesData
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    .filter((b) => statusFilter === 'all' || (statusFilter === 'active' ? activeStates[b.id] : !activeStates[b.id]))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.price - b.price;
      return b.id - a.id;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Poppins'] text-foreground">Manage Boxes</h1>
          <p className="text-muted-foreground mt-1">{boxesData.length} boxes total</p>
        </div>
        <Link to="/admin/boxes/new">
          <Button variant="default" size="lg">
            <Plus className="h-5 w-5 mr-2" /> Add New Box
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search boxes..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {paged.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No boxes yet</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first box</p>
            <Link to="/admin/boxes/new"><Button>Create Your First Box</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Box Name</TableHead>
                    <TableHead>Meals</TableHead>
                    <TableHead>Price Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((box) => (
                    <TableRow key={box.id}>
                      <TableCell>
                        <img src={box.image} alt={box.name} className="h-10 w-10 rounded-lg object-cover" />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{box.name}</p>
                          {box.tag && <Badge variant="secondary" className="text-[10px] mt-1">{box.tag}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{box.mealsPerWeek} meals</TableCell>
                      <TableCell className="text-muted-foreground">From {Math.round(box.price * 2 * box.mealsPerWeek)} EGP</TableCell>
                      <TableCell>
                        <Switch
                          checked={activeStates[box.id]}
                          onCheckedChange={(v) => setActiveStates((s) => ({ ...s, [box.id]: v }))}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/box/${box.slug}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link>
                          <Link to={`/admin/boxes/${box.id}/edit`}><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button></Link>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(box.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paged.map((box) => (
              <Card key={box.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <img src={box.image} alt={box.name} className="h-16 w-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{box.name}</p>
                    <p className="text-sm text-muted-foreground">{box.mealsPerWeek} meals · From {Math.round(box.price * 2 * box.mealsPerWeek)} EGP</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch checked={activeStates[box.id]} onCheckedChange={(v) => setActiveStates((s) => ({ ...s, [box.id]: v }))} />
                      <span className="text-xs text-muted-foreground">{activeStates[box.id] ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link to={`/admin/boxes/${box.id}/edit`}><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button></Link>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(box.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Box</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this box? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => setDeleteId(null)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBoxes;
