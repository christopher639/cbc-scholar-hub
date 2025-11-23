import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, Search, Trophy } from "lucide-react";
import { usePerformanceAnalytics } from "@/hooks/usePerformanceAnalytics";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useLearningAreas } from "@/hooks/useLearningAreas";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useReactToPrint } from "react-to-print";
import { PrintablePerformanceAnalytics } from "./PrintablePerformanceAnalytics";

interface PerformanceAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PerformanceAnalyticsDialog = ({ open, onOpenChange }: PerformanceAnalyticsDialogProps) => {
  const [filters, setFilters] = useState({
    academicYear: "",
    term: "",
    examType: "",
    gradeId: "",
    streamId: "",
    learningAreaId: "",
  });

  const printRef = useRef<HTMLDivElement>(null);
  const { analytics, loading, fetchAnalytics } = usePerformanceAnalytics();
  const { academicYears, currentYear } = useAcademicYears();
  const { grades } = useGrades();
  const { streams } = useStreams(filters.gradeId || undefined);
  const { learningAreas } = useLearningAreas();

  const handleSearch = () => {
    const searchFilters: any = {};
    if (filters.academicYear) searchFilters.academicYear = filters.academicYear;
    if (filters.term) searchFilters.term = filters.term;
    if (filters.examType) searchFilters.examType = filters.examType;
    if (filters.gradeId) searchFilters.gradeId = filters.gradeId;
    if (filters.streamId) searchFilters.streamId = filters.streamId;
    if (filters.learningAreaId) searchFilters.learningAreaId = filters.learningAreaId;

    fetchAnalytics(searchFilters);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Performance_Analytics_${new Date().toISOString().split('T')[0]}`,
  });

  const selectedGrade = grades.find(g => g.id === filters.gradeId);
  const selectedStream = streams.find(s => s.id === filters.streamId);
  const selectedLearningArea = learningAreas.find(la => la.id === filters.learningAreaId);

  const filtersSummary = {
    academicYear: filters.academicYear,
    term: filters.term,
    examType: filters.examType,
    grade: selectedGrade?.name,
    stream: selectedStream?.name,
    learningArea: selectedLearningArea?.name,
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Performance Analytics
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select
                  value={filters.academicYear}
                  onValueChange={(value) => setFilters({ ...filters, academicYear: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.year}>
                        {year.year} {year.is_active && "(Current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Term</Label>
                <Select
                  value={filters.term}
                  onValueChange={(value) => setFilters({ ...filters, term: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    <SelectItem value="term_1">Term 1</SelectItem>
                    <SelectItem value="term_2">Term 2</SelectItem>
                    <SelectItem value="term_3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Exam Type</Label>
                <Select
                  value={filters.examType}
                  onValueChange={(value) => setFilters({ ...filters, examType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Midterm">Midterm</SelectItem>
                    <SelectItem value="Endterm">Endterm</SelectItem>
                    <SelectItem value="CAT">CAT</SelectItem>
                    <SelectItem value="Assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Grade</Label>
                <Select
                  value={filters.gradeId}
                  onValueChange={(value) => setFilters({ ...filters, gradeId: value, streamId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stream</Label>
                <Select
                  value={filters.streamId}
                  onValueChange={(value) => setFilters({ ...filters, streamId: value })}
                  disabled={!filters.gradeId || filters.gradeId === "all"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stream" />
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

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={filters.learningAreaId}
                  onValueChange={(value) => setFilters({ ...filters, learningAreaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {learningAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
              {analytics.length > 0 && (
                <Button variant="outline" onClick={handlePrint}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </div>

            {/* Results */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analytics.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Learners</p>
                    <p className="text-2xl font-bold">{analytics.length}</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">Highest Average</p>
                    <p className="text-2xl font-bold text-success">
                      {analytics[0]?.average_marks.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">Class Average</p>
                    <p className="text-2xl font-bold">
                      {(analytics.reduce((sum, r) => sum + r.average_marks, 0) / analytics.length).toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-semibold">Rank</th>
                          <th className="text-left p-3 font-semibold">Admission No.</th>
                          <th className="text-left p-3 font-semibold">Learner</th>
                          <th className="text-left p-3 font-semibold">Grade/Stream</th>
                          <th className="text-right p-3 font-semibold">Subjects</th>
                          <th className="text-right p-3 font-semibold">Total</th>
                          <th className="text-right p-3 font-semibold">Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.slice(0, 50).map((record) => (
                          <tr
                            key={record.learner_id}
                            className={`border-b border-border ${
                              record.rank <= 3 ? 'bg-success/10' : ''
                            }`}
                          >
                            <td className="p-3 font-bold">
                              {record.rank}
                              {record.rank === 1 && " 🥇"}
                              {record.rank === 2 && " 🥈"}
                              {record.rank === 3 && " 🥉"}
                            </td>
                            <td className="p-3">{record.learner?.admission_number}</td>
                            <td className="p-3">
                              {record.learner?.first_name} {record.learner?.last_name}
                            </td>
                            <td className="p-3">
                              {record.grade?.name} - {record.stream?.name}
                            </td>
                            <td className="p-3 text-right">{record.subjects_count}</td>
                            <td className="p-3 text-right">{record.total_marks.toFixed(1)}</td>
                            <td className="p-3 text-right">
                              <Badge variant={record.rank <= 10 ? "default" : "secondary"}>
                                {record.average_marks.toFixed(2)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {analytics.length > 50 && (
                    <p className="p-3 text-sm text-muted-foreground text-center bg-muted">
                      Showing top 50 of {analytics.length} learners
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select filters and click Search to view performance analytics
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Printable Component */}
      <div className="hidden">
        <div ref={printRef}>
          <PrintablePerformanceAnalytics data={analytics} filters={filtersSummary} />
        </div>
      </div>
    </>
  );
};
