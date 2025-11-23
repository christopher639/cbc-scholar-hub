import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, Filter } from "lucide-react";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { PrintablePerformanceReport } from "@/components/PrintablePerformanceReport";
import { useReactToPrint } from "react-to-print";

const BulkLearnerReports = () => {
  const { grades, loading: gradesLoading } = useGrades();
  const { academicYears, loading: yearsLoading } = useAcademicYears();
  const { academicPeriods, loading: periodsLoading } = useAcademicPeriods();
  const { toast } = useToast();
  
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [combineExamTypes, setCombineExamTypes] = useState(false);
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [learners, setLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Fetch streams when grade changes
  const fetchStreams = async (gradeId: string) => {
    const { data } = await supabase
      .from("streams")
      .select("*")
      .eq("grade_id", gradeId)
      .order("name");
    setStreams(data || []);
  };

  // Fetch available exam types for the selected period
  const fetchExamTypes = async () => {
    if (!selectedGrade || !selectedYear || !selectedTerm) return;
    
    const { data } = await supabase
      .from("performance_records")
      .select("exam_type")
      .eq("grade_id", selectedGrade)
      .eq("academic_year", selectedYear)
      .eq("term", selectedTerm as "term_1" | "term_2" | "term_3")
      .not("exam_type", "is", null);
    
      const uniqueTypes = [...new Set(data?.map(r => r.exam_type).filter(Boolean))] as string[];
    setExamTypes(uniqueTypes);
  };

  const handleGradeChange = (gradeId: string) => {
    setSelectedGrade(gradeId);
    setSelectedStream("");
    if (gradeId) {
      fetchStreams(gradeId);
    } else {
      setStreams([]);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedGrade || !selectedYear || !selectedTerm) {
      toast({
        title: "Missing Information",
        description: "Please select grade, academic year, and term",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Build query for learners
      let query = supabase
        .from("learners")
        .select(`
          *,
          current_grade:grades!learners_current_grade_id_fkey(id, name),
          current_stream:streams!learners_current_stream_id_fkey(id, name),
          parent:parents(first_name, last_name, phone, email)
        `)
        .eq("current_grade_id", selectedGrade)
        .eq("status", "active");

      if (selectedStream) {
        query = query.eq("current_stream_id", selectedStream);
      }

      const { data: learnersData, error: learnersError } = await query;

      if (learnersError) throw learnersError;

      // For each learner, fetch their performance records
      const reportsData = await Promise.all(
        (learnersData || []).map(async (learner) => {
          let perfQuery = supabase
            .from("performance_records")
            .select(`
              *,
              learning_area:learning_areas(name, code),
              academic_period:academic_periods(academic_year, term, start_date, end_date)
            `)
            .eq("learner_id", learner.id)
            .eq("academic_year", selectedYear)
            .eq("term", selectedTerm as "term_1" | "term_2" | "term_3");

          if (!combineExamTypes && examTypes.length > 0) {
            perfQuery = perfQuery.in("exam_type", examTypes);
          }

          const { data: performanceData } = await perfQuery.order("created_at", { ascending: false });

          return {
            learner,
            performanceRecords: performanceData || [],
          };
        })
      );

      setReportData(reportsData);
      setLearners(learnersData || []);
      
      toast({
        title: "Report Generated",
        description: `Generated reports for ${learnersData?.length || 0} learners`,
      });
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedGradeData = grades.find(g => g.id === selectedGrade);
  const selectedPeriod = academicPeriods.find(
    p => p.academic_year === selectedYear && p.term === selectedTerm
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bulk Learner Reports</h1>
          <p className="text-muted-foreground">Generate performance reports for multiple learners</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
            <CardDescription>
              Select criteria to generate bulk learner performance reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Select value={selectedGrade} onValueChange={handleGradeChange}>
                  <SelectTrigger id="grade">
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

              <div className="space-y-2">
                <Label htmlFor="stream">Stream (Optional)</Label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedStream} 
                    onValueChange={setSelectedStream}
                    disabled={!selectedGrade}
                  >
                    <SelectTrigger id="stream">
                      <SelectValue placeholder="All streams" />
                    </SelectTrigger>
                    <SelectContent>
                      {streams.map((stream) => (
                        <SelectItem key={stream.id} value={stream.id}>
                          {stream.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStream && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setSelectedStream("")}
                      type="button"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Academic Year *</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.year}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Term *</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger id="term">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term_1">Term 1</SelectItem>
                    <SelectItem value="term_2">Term 2</SelectItem>
                    <SelectItem value="term_3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="combine"
                    checked={combineExamTypes}
                    onCheckedChange={(checked) => setCombineExamTypes(checked as boolean)}
                  />
                  <Label htmlFor="combine" className="cursor-pointer">
                    Combine all exam types (Opening, Mid-term, Final)
                  </Label>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-4">
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={loading || !selectedGrade || !selectedYear || !selectedTerm}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Reports
                    </>
                  )}
                </Button>
                
                {reportData.length > 0 && (
                  <Button onClick={handlePrint} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download/Print All
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {learners.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports ({learners.length} Learners)</CardTitle>
              <CardDescription>
                Reports ready for {selectedGradeData?.name}
                {selectedStream && ` - ${streams.find(s => s.id === selectedStream)?.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Click "Download/Print All" to generate a combined PDF document with all learner reports.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden print area */}
        <div className="hidden">
          <div ref={printRef}>
            {reportData.map(({ learner, performanceRecords }, index) => (
              <div key={learner.id} className={index > 0 ? "page-break-before" : ""}>
                <PrintablePerformanceReport
                  learner={learner}
                  performance={performanceRecords}
                  academicYear={selectedYear}
                  term={selectedTerm}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .page-break-before {
            page-break-before: always;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default BulkLearnerReports;
