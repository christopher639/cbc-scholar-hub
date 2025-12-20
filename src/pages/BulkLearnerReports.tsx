import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, Filter, TrendingUp, ClipboardList } from "lucide-react";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useReactToPrint } from "react-to-print";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { LearnerJourneyDialog } from "@/components/LearnerJourneyDialog";
import { PrintablePerformanceReport } from "@/components/PrintablePerformanceReport";
import { PerformanceReportDialog } from "@/components/PerformanceReportDialog";

const BulkLearnerReports = () => {
  const { grades, loading: gradesLoading } = useGrades();
  const { academicYears, loading: yearsLoading } = useAcademicYears();
  const { academicPeriods, loading: periodsLoading } = useAcademicPeriods();
  const { schoolInfo } = useSchoolInfo();
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
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>("");
  const [journeyDialogOpen, setJourneyDialogOpen] = useState(false);
  const [performanceReportOpen, setPerformanceReportOpen] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const marksSheetRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handlePrintMarksSheet = useReactToPrint({
    contentRef: marksSheetRef,
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
              academic_period:academic_periods(academic_year, term, start_date, end_date),
              historical_grade:grades!performance_records_grade_id_fkey(id, name),
              historical_stream:streams!performance_records_stream_id_fkey(id, name)
            `)
            .eq("learner_id", learner.id)
            .eq("academic_year", selectedYear)
            .eq("term", selectedTerm as "term_1" | "term_2" | "term_3");

          if (!combineExamTypes && examTypes.length > 0) {
            perfQuery = perfQuery.in("exam_type", examTypes);
          }

          const { data: performanceData } = await perfQuery.order("created_at", { ascending: false });

          // Get the historical grade/stream from first performance record
          const historicalGrade = performanceData?.[0]?.historical_grade;
          const historicalStream = performanceData?.[0]?.historical_stream;

          // Calculate average for this learner
          const groupedByArea = (performanceData || []).reduce((acc: any, record: any) => {
            const areaId = record.learning_area_id;
            if (!acc[areaId]) acc[areaId] = [];
            acc[areaId].push(record.marks);
            return acc;
          }, {});

          const areaAverages = Object.values(groupedByArea).map((marks: any) => {
            const sum = marks.reduce((a: number, b: number) => a + b, 0);
            return sum / marks.length;
          });

          const overallAverage = areaAverages.length > 0
            ? areaAverages.reduce((a, b) => a + b, 0) / areaAverages.length
            : 0;

          return {
            learner,
            performanceRecords: performanceData || [],
            historicalGrade,
            historicalStream,
            overallAverage,
          };
        })
      );

      // Calculate positions
      const reportsWithPositions = reportsData.map((report) => {
        // Grade position
        const gradeReports = reportsData.filter(
          (r) => (r.historicalGrade?.id || r.learner.current_grade_id) === 
                 (report.historicalGrade?.id || report.learner.current_grade_id)
        );
        const sortedByGrade = [...gradeReports].sort((a, b) => b.overallAverage - a.overallAverage);
        const gradePosition = sortedByGrade.findIndex((r) => r.learner.id === report.learner.id) + 1;

        // Stream position
        let streamPosition = undefined;
        let totalInStream = undefined;
        if (report.historicalStream || report.learner.current_stream_id) {
          const streamReports = reportsData.filter(
            (r) => (r.historicalStream?.id || r.learner.current_stream_id) === 
                   (report.historicalStream?.id || report.learner.current_stream_id)
          );
          const sortedByStream = [...streamReports].sort((a, b) => b.overallAverage - a.overallAverage);
          streamPosition = sortedByStream.findIndex((r) => r.learner.id === report.learner.id) + 1;
          totalInStream = streamReports.length;
        }

        return {
          ...report,
          gradePosition,
          totalInGrade: gradeReports.length,
          streamPosition,
          totalInStream,
        };
      });

      setReportData(reportsWithPositions);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Learner Reports</h1>
            <p className="text-muted-foreground">Generate performance reports for multiple learners</p>
          </div>
          <Button onClick={() => setPerformanceReportOpen(true)} className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Performance Report
          </Button>
        </div>

        {/* Compact Filters - matching PerformanceReportDialog style */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Filter Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Academic Year *</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
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
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
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
                  <Label className="text-xs">Grade *</Label>
                  <Select value={selectedGrade} onValueChange={handleGradeChange}>
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
                    value={selectedStream} 
                    onValueChange={setSelectedStream}
                    disabled={!selectedGrade}
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

                <div className="space-y-1.5">
                  <Label className="text-xs">Options</Label>
                  <div className="flex items-center h-9 px-3 border rounded-md bg-background">
                    <Checkbox
                      id="combine"
                      checked={combineExamTypes}
                      onCheckedChange={(checked) => setCombineExamTypes(checked as boolean)}
                      className="mr-2"
                    />
                    <Label htmlFor="combine" className="text-xs cursor-pointer whitespace-nowrap">
                      Combine exams
                    </Label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm"
                  onClick={handleGenerateReport} 
                  disabled={loading || !selectedGrade || !selectedYear || !selectedTerm}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-1.5" />
                      Generate Reports
                    </>
                  )}
                </Button>
                
                {reportData.length > 0 && (
                  <>
                    <Button size="sm" variant="outline" onClick={handlePrint}>
                      <Download className="h-4 w-4 mr-1.5" />
                      Download Reports
                    </Button>
                    <Button size="sm" variant="outline" onClick={handlePrintMarksSheet}>
                      <Download className="h-4 w-4 mr-1.5" />
                      Download Marks Sheet
                    </Button>
                  </>
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
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Click "Download/Print All" to generate a combined PDF document with all learner reports.
              </div>
              
              {/* Learner List with Journey Button */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Admission No.</th>
                      <th className="text-left p-3 text-sm font-medium">Name</th>
                      <th className="text-left p-3 text-sm font-medium">Grade</th>
                      <th className="text-left p-3 text-sm font-medium">Stream</th>
                      <th className="text-center p-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map(({ learner, historicalGrade, historicalStream }) => (
                      <tr key={learner.id} className="border-t hover:bg-muted/50">
                        <td className="p-3 text-sm">{learner.admission_number}</td>
                        <td className="p-3 text-sm">
                          {learner.first_name} {learner.last_name}
                        </td>
                        <td className="p-3 text-sm">{historicalGrade?.name || learner.current_grade?.name}</td>
                        <td className="p-3 text-sm">{historicalStream?.name || learner.current_stream?.name}</td>
                        <td className="p-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLearnerId(learner.id);
                              setJourneyDialogOpen(true);
                            }}
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            View Journey
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Journey Dialog */}
        <LearnerJourneyDialog
          open={journeyDialogOpen}
          onOpenChange={setJourneyDialogOpen}
          learnerId={selectedLearnerId}
        />

        {/* Performance Report Dialog */}
        <PerformanceReportDialog
          open={performanceReportOpen}
          onOpenChange={setPerformanceReportOpen}
        />

        {/* Hidden print area */}
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            {reportData.map(({ learner, performanceRecords, historicalGrade, historicalStream, gradePosition, totalInGrade, streamPosition, totalInStream }, index) => (
              <div key={learner.id} style={{ pageBreakAfter: index < reportData.length - 1 ? 'always' : 'auto' }}>
                <PrintablePerformanceReport
                  learner={{
                    ...learner,
                    current_grade: historicalGrade || learner.current_grade,
                    current_stream: historicalStream || learner.current_stream,
                  }}
                  performance={performanceRecords}
                  academicYear={selectedYear}
                  term={selectedTerm}
                  examType={combineExamTypes ? undefined : examTypes.join(", ")}
                  gradePosition={gradePosition}
                  totalInGrade={totalInGrade}
                  streamPosition={streamPosition}
                  totalInStream={totalInStream}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Hidden marks sheet print area */}
        <div style={{ display: 'none' }}>
          <div ref={marksSheetRef}>
            {(() => {
              // Get all unique learning areas from performance records
              const allLearningAreas = new Map();
              reportData.forEach(({ performanceRecords }) => {
                performanceRecords.forEach((record: any) => {
                  if (record.learning_area && !allLearningAreas.has(record.learning_area.id)) {
                    allLearningAreas.set(record.learning_area.id, {
                      code: record.learning_area.code,
                      name: record.learning_area.name
                    });
                  }
                });
              });
              const learningAreasArray = Array.from(allLearningAreas.values());

              return (
                <div style={{ padding: '15mm', fontFamily: 'Arial, sans-serif', fontSize: '9px' }}>
                  {/* Header with School Info */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #333' }}>
                    {schoolInfo?.logo_url && (
                      <img src={schoolInfo.logo_url} alt="School Logo" style={{ maxWidth: '60px', marginRight: '15px' }} />
                    )}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {schoolInfo?.school_name || "School Name"}
                      </div>
                      <div style={{ fontSize: '10px', color: '#666' }}>
                        {schoolInfo?.address && <span>{schoolInfo.address} | </span>}
                        {schoolInfo?.phone && <span>Tel: {schoolInfo.phone} | </span>}
                        {schoolInfo?.email && <span>Email: {schoolInfo.email}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Report Title */}
                  <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Learner Marks Sheet - {selectedGradeData?.name}
                    {selectedStream && ` - ${streams.find(s => s.id === selectedStream)?.name}`}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginBottom: '15px' }}>
                    Academic Year: {selectedYear} | Term: {selectedTerm.replace("term_", "Term ")}
                  </div>

                  {/* Marks Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #333', padding: '5px', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '30px' }}>#</th>
                        <th style={{ border: '1px solid #333', padding: '5px', backgroundColor: '#f5f5f5', fontWeight: 'bold', minWidth: '80px' }}>Admission No.</th>
                        <th style={{ border: '1px solid #333', padding: '5px', backgroundColor: '#f5f5f5', fontWeight: 'bold', minWidth: '150px', textAlign: 'left' }}>Learner Name</th>
                        {learningAreasArray.map((area, idx) => (
                          <th key={idx} style={{ border: '1px solid #333', padding: '5px', backgroundColor: '#f5f5f5', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }} title={area.name}>
                            {area.code}
                          </th>
                        ))}
                        <th style={{ border: '1px solid #333', padding: '5px', backgroundColor: '#f5f5f5', fontWeight: 'bold', minWidth: '50px', textAlign: 'center' }}>Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map(({ learner, performanceRecords }, index) => {
                        // Group performance by learning area for this learner
                        const learnerPerformance = new Map();
                        performanceRecords.forEach((record: any) => {
                          if (record.learning_area) {
                            const areaId = record.learning_area.id;
                            if (!learnerPerformance.has(areaId)) {
                              learnerPerformance.set(areaId, []);
                            }
                            learnerPerformance.get(areaId).push(record.marks);
                          }
                        });

                        // Calculate averages per learning area
                        const areaAverages = learningAreasArray.map(area => {
                          const areaId = Array.from(allLearningAreas.entries())
                            .find(([, value]) => value.code === area.code)?.[0];
                          const marks = learnerPerformance.get(areaId) || [];
                          if (marks.length === 0) return null;
                          const avg = marks.reduce((a: number, b: number) => a + b, 0) / marks.length;
                          return Math.round(avg * 10) / 10;
                        });

                        // Calculate overall average
                        const validAverages = areaAverages.filter(avg => avg !== null) as number[];
                        const overallAvg = validAverages.length > 0
                          ? Math.round((validAverages.reduce((a, b) => a + b, 0) / validAverages.length) * 10) / 10
                          : null;

                        return (
                          <tr key={learner.id}>
                            <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{index + 1}</td>
                            <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>{learner.admission_number}</td>
                            <td style={{ border: '1px solid #ddd', padding: '4px' }}>{learner.first_name} {learner.last_name}</td>
                            {areaAverages.map((avg, idx) => (
                              <td key={idx} style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center', fontWeight: avg ? 'bold' : 'normal' }}>
                                {avg !== null ? avg.toFixed(1) : '-'}
                              </td>
                            ))}
                            <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f9fafb' }}>
                              {overallAvg !== null ? overallAvg.toFixed(1) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Footer with dynamic page counter */}
                  <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#666' }}>
                    <div>Generated: {new Date().toLocaleDateString()} | Total Learners: {reportData.length}</div>
                    <div className="page-number"></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .page-break-before {
            page-break-before: always;
          }
          @page {
            margin: 15mm;
            size: A4 landscape;
          }
          @page {
            @bottom-right {
              content: "Page " counter(page) " of " counter(pages);
            }
          }
          .page-number::after {
            content: "Page " counter(page);
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default BulkLearnerReports;
