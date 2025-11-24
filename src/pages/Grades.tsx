import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, ArrowUp, FileDown, Settings, Download } from "lucide-react";
import { AddGradeStreamDialog } from "@/components/AddGradeStreamDialog";
import { EditGradeDialog } from "@/components/EditGradeDialog";
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
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

const Grades = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addStreamDialogOpen, setAddStreamDialogOpen] = useState(false);
  const [editGradeDialogOpen, setEditGradeDialogOpen] = useState(false);
  const [lastGradeDialogOpen, setLastGradeDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("all");
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  
  const { grades, loading: gradesLoading, fetchGrades } = useGrades();
  const { streams, loading: streamsLoading } = useStreams(selectedGradeId);
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

  const handleDownloadPDF = () => {
    if (!selectedGradeId || learners.length === 0) {
      toast({
        title: "No data to download",
        description: "Please select a grade with learners first",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const gradeName = grades.find(g => g.id === selectedGradeId)?.name || "";
    const streamName = selectedStreamId !== "all" 
      ? streams.find(s => s.id === selectedStreamId)?.name 
      : "All Streams";

    // Title
    doc.setFontSize(16);
    doc.text(`${gradeName} - ${streamName}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

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

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 25, halign: "left" },
        ...(showStreamColumn ? { 2: { cellWidth: 20, halign: "left" } } : {}),
      },
      margin: { top: 28, left: 14, right: 14 },
      tableWidth: "auto",
    });

    // Save PDF
    const fileName = `${gradeName.replace(/\s+/g, "_")}_${streamName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);

    toast({
      title: "PDF Downloaded",
      description: `Learner list for ${gradeName} has been downloaded`,
    });
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
              onSuccess={fetchGrades}
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
