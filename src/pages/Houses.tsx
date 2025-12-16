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
import { Plus, Pencil, Trash2, Home, Users, Loader2, Download } from "lucide-react";
import { useVisitorAccess } from "@/hooks/useVisitorAccess";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
export default function Houses() {
  const { houses, loading, addHouse, updateHouse, deleteHouse } = useHouses();
  const { toast } = useToast();
  const { checkAccess } = useVisitorAccess();
  const { schoolInfo } = useSchoolInfo();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", color: "" });
  const [submitting, setSubmitting] = useState(false);
  
  // Filter state
  const [filterHouseId, setFilterHouseId] = useState<string>("");
  const [filteredLearners, setFilteredLearners] = useState<any[]>([]);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const getSelectedHouseName = () => {
    const house = houses.find(h => h.id === filterHouseId);
    return house?.name || "House";
  };

  const downloadHouseLearnersPDF = async () => {
    if (!filterHouseId || filterHouseId === "all" || filteredLearners.length === 0) {
      toast({ title: "Error", description: "Please select a house with learners", variant: "destructive" });
      return;
    }

    setDownloading(true);
    try {
      const doc = new jsPDF();
      const houseName = getSelectedHouseName();
      
      // Add school logo if available
      if (schoolInfo?.logo_url) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = schoolInfo.logo_url!;
          });
          doc.addImage(img, "PNG", 85, 10, 40, 40);
        } catch (e) {
          console.log("Could not load logo");
        }
      }

      // School header
      let yPos = schoolInfo?.logo_url ? 55 : 20;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(schoolInfo?.school_name || "School", 105, yPos, { align: "center" });
      
      if (schoolInfo?.address) {
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(schoolInfo.address, 105, yPos, { align: "center" });
      }
      
      // Title
      yPos += 12;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${houseName} - Learners List`, 105, yPos, { align: "center" });
      
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total: ${filteredLearners.length} learners`, 105, yPos, { align: "center" });

      // Table data
      const tableData = filteredLearners.map((learner, index) => [
        index + 1,
        learner.admission_number,
        `${learner.first_name} ${learner.last_name}`,
        learner.grades?.name || "-",
        learner.streams?.name || "-",
      ]);

      autoTable(doc, {
        startY: yPos + 8,
        head: [["#", "Admission No", "Name", "Grade", "Stream"]],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      doc.save(`${houseName.toLowerCase().replace(/\s+/g, "-")}-learners.pdf`);
      toast({ title: "Success", description: "PDF downloaded successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
    setDownloading(false);
  };

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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" /> Learners by House
                </CardTitle>
                {filterHouseId && filterHouseId !== "all" && filteredLearners.length > 0 && (
                  <Button size="sm" variant="outline" onClick={downloadHouseLearnersPDF} disabled={downloading}>
                    {downloading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                    Download PDF
                  </Button>
                )}
              </div>
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
