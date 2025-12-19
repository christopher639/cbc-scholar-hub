import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, Search, FileText, Loader2, GraduationCap } from "lucide-react";
import { usePerformanceReport } from "@/hooks/usePerformanceReport";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useExamTypes } from "@/hooks/useExamTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { useReactToPrint } from "react-to-print";
import { PrintablePerformanceReportNew } from "./PrintablePerformanceReportNew";
import { PrintableLearnerTranscript } from "./PrintableLearnerTranscript";

interface PerformanceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PerformanceReportDialog = ({ open, onOpenChange }: PerformanceReportDialogProps) => {
  const [filters, setFilters] = useState({
    academicYear: "",
    term: "",
    examType: "",
    gradeId: "",
    streamId: "",
  });

  const printRef = useRef<HTMLDivElement>(null);
  const transcriptsRef = useRef<HTMLDivElement>(null);
  const { reportData, loading, fetchReport } = usePerformanceReport();
  const { academicYears } = useAcademicYears();
  const { grades } = useGrades();
  const { streams } = useStreams(filters.gradeId || undefined);
  const { examTypes } = useExamTypes();

  const handleSearch = () => {
    if (!filters.academicYear || !filters.term || !filters.gradeId) {
      return;
    }
    fetchReport({
      academicYear: filters.academicYear,
      term: filters.term,
      examType: filters.examType || "all",
      gradeId: filters.gradeId,
      streamId: filters.streamId || undefined,
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Performance_Report_${reportData?.gradeName || ""}${reportData?.streamName ? `_${reportData.streamName}` : ""}_${filters.academicYear}_${filters.term}`,
  });

  const handlePrintTranscripts = useReactToPrint({
    contentRef: transcriptsRef,
    documentTitle: `Report_Cards_${reportData?.gradeName || ""}${reportData?.streamName ? `_${reportData.streamName}` : ""}_${filters.academicYear}_${filters.term}`,
  });

  const canSearch = filters.academicYear && filters.term && filters.gradeId;

  const getTermLabel = (term: string) => {
    switch (term) {
      case "term_1": return "Term 1";
      case "term_2": return "Term 2";
      case "term_3": return "Term 3";
      default: return term;
    }
  };

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case "opener": return "Opener";
      case "mid_term": return "Mid-Term";
      case "end_term": return "End-Term";
      case "combined": return "Combined";
      case "all": return "All Types";
      default: return type;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Performance Report
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Academic Year *</Label>
                <Select
                  value={filters.academicYear}
                  onValueChange={(value) => setFilters({ ...filters, academicYear: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.year}>
                        {year.year} {year.is_active && "(Current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Term *</Label>
                <Select
                  value={filters.term}
                  onValueChange={(value) => setFilters({ ...filters, term: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term_1">Term 1</SelectItem>
                    <SelectItem value="term_2">Term 2</SelectItem>
                    <SelectItem value="term_3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Exam Type</Label>
                <Select
                  value={filters.examType}
                  onValueChange={(value) => setFilters({ ...filters, examType: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="combined">Combined Average</SelectItem>
                    {examTypes.filter(e => e.is_active).map((examType) => (
                      <SelectItem key={examType.id} value={examType.name}>
                        {examType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Grade *</Label>
                <Select
                  value={filters.gradeId}
                  onValueChange={(value) => setFilters({ ...filters, gradeId: value, streamId: "" })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Stream</Label>
                <Select
                  value={filters.streamId}
                  onValueChange={(value) => setFilters({ ...filters, streamId: value })}
                  disabled={!filters.gradeId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All streams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streams</SelectItem>
                    {streams.map((stream) => (
                      <SelectItem key={stream.id} value={stream.id}>
                        {stream.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleSearch} disabled={loading || !canSearch}>
                {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
                {loading ? "Generating..." : "Generate Report"}
              </Button>
              {reportData && reportData.learners.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Download className="h-4 w-4 mr-1.5" />
                    Download PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrintTranscripts}>
                    <GraduationCap className="h-4 w-4 mr-1.5" />
                    Download Report Cards
                  </Button>
                </>
              )}
            </div>

            {/* Results */}
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : reportData ? (
              <div className="space-y-3">
                {/* Summary */}
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="px-3 py-1.5 bg-muted rounded-md">
                    <span className="text-muted-foreground">Learners:</span>{" "}
                    <span className="font-semibold">{reportData.learners.length}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-muted rounded-md">
                    <span className="text-muted-foreground">Subjects:</span>{" "}
                    <span className="font-semibold">{reportData.learningAreas.length}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-muted rounded-md">
                    <span className="text-muted-foreground">Class Avg:</span>{" "}
                    <span className="font-semibold">
                      {reportData.learners.length > 0
                        ? (reportData.learners.reduce((sum, l) => sum + l.average, 0) / reportData.learners.length).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>

                {/* Report Table */}
                {reportData.learners.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[50vh]">
                      <table className="w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="px-2 py-2 text-left font-medium border-r">#</th>
                            <th className="px-2 py-2 text-left font-medium border-r whitespace-nowrap">Adm No.</th>
                            <th className="px-2 py-2 text-left font-medium border-r whitespace-nowrap min-w-[140px]">Learner Name</th>
                            {reportData.learningAreas.map((la) => (
                              <th key={la.id} className="px-2 py-2 text-center font-medium border-r whitespace-nowrap" title={la.name}>
                                {la.code}
                              </th>
                            ))}
                            <th className="px-2 py-2 text-center font-medium border-r">Total</th>
                            <th className="px-2 py-2 text-center font-medium">Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.learners.map((learner, index) => (
                            <tr key={learner.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                              <td className="px-2 py-1.5 border-r text-muted-foreground">{index + 1}</td>
                              <td className="px-2 py-1.5 border-r font-mono">{learner.admission_number}</td>
                              <td className="px-2 py-1.5 border-r whitespace-nowrap">
                                {learner.first_name} {learner.last_name}
                              </td>
                              {reportData.learningAreas.map((la) => (
                                <td key={la.id} className="px-2 py-1.5 text-center border-r">
                                  {learner.marks[la.code] !== null ? learner.marks[la.code] : "—"}
                                </td>
                              ))}
                              <td className="px-2 py-1.5 text-center border-r font-medium">{learner.total}</td>
                              <td className="px-2 py-1.5 text-center font-semibold">{learner.average}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No learners found for the selected filters.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select academic year, term, and grade to generate report
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Printable Component - Performance Report */}
      <div className="hidden">
        <div ref={printRef}>
          {reportData && (
            <PrintablePerformanceReportNew
              data={reportData}
              filters={{
                academicYear: filters.academicYear,
                term: getTermLabel(filters.term),
                examType: getExamTypeLabel(filters.examType || "all"),
              }}
            />
          )}
        </div>
      </div>

      {/* Hidden Printable Component - Individual Transcripts */}
      <div className="hidden">
        <div ref={transcriptsRef}>
          {reportData && reportData.learners.map((learner) => (
            <PrintableLearnerTranscript
              key={learner.id}
              learner={learner}
              learningAreas={reportData.learningAreas}
              examTypes={reportData.examTypes}
              filters={{
                academicYear: filters.academicYear,
                term: getTermLabel(filters.term),
                examType: getExamTypeLabel(filters.examType || "all"),
                gradeName: reportData.gradeName,
                streamName: reportData.streamName,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};
