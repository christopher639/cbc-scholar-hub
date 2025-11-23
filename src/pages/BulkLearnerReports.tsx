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
import { useReactToPrint } from "react-to-print";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";

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
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            {reportData.map(({ learner, performanceRecords }, index) => (
              <div key={learner.id} style={{ pageBreakAfter: 'always' }}>
                <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
                    {schoolInfo?.logo_url && (
                      <img src={schoolInfo.logo_url} alt="School Logo" style={{ maxWidth: '100px', marginBottom: '10px' }} />
                    )}
                    <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
                      {schoolInfo?.school_name || "School Name"}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {schoolInfo?.address && <div>{schoolInfo.address}</div>}
                      {schoolInfo?.phone && <div>Tel: {schoolInfo.phone}</div>}
                      {schoolInfo?.email && <div>Email: {schoolInfo.email}</div>}
                    </div>
                  </div>

                  {/* Report Title */}
                  <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', margin: '20px 0', textTransform: 'uppercase' }}>
                    Academic Performance Report
                  </div>

                  {/* Student Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '20px 0', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                    <div>
                      <div style={{ display: 'flex', margin: '5px 0' }}>
                        <span style={{ fontWeight: 'bold', width: '150px', color: '#333' }}>Name:</span>
                        <span style={{ color: '#666' }}>{learner.first_name} {learner.last_name}</span>
                      </div>
                      <div style={{ display: 'flex', margin: '5px 0' }}>
                        <span style={{ fontWeight: 'bold', width: '150px', color: '#333' }}>Admission No:</span>
                        <span style={{ color: '#666' }}>{learner.admission_number}</span>
                      </div>
                      <div style={{ display: 'flex', margin: '5px 0' }}>
                        <span style={{ fontWeight: 'bold', width: '150px', color: '#333' }}>Grade:</span>
                        <span style={{ color: '#666' }}>{learner.current_grade?.name}</span>
                      </div>
                      {learner.current_stream && (
                        <div style={{ display: 'flex', margin: '5px 0' }}>
                          <span style={{ fontWeight: 'bold', width: '150px', color: '#333' }}>Stream:</span>
                          <span style={{ color: '#666' }}>{learner.current_stream.name}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', margin: '5px 0' }}>
                        <span style={{ fontWeight: 'bold', width: '150px', color: '#333' }}>Academic Year:</span>
                        <span style={{ color: '#666' }}>{selectedYear}</span>
                      </div>
                      <div style={{ display: 'flex', margin: '5px 0' }}>
                        <span style={{ fontWeight: 'bold', width: '150px', color: '#333' }}>Term:</span>
                        <span style={{ color: '#666' }}>{selectedTerm.replace("term_", "Term ")}</span>
                      </div>
                      <div style={{ display: 'flex', margin: '5px 0' }}>
                        <span style={{ fontWeight: 'bold', width: '150px', color: '#333' }}>Report Date:</span>
                        <span style={{ color: '#666' }}>{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Table */}
                  {(() => {
                    // Group records by learning area
                    const groupedRecords = performanceRecords.reduce((acc: any, record: any) => {
                      const areaName = record.learning_area?.name || "N/A";
                      if (!acc[areaName]) acc[areaName] = [];
                      acc[areaName].push(record);
                      return acc;
                    }, {});

                    const getRemarkFromMarks = (marks: number) => {
                      if (marks >= 76) return "E.E";
                      if (marks >= 51) return "M.E";
                      if (marks >= 26) return "B.E";
                      return "D.E";
                    };

                    return (
                      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '15px 0', fontSize: '11px' }}>
                        <thead>
                          <tr>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '30px' }}>#</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Learning Area</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '60px' }}>Opener</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '60px' }}>Mid-Term</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '60px' }}>Final</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '60px' }}>Average</th>
                            <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', backgroundColor: '#f5f5f5', fontWeight: 'bold', width: '50px' }}>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {performanceRecords && performanceRecords.length > 0 ? (
                            Object.entries(groupedRecords).map(([areaName, records]: [string, any], idx: number) => {
                              const opening = records.find((r: any) => r.exam_type?.toLowerCase().includes('opener'));
                              const midterm = records.find((r: any) => r.exam_type?.toLowerCase().includes('mid'));
                              const final = records.find((r: any) => r.exam_type?.toLowerCase().includes('final'));
                              
                              const marks = [opening?.marks, midterm?.marks, final?.marks].filter(m => m != null);
                              const average = marks.length > 0 ? (marks.reduce((a, b) => a + b, 0) / marks.length) : 0;
                              const remark = getRemarkFromMarks(average);

                              return (
                                <tr key={idx}>
                                  <td style={{ border: '1px solid #ddd', padding: '6px' }}>{idx + 1}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '6px' }}>{areaName}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{opening?.marks || '-'}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{midterm?.marks || '-'}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{final?.marks || '-'}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{average.toFixed(1)}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{remark}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={7} style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', color: '#999' }}>
                                No performance records available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    );
                  })()}

                  {/* Performance Graph & Summary */}
                  {performanceRecords && performanceRecords.length > 0 && (
                    <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                      {/* Performance Graph */}
                      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Performance Trend</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '4px' }}>
                          {(() => {
                            const groupedRecords = performanceRecords.reduce((acc: any, record: any) => {
                              const areaName = record.learning_area?.name || "N/A";
                              if (!acc[areaName]) acc[areaName] = [];
                              acc[areaName].push(record);
                              return acc;
                            }, {});

                            return Object.entries(groupedRecords).map(([areaName, records]: [string, any], idx: number) => {
                              const marks = (records as any[]).map((r: any) => r.marks).filter(m => m != null);
                              const average = marks.length > 0 ? (marks.reduce((a, b) => a + b, 0) / marks.length) : 0;
                              const height = (average / 100) * 100;

                              return (
                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ 
                                    width: '100%', 
                                    height: `${height}%`, 
                                    backgroundColor: '#666',
                                    borderRadius: '2px 2px 0 0',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'center',
                                    paddingTop: '2px'
                                  }}>
                                    <span style={{ fontSize: '8px', color: '#000', fontWeight: 'bold' }}>{average.toFixed(0)}</span>
                                  </div>
                                  <div style={{ fontSize: '7px', marginTop: '4px', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {areaName.substring(0, 8)}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Summary Stats */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>Total Subjects</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                            {Object.keys(performanceRecords.reduce((acc: any, r: any) => ({ ...acc, [r.learning_area?.name]: 1 }), {})).length}
                          </div>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>Overall Average</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                            {(performanceRecords.reduce((sum: number, p: any) => sum + Number(p.marks), 0) / performanceRecords.length).toFixed(1)}%
                          </div>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>Grade Legend</div>
                          <div style={{ fontSize: '8px', lineHeight: '1.4' }}>
                            E.E: 76-100 | M.E: 51-75<br/>
                            B.E: 26-50 | D.E: 0-25
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer with Signatures */}
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: '1px solid #333', width: '150px', margin: '20px auto 5px' }}></div>
                      <div style={{ fontSize: '10px', color: '#666' }}>Class Teacher</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: '1px solid #333', width: '150px', margin: '20px auto 5px' }}></div>
                      <div style={{ fontSize: '10px', color: '#666' }}>Principal</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: '1px solid #333', width: '150px', margin: '20px auto 5px' }}></div>
                      <div style={{ fontSize: '10px', color: '#666' }}>Parent/Guardian</div>
                    </div>
                  </div>

                  {/* Generation Info */}
                  <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '9px', color: '#999' }}>
                    Generated on {new Date().toLocaleString()} | This is a computer-generated report
                  </div>
                </div>
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
