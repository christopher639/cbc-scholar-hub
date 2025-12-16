import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHouses } from "@/hooks/useHouses";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Home, Users, Loader2 } from "lucide-react";
import { useVisitorAccess } from "@/hooks/useVisitorAccess";

export default function Houses() {
  const { houses, loading, addHouse, updateHouse, deleteHouse } = useHouses();
  const { toast } = useToast();
  const { checkAccess } = useVisitorAccess();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", color: "" });
  const [submitting, setSubmitting] = useState(false);
  
  // Filter state
  const [filterHouseId, setFilterHouseId] = useState<string>("");
  const [filteredLearners, setFilteredLearners] = useState<any[]>([]);
  const [loadingLearners, setLoadingLearners] = useState(false);

  const handleAdd = async () => {
    if (!checkAccess("add houses")) return;
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "House name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await addHouse(formData);
      setFormData({ name: "", description: "", color: "" });
      setAddDialogOpen(false);
    } catch (error) {}
    setSubmitting(false);
  };

  const handleEdit = async () => {
    if (!checkAccess("edit houses")) return;
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "House name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await updateHouse(selectedHouse.id, formData);
      setEditDialogOpen(false);
      setSelectedHouse(null);
    } catch (error) {}
    setSubmitting(false);
  };

  const handleDelete = async (house: any) => {
    if (!checkAccess("delete houses")) return;
    if (confirm(`Delete house "${house.name}"?`)) {
      await deleteHouse(house.id);
    }
  };

  const openEditDialog = (house: any) => {
    setSelectedHouse(house);
    setFormData({ name: house.name, description: house.description || "", color: house.color || "" });
    setEditDialogOpen(true);
  };

  const filterLearnersByHouse = async (houseId: string) => {
    setFilterHouseId(houseId);
    if (!houseId || houseId === "all") {
      setFilteredLearners([]);
      return;
    }
    setLoadingLearners(true);
    try {
      const { data, error } = await supabase
        .from("learners")
        .select("*, grades:current_grade_id(name), streams:current_stream_id(name)")
        .eq("house_id", houseId)
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      setFilteredLearners(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoadingLearners(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Houses</h1>
            <p className="text-sm text-muted-foreground">Manage learner houses</p>
          </div>
          <Button onClick={() => { setFormData({ name: "", description: "", color: "" }); setAddDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add House
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Houses List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5" /> All Houses ({houses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : houses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No houses created yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {houses.map((house) => (
                      <TableRow key={house.id}>
                        <TableCell className="font-medium">{house.name}</TableCell>
                        <TableCell>
                          {house.color && (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: house.color }} />
                              <span className="text-xs text-muted-foreground">{house.color}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(house)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(house)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Filter Learners by House */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" /> Learners by House
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select House</Label>
                <Select value={filterHouseId} onValueChange={filterLearnersByHouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a house to filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Houses</SelectItem>
                    {houses.map((house) => (
                      <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loadingLearners ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : filterHouseId && filteredLearners.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No learners in this house</p>
              ) : filteredLearners.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adm No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLearners.map((learner) => (
                      <TableRow key={learner.id}>
                        <TableCell className="font-mono text-xs">{learner.admission_number}</TableCell>
                        <TableCell>{learner.first_name} {learner.last_name}</TableCell>
                        <TableCell>{learner.grades?.name || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : !filterHouseId && (
                <p className="text-muted-foreground text-center py-8">Select a house to view learners</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New House</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>House Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Red House" />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input type="color" value={formData.color || "#000000"} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add House
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit House</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>House Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input type="color" value={formData.color || "#000000"} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
