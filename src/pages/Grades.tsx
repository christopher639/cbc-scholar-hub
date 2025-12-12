import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, ArrowUp, FileDown, Settings, Download, Pencil, Trash2 } from "lucide-react";
import { AddGradeStreamDialog } from "@/components/AddGradeStreamDialog";
import { EditGradeDialog } from "@/components/EditGradeDialog";
import { EditStreamDialog } from "@/components/EditStreamDialog";
import { SetLastGradeDialog } from "@/components/SetLastGradeDialog";
import { PromoteLearnerDialog } from "@/components/PromoteLearnerDialog";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useLearners } from "@/hooks/useLearners";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const Grades = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addStreamDialogOpen, setAddStreamDialogOpen] = useState(false);
  const [editGradeDialogOpen, setEditGradeDialogOpen] = useState(false);
  const [editStreamDialogOpen, setEditStreamDialogOpen] = useState(false);
  const [lastGradeDialogOpen, setLastGradeDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [deleteGradeDialogOpen, setDeleteGradeDialogOpen] = useState(false);
  const [deleteStreamDialogOpen, setDeleteStreamDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("all");
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const [manageGradeId, setManageGradeId] = useState<string>("");
  
  const { grades, loading: gradesLoading, fetchGrades } = useGrades();
  const { streams, loading: streamsLoading, fetchStreams } = useStreams(selectedGradeId);
  const { streams: manageStreams, loading: manageStreamsLoading, fetchStreams: fetchManageStreams } = useStreams(manageGradeId);
  const { learners, loading: learnersLoading, fetchLearners } = useLearners(
    selectedGradeId || undefined,
    selectedStreamId !== "all" ? selectedStreamId : undefined
  );

  const handleDialogClose = (open: boolean) => {
    setAddStreamDialogOpen(open);
    if (!open) {
      fetchGrades();
      fetchLearners();
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLearners(learners.map(l => l.id));
    } else {
      setSelectedLearners([]);
    }
  };

  const handleSelectLearner = (learnerId: string, checked: boolean) => {
    if (checked) {
      setSelectedLearners([...selectedLearners, learnerId]);
    } else {
      setSelectedLearners(selectedLearners.filter(id => id !== learnerId));
    }
  };

  const currentGradeName = grades.find(g => g.id === selectedGradeId)?.name || "";
  const loading = gradesLoading || streamsLoading || learnersLoading;

  const handleDeleteGrade = async () => {
    if (!selectedGrade) return;
    try {
      const { error } = await supabase
        .from("grades")
        .delete()
        .eq("id", selectedGrade.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Grade deleted successfully",
      });
      fetchGrades();
      setDeleteGradeDialogOpen(false);
      setSelectedGrade(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStream = async () => {
    if (!selectedStream) return;
    try {
      const { error } = await supabase
        .from("streams")
        .delete()
        .eq("id", selectedStream.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stream deleted successfully",
      });
      fetchManageStreams();
      fetchGrades();
      setDeleteStreamDialogOpen(false);
      setSelectedStream(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedGradeId || learners.length === 0) {
      toast({
        title: "No data to download",
        description: "Please select a grade with learners first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch school info
      const { data: schoolInfo } = await supabase
        .from("school_info")
        .select("*")
        .single();

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const gradeName = grades.find(g => g.id === selectedGradeId)?.name || "";
      const streamName = selectedStreamId !== "all" 
        ? streams.find(s => s.id === selectedStreamId)?.name 
        : "All Streams";

      let yPosition = 15;

      // Add school logo if available
      if (schoolInfo?.logo_url) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = schoolInfo.logo_url;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          doc.addImage(img, "PNG", 14, 10, 20, 20);
          yPosition = Math.max(yPosition, 35);
        } catch (error) {
          console.error("Failed to load logo:", error);
        }
      }

      // Add school header information
      if (schoolInfo) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(schoolInfo.school_name || "", 40, 15);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        if (schoolInfo.address) {
          doc.text(schoolInfo.address, 40, 21);
        }
        if (schoolInfo.phone || schoolInfo.email) {
          const contact = [schoolInfo.phone, schoolInfo.email].filter(Boolean).join(" | ");
          doc.text(contact, 40, 26);
        }
        yPosition = Math.max(yPosition, 35);
      }

      // Add title and date
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${gradeName} - ${streamName}`, 14, yPosition);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPosition + 5);

      // Prepare table headers
      const showStreamColumn = selectedStreamId === "all";
      const headers = [
        "#",
        "Admission No.",
        "Name",
        ...(showStreamColumn ? ["Stream"] : []),
        ...Array(12).fill(""),
      ];

      // Prepare table data
      const tableData = learners.map((learner, index) => [
        (index + 1).toString(),
        learner.admission_number,
        `${learner.first_name} ${learner.last_name}`,
        ...(showStreamColumn ? [learner.stream?.name || "N/A"] : []),
        ...Array(12).fill(""),
      ]);

      // Generate table with page numbers
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: yPosition + 10,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 25, halign: "left" },
          2: { cellWidth: 35, halign: "left" },
          ...(showStreamColumn ? { 3: { cellWidth: 20, halign: "left" } } : {}),
        },
        margin: { top: yPosition + 10, left: 14, right: 14 },
        tableWidth: "auto",
        didDrawPage: (data) => {
          // Add page numbers
          const pageCount = doc.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height || pageSize.getHeight();
          
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            data.settings.margin.left,
            pageHeight - 10
          );
        },
      });

      // Save PDF
      const fileName = `${gradeName.replace(/\s+/g, "_")}_${streamName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Downloaded",
        description: `Learner list for ${gradeName} has been downloaded`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Grades & Streams</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Filter by grade and stream to manage learners</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button className="gap-2" onClick={() => setAddStreamDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add New Stream
            </Button>
          </div>
        </div>

        {/* Filters and Manage Grades - Side by Side on Large Screens */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter Learners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="grade-filter" className="text-xs">Grade</Label>
                  <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
                    <SelectTrigger id="grade-filter" className="h-8 text-sm">
                      <SelectValue placeholder="Select a grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id} className="text-sm">
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stream-filter" className="text-xs">Stream</Label>
                  <Select 
                    value={selectedStreamId} 
                    onValueChange={setSelectedStreamId}
                    disabled={!selectedGradeId}
                  >
                    <SelectTrigger id="stream-filter" className="h-8 text-sm">
                      <SelectValue placeholder={selectedGradeId ? "Select a stream" : "Select grade first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm">All Streams</SelectItem>
                      {streams.map((stream) => (
                        <SelectItem key={stream.id} value={stream.id} className="text-sm">
                          {stream.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedGradeId && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="mr-1 h-3 w-3" />
                      {learners.length} learner{learners.length !== 1 ? 's' : ''}
                    </Badge>
                    {selectedStreamId !== "all" && (
                      <Badge variant="outline" className="text-xs">
                        {streams.find(s => s.id === selectedStreamId)?.name}
                      </Badge>
                    )}
                  </div>
                  {learners.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPDF}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manage Grades & Streams */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manage Grades & Streams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="manage-grade" className="text-xs">Select Grade to Manage</Label>
                <Select value={manageGradeId} onValueChange={setManageGradeId}>
                  <SelectTrigger id="manage-grade" className="h-8 text-sm">
                    <SelectValue placeholder="Select a grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id} className="text-sm">
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {manageGradeId && (
                <div className="space-y-4">
                  {/* Warning Banner */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      <strong>Warning:</strong> Editing or deleting grades/streams will affect all associated learners and records. Grades/streams with learners cannot be deleted.
                    </p>
                  </div>

                  {/* Grade Actions */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{grades.find(g => g.id === manageGradeId)?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {grades.find(g => g.id === manageGradeId)?.learner_count || 0} learners • {grades.find(g => g.id === manageGradeId)?.stream_count || 0} streams
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGrade(grades.find(g => g.id === manageGradeId));
                          setEditGradeDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedGrade(grades.find(g => g.id === manageGradeId));
                          setDeleteGradeDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Streams List */}
                  <div className="space-y-2">
                    <Label className="text-xs">Streams in this Grade</Label>
                    {manageStreamsLoading ? (
                      <Skeleton className="h-20 w-full" />
                    ) : manageStreams.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3 border rounded-lg">No streams in this grade</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {manageStreams.map((stream) => (
                          <div key={stream.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{stream.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Capacity: {stream.capacity || "Unlimited"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStream(stream);
                                  setEditStreamDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedStream(stream);
                                  setDeleteStreamDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Learners Table */}
        {selectedGradeId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Learners</CardTitle>
                {selectedLearners.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPromoteDialogOpen(true)}
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Promote ({selectedLearners.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/performance")}
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      View Performance
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : learners.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No learners found for the selected filters
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedLearners.length === learners.length && learners.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Admission #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Stream</TableHead>
                      <TableHead>Boarding Status</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {learners.map((learner) => (
                      <TableRow 
                        key={learner.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/students/${learner.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedLearners.includes(learner.id)}
                            onCheckedChange={(checked) => handleSelectLearner(learner.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{learner.admission_number}</TableCell>
                        <TableCell>
                          {learner.first_name} {learner.last_name}
                        </TableCell>
                        <TableCell className="capitalize">{learner.gender}</TableCell>
                        <TableCell>
                          {learner.stream?.name || "N/A"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {learner.boarding_status?.replace("_", " ") || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={learner.status === "active" ? "default" : "secondary"}>
                            {learner.status || "active"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        <AddGradeStreamDialog 
          open={addStreamDialogOpen} 
          onOpenChange={handleDialogClose}
        />

        {selectedGrade && (
          <>
            <EditGradeDialog
              open={editGradeDialogOpen}
              onOpenChange={setEditGradeDialogOpen}
              grade={selectedGrade}
              onSuccess={() => {
                fetchGrades();
                setSelectedGrade(null);
              }}
            />
            <SetLastGradeDialog
              open={lastGradeDialogOpen}
              onOpenChange={setLastGradeDialogOpen}
              gradeId={selectedGrade.id}
              gradeName={selectedGrade.name}
              isCurrentlyLastGrade={selectedGrade.is_last_grade || false}
              onSuccess={fetchGrades}
            />
          </>
        )}

        {selectedStream && (
          <EditStreamDialog
            open={editStreamDialogOpen}
            onOpenChange={setEditStreamDialogOpen}
            stream={selectedStream}
            onSuccess={() => {
              fetchManageStreams();
              fetchGrades();
              setSelectedStream(null);
            }}
          />
        )}

        <AlertDialog open={deleteGradeDialogOpen} onOpenChange={setDeleteGradeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Grade</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedGrade?.name}"? This action cannot be undone.
                Note: Grades with learners cannot be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteGrade} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteStreamDialogOpen} onOpenChange={setDeleteStreamDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Stream</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedStream?.name}"? This action cannot be undone.
                Note: Streams with learners cannot be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteStream} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <PromoteLearnerDialog
          open={promoteDialogOpen}
          onOpenChange={setPromoteDialogOpen}
          selectedLearners={selectedLearners}
          currentGrade={currentGradeName}
          onSuccess={() => {
            setSelectedLearners([]);
            fetchLearners();
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Grades;
